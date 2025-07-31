-- Add lists tracking to usage system
-- This migration updates the usage tracking to include lists count

-- Add lists_count column to user_usage table
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS lists_count INTEGER NOT NULL DEFAULT 0;

-- Update the update_user_usage function to include lists
CREATE OR REPLACE FUNCTION update_user_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user usage record
  INSERT INTO public.user_usage (user_id, groups_count, items_count, lists_count, last_updated)
  SELECT 
    user_uuid,
    COALESCE(groups.count, 0),
    COALESCE(items.count, 0),
    COALESCE(lists.count, 0),
    NOW()
  FROM 
    (SELECT COUNT(*) as count FROM public.groups WHERE creator_id = user_uuid) as groups,
    (SELECT COUNT(*) as count FROM public.items WHERE user_id = user_uuid) as items,
    (SELECT COUNT(*) as count FROM public.item_lists WHERE user_id = user_uuid) as lists
  ON CONFLICT (user_id) 
  DO UPDATE SET
    groups_count = EXCLUDED.groups_count,
    items_count = EXCLUDED.items_count,
    lists_count = EXCLUDED.lists_count,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_user_usage(UUID);

-- Update the get_user_usage function to include lists
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid UUID)
RETURNS TABLE(groups_count INTEGER, items_count INTEGER, lists_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(uu.groups_count, 0) as groups_count,
    COALESCE(uu.items_count, 0) as items_count,
    COALESCE(uu.lists_count, 0) as lists_count
  FROM public.user_usage uu
  WHERE uu.user_id = user_uuid;
  
  -- If no usage record exists, return 0s
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_user_limits(UUID);

-- Update the get_user_limits function to include lists
CREATE OR REPLACE FUNCTION get_user_limits(user_uuid UUID)
RETURNS TABLE(max_groups INTEGER, max_items INTEGER, max_lists INTEGER, ai_search_enabled BOOLEAN) AS $$
DECLARE
  user_status subscription_status;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  RETURN QUERY
  SELECT 
    sp.max_groups,
    sp.max_items,
    sp.max_lists,
    sp.ai_search_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_user_subscription_info(UUID);

-- Update the get_user_subscription_info function to include lists
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE(
  subscription_status subscription_status,
  groups_count INTEGER,
  items_count INTEGER,
  lists_count INTEGER,
  max_groups INTEGER,
  max_items INTEGER,
  max_lists INTEGER,
  ai_search_enabled BOOLEAN,
  can_create_group BOOLEAN,
  can_create_item BOOLEAN,
  can_create_list BOOLEAN,
  can_use_ai BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  user_status subscription_status;
  usage_record RECORD;
  limits_record RECORD;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage
  SELECT * INTO usage_record FROM get_user_usage(user_uuid);
  
  -- Get subscription limits
  SELECT * INTO limits_record FROM get_user_limits(user_uuid);
  
  RETURN QUERY
  SELECT 
    user_status,
    usage_record.groups_count,
    usage_record.items_count,
    usage_record.lists_count,
    limits_record.max_groups,
    limits_record.max_items,
    limits_record.max_lists,
    limits_record.ai_search_enabled,
    usage_record.groups_count < limits_record.max_groups,
    usage_record.items_count < limits_record.max_items,
    usage_record.lists_count < limits_record.max_lists,
    limits_record.ai_search_enabled,
    p.trial_ends_at,
    p.subscription_expires_at
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for lists table
CREATE OR REPLACE FUNCTION update_usage_on_list_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_usage(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_user_usage(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for item_lists table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'item_lists'
  ) THEN
    -- Create trigger for item_lists table
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_update_usage_on_list_change ON public.item_lists';
    EXECUTE 'CREATE TRIGGER trigger_update_usage_on_list_change
      AFTER INSERT OR DELETE ON public.item_lists
      FOR EACH ROW
      EXECUTE FUNCTION update_usage_on_list_change()';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.user_usage.lists_count IS 'Current number of lists created by the user';
COMMENT ON FUNCTION update_usage_on_list_change() IS 'Updates usage when lists are created or deleted'; 