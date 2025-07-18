-- Fix subscription plan lookup issue
-- The get_user_limits function might not be finding the correct subscription plan

-- First, let's see what subscription plans exist
-- This will help us understand the naming convention

-- Update the get_user_limits function to be more robust
CREATE OR REPLACE FUNCTION get_user_limits(user_uuid UUID)
RETURNS TABLE(max_groups INTEGER, max_items INTEGER, ai_search_enabled BOOLEAN) AS $$
DECLARE
  user_status subscription_status;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Debug log
  RAISE NOTICE 'DEBUG: user_status = %, looking for plan with name = %', user_status, user_status::text;
  
  RETURN QUERY
  SELECT 
    COALESCE(sp.max_groups, 1) AS max_groups,
    COALESCE(sp.max_items, 10) AS max_items,
    COALESCE(sp.ai_search_enabled, false) AS ai_search_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  -- If no plan found, return default values
  IF NOT FOUND THEN
    RAISE NOTICE 'DEBUG: No subscription plan found for status %, using defaults', user_status;
    RETURN QUERY SELECT 1::INTEGER, 10::INTEGER, false::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the get_user_subscription_info function to handle null values better
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
  RAISE NOTICE 'DEBUG: user_status = %', user_status;
  
  -- Get current usage
  SELECT * INTO usage_record FROM get_user_usage(user_uuid);
  RAISE NOTICE 'DEBUG: usage_record = %', usage_record;
  
  -- Get subscription limits
  SELECT * INTO limits_record FROM get_user_limits(user_uuid);
  RAISE NOTICE 'DEBUG: limits_record = %', limits_record;
  
  -- Debug the comparison
  RAISE NOTICE 'DEBUG: groups_count < max_groups: % < % = %', 
    usage_record.groups_count, 
    limits_record.max_groups, 
    usage_record.groups_count < limits_record.max_groups;
  
  RETURN QUERY
  SELECT 
    user_status AS subscription_status,
    COALESCE(usage_record.groups_count, 0) AS groups_count,
    COALESCE(usage_record.items_count, 0) AS items_count,
    COALESCE(limits_record.max_groups, 1) AS max_groups,
    COALESCE(limits_record.max_items, 10) AS max_items,
    COALESCE(limits_record.ai_search_enabled, false) AS ai_search_enabled,
    (COALESCE(usage_record.groups_count, 0) < COALESCE(limits_record.max_groups, 1)) AS can_create_group,
    (COALESCE(usage_record.items_count, 0) < COALESCE(limits_record.max_items, 10)) AS can_create_item,
    COALESCE(limits_record.ai_search_enabled, false) AS can_use_ai,
    p.trial_ends_at AS trial_ends_at,
    p.subscription_expires_at AS subscription_expires_at
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Returns the subscription limits for a user based on their current status (FIXED with defaults)';
COMMENT ON FUNCTION get_user_subscription_info(UUID) IS 'Returns comprehensive subscription information including status, usage, limits, and permissions (FIXED with defaults)'; 