-- Add debug logging to get_user_subscription_info function
-- This will help us see what values are being returned

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