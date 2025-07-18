-- Debug subscription plan lookup issue
-- This migration adds debug logging to understand why pro users are getting free limits

-- Create a debug function to check subscription plan lookup
CREATE OR REPLACE FUNCTION debug_subscription_lookup(user_uuid UUID)
RETURNS TABLE(
  user_status subscription_status,
  plan_name TEXT,
  max_groups INTEGER,
  max_items INTEGER,
  ai_search_enabled BOOLEAN,
  debug_info JSONB
) AS $$
DECLARE
  user_status subscription_status;
  plan_record RECORD;
  debug_data JSONB;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Try to find the subscription plan
  SELECT * INTO plan_record
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  -- Build debug info
  debug_data := jsonb_build_object(
    'user_uuid', user_uuid,
    'user_status', user_status,
    'user_status_text', user_status::text,
    'plan_found', plan_record IS NOT NULL,
    'available_plans', (
      SELECT jsonb_agg(name) 
      FROM public.subscription_plans
    )
  );
  
  RETURN QUERY
  SELECT 
    user_status AS user_status,
    plan_record.name AS plan_name,
    plan_record.max_groups AS max_groups,
    plan_record.max_items AS max_items,
    plan_record.ai_search_enabled AS ai_search_enabled,
    debug_data AS debug_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION debug_subscription_lookup(UUID) IS 'Debug function to check subscription plan lookup issues'; 