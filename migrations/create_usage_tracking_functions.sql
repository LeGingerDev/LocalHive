-- Create functions for tracking and updating user usage
-- This migration adds functions to automatically track user usage counts

-- Function to update user usage counts
CREATE OR REPLACE FUNCTION update_user_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user usage record
  INSERT INTO public.user_usage (user_id, groups_count, items_count, last_updated)
  SELECT 
    user_uuid,
    COALESCE(groups.count, 0),
    COALESCE(items.count, 0),
    NOW()
  FROM 
    (SELECT COUNT(*) as count FROM public.groups WHERE creator_id = user_uuid) as groups,
    (SELECT COUNT(*) as count FROM public.items WHERE user_id = user_uuid) as items
  ON CONFLICT (user_id) 
  DO UPDATE SET
    groups_count = EXCLUDED.groups_count,
    items_count = EXCLUDED.items_count,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid UUID)
RETURNS TABLE(groups_count INTEGER, items_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(uu.groups_count, 0) as groups_count,
    COALESCE(uu.items_count, 0) as items_count
  FROM public.user_usage uu
  WHERE uu.user_id = user_uuid;
  
  -- If no usage record exists, return 0s
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::INTEGER, 0::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription limits
CREATE OR REPLACE FUNCTION get_user_limits(user_uuid UUID)
RETURNS TABLE(max_groups INTEGER, max_items INTEGER, ai_search_enabled BOOLEAN) AS $$
DECLARE
  user_status subscription_status;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  RETURN QUERY
  SELECT 
    sp.max_groups,
    sp.max_items,
    sp.ai_search_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive user subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE(
  subscription_status subscription_status,
  groups_count INTEGER,
  items_count INTEGER,
  max_groups INTEGER,
  max_items INTEGER,
  ai_search_enabled BOOLEAN,
  can_create_group BOOLEAN,
  can_create_item BOOLEAN,
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
    limits_record.max_groups,
    limits_record.max_items,
    limits_record.ai_search_enabled,
    usage_record.groups_count < limits_record.max_groups,
    usage_record.items_count < limits_record.max_items,
    limits_record.ai_search_enabled,
    p.trial_ends_at,
    p.subscription_expires_at
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update usage when groups/items are created/deleted
-- Trigger for groups table
CREATE OR REPLACE FUNCTION update_usage_on_group_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_usage(NEW.creator_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_user_usage(OLD.creator_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for groups table
DROP TRIGGER IF EXISTS trigger_update_usage_on_group_change ON public.groups;
CREATE TRIGGER trigger_update_usage_on_group_change
  AFTER INSERT OR DELETE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_on_group_change();

-- Trigger for items table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'items'
  ) THEN
    -- Create trigger for items table
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_update_usage_on_item_change ON public.items';
    EXECUTE 'CREATE TRIGGER trigger_update_usage_on_item_change
      AFTER INSERT OR DELETE ON public.items
      FOR EACH ROW
      EXECUTE FUNCTION update_usage_on_group_change()';
  END IF;
END $$;

-- Function to initialize usage for existing users
CREATE OR REPLACE FUNCTION initialize_all_user_usage()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  count INTEGER := 0;
BEGIN
  FOR user_record IN SELECT id FROM public.profiles LOOP
    PERFORM update_user_usage(user_record.id);
    count := count + 1;
  END LOOP;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION update_user_usage(UUID) IS 'Updates the usage counts for a specific user';
COMMENT ON FUNCTION get_user_usage(UUID) IS 'Returns the current usage counts for a user';
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Returns the subscription limits for a user based on their current status';
COMMENT ON FUNCTION get_user_subscription_info(UUID) IS 'Returns comprehensive subscription information including status, usage, limits, and permissions';
COMMENT ON FUNCTION initialize_all_user_usage() IS 'Initializes usage tracking for all existing users (run once after migration)'; 