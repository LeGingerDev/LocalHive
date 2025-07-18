-- Fix ambiguous column reference in RLS can_create functions
-- The issue is that both usage_record and limits_record have similar column names

-- Update the can_create_group function to use the new usage tracking system
CREATE OR REPLACE FUNCTION can_create_group(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_groups_count INTEGER;
  max_groups_limit INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage count from user_usage table
  SELECT COALESCE(groups_count, 0) INTO current_groups_count
  FROM get_user_usage(user_uuid);
  
  -- Get max groups limit from subscription plans
  SELECT COALESCE(max_groups, 1) INTO max_groups_limit
  FROM get_user_limits(user_uuid);
  
  -- Return true if user has room for more groups
  RETURN current_groups_count < max_groups_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the can_create_item function to use the new usage tracking system
CREATE OR REPLACE FUNCTION can_create_item(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status subscription_status;
  current_items_count INTEGER;
  max_items_limit INTEGER;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage count from user_usage table
  SELECT COALESCE(items_count, 0) INTO current_items_count
  FROM get_user_usage(user_uuid);
  
  -- Get max items limit from subscription plans
  SELECT COALESCE(max_items, 10) INTO max_items_limit
  FROM get_user_limits(user_uuid);
  
  -- Return true if user has room for more items
  RETURN current_items_count < max_items_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the can_use_ai_search function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION can_use_ai_search(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ai_search_enabled_flag BOOLEAN;
BEGIN
  -- Get AI search enabled status directly
  SELECT COALESCE(ai_search_enabled, false) INTO ai_search_enabled_flag
  FROM get_user_limits(user_uuid);
  
  -- Return AI search enabled status
  RETURN ai_search_enabled_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION can_create_group(UUID) IS 'Checks if a user can create a new group based on their subscription limits (FIXED to use usage tracking)';
COMMENT ON FUNCTION can_create_item(UUID) IS 'Checks if a user can create a new item based on their subscription limits (FIXED to use usage tracking)';
COMMENT ON FUNCTION can_use_ai_search(UUID) IS 'Checks if a user can use AI search based on their subscription plan (FIXED ambiguous columns)'; 