-- Fix RLS can_create functions to use user_usage table
-- The current functions are counting directly from tables instead of using the user_usage table

-- Update the can_create_group function to use user_usage
CREATE OR REPLACE FUNCTION can_create_group(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  usage_record RECORD;
  limits_record RECORD;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage from user_usage table
  SELECT * INTO usage_record FROM get_user_usage(user_uuid);
  
  -- Get subscription limits
  SELECT * INTO limits_record FROM get_user_limits(user_uuid);
  
  -- Return true if user has room for more groups
  RETURN COALESCE(usage_record.groups_count, 0) < COALESCE(limits_record.max_groups, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the can_create_item function to use user_usage
CREATE OR REPLACE FUNCTION can_create_item(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  usage_record RECORD;
  limits_record RECORD;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage from user_usage table
  SELECT * INTO usage_record FROM get_user_usage(user_uuid);
  
  -- Get subscription limits
  SELECT * INTO limits_record FROM get_user_limits(user_uuid);
  
  -- Return true if user has room for more items
  RETURN COALESCE(usage_record.items_count, 0) < COALESCE(limits_record.max_items, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the can_use_ai_search function to use user_limits
CREATE OR REPLACE FUNCTION can_use_ai_search(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  limits_record RECORD;
BEGIN
  -- Get subscription limits
  SELECT * INTO limits_record FROM get_user_limits(user_uuid);
  
  -- Return AI search enabled status
  RETURN COALESCE(limits_record.ai_search_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION can_create_group(UUID) IS 'Checks if a user can create a new group based on their subscription limits (UPDATED to use user_usage)';
COMMENT ON FUNCTION can_create_item(UUID) IS 'Checks if a user can create a new item based on their subscription limits (UPDATED to use user_usage)';
COMMENT ON FUNCTION can_use_ai_search(UUID) IS 'Checks if a user can use AI search based on their subscription plan (UPDATED to use user_limits)'; 