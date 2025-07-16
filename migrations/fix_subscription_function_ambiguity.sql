-- Fix subscription function ambiguity errors
-- This migration fixes the column reference ambiguity in can_create_group and can_create_item functions

-- Function to check if user can create more groups (FIXED)
CREATE OR REPLACE FUNCTION can_create_group(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_groups INTEGER;
  plan_max_groups INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current group count
  SELECT COUNT(*) INTO current_groups
  FROM public.groups 
  WHERE creator_id = user_uuid;
  
  -- Get max groups for subscription (using explicit table alias)
  SELECT sp.max_groups INTO plan_max_groups
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  RETURN current_groups < plan_max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create more items (FIXED)
CREATE OR REPLACE FUNCTION can_create_item(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_items INTEGER;
  plan_max_items INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current item count
  SELECT COUNT(*) INTO current_items
  FROM public.items 
  WHERE user_id = user_uuid;
  
  -- Get max items for subscription (using explicit table alias)
  SELECT sp.max_items INTO plan_max_items
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  RETURN current_items < plan_max_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use AI search (FIXED)
CREATE OR REPLACE FUNCTION can_use_ai_search(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  ai_enabled BOOLEAN;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Check if AI search is enabled for this subscription (using explicit table alias)
  SELECT sp.ai_search_enabled INTO ai_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  RETURN COALESCE(ai_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription limits (FIXED)
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

-- Add comments for documentation
COMMENT ON FUNCTION can_create_group(UUID) IS 'Checks if a user can create a new group based on their subscription limits (FIXED)';
COMMENT ON FUNCTION can_create_item(UUID) IS 'Checks if a user can create a new item based on their subscription limits (FIXED)';
COMMENT ON FUNCTION can_use_ai_search(UUID) IS 'Checks if a user can use AI search based on their subscription plan (FIXED)';
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Returns the subscription limits for a user based on their current status (FIXED)'; 