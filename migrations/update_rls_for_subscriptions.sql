-- Update RLS policies to respect subscription limits
-- This migration adds subscription-aware policies to existing tables

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS subscription_status AS $$
DECLARE
  user_status subscription_status;
  trial_ends TIMESTAMPTZ;
  sub_expires TIMESTAMPTZ;
BEGIN
  -- Get user's subscription info
  SELECT subscription_status, trial_ends_at, subscription_expires_at 
  INTO user_status, trial_ends, sub_expires
  FROM public.profiles 
  WHERE id = user_uuid;
  
  -- Handle trial expiration
  IF user_status = 'trial' AND trial_ends IS NOT NULL AND trial_ends < NOW() THEN
    RETURN 'free';
  END IF;
  
  -- Handle pro subscription expiration
  IF user_status = 'pro' AND sub_expires IS NOT NULL AND sub_expires < NOW() THEN
    RETURN 'expired';
  END IF;
  
  RETURN COALESCE(user_status, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create more groups
CREATE OR REPLACE FUNCTION can_create_group(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_groups INTEGER;
  max_groups INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current group count
  SELECT COUNT(*) INTO current_groups
  FROM public.groups 
  WHERE creator_id = user_uuid;
  
  -- Get max groups for subscription
  SELECT max_groups INTO max_groups
  FROM public.subscription_plans 
  WHERE name = user_status::text;
  
  RETURN current_groups < max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create more items
CREATE OR REPLACE FUNCTION can_create_item(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_items INTEGER;
  max_items INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current item count
  SELECT COUNT(*) INTO current_items
  FROM public.items 
  WHERE user_id = user_uuid;
  
  -- Get max items for subscription
  SELECT max_items INTO max_items
  FROM public.subscription_plans 
  WHERE name = user_status::text;
  
  RETURN current_items < max_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use AI search
CREATE OR REPLACE FUNCTION can_use_ai_search(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  ai_enabled BOOLEAN;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Check if AI search is enabled for this subscription
  SELECT ai_search_enabled INTO ai_enabled
  FROM public.subscription_plans 
  WHERE name = user_status::text;
  
  RETURN COALESCE(ai_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update RLS policies after all functions are created

-- Update groups table policies to include subscription limits
-- Drop the existing INSERT policy and recreate with subscription limits
DROP POLICY IF EXISTS "groups_insert_authenticated" ON public.groups;

CREATE POLICY "groups_insert_authenticated" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid() AND 
    can_create_group(auth.uid())
  );

-- Update items table policies to include subscription limits
-- Enable RLS on items table (currently disabled)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for items table
-- Users can view items in groups they belong to
CREATE POLICY "items_select_accessible" ON public.items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = items.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can create items within their subscription limits
CREATE POLICY "items_insert_authenticated" ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    can_create_item(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = items.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can update their own items
CREATE POLICY "items_update_owner" ON public.items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own items
CREATE POLICY "items_delete_owner" ON public.items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable RLS on group_posts table (currently disabled)
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for group_posts table
-- Users can view posts in groups they belong to
CREATE POLICY "group_posts_select_accessible" ON public.group_posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can create posts in groups they belong to
CREATE POLICY "group_posts_insert_authenticated" ON public.group_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can update their own posts
CREATE POLICY "group_posts_update_owner" ON public.group_posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "group_posts_delete_owner" ON public.group_posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON FUNCTION get_user_subscription_status(UUID) IS 'Returns the effective subscription status for a user, handling trial and subscription expiration';
COMMENT ON FUNCTION can_create_group(UUID) IS 'Checks if a user can create a new group based on their subscription limits';
COMMENT ON FUNCTION can_create_item(UUID) IS 'Checks if a user can create a new item based on their subscription limits';
COMMENT ON FUNCTION can_use_ai_search(UUID) IS 'Checks if a user can use AI search based on their subscription plan'; 