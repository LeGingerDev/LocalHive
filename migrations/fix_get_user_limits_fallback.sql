-- Fix get_user_limits function with proper fallback handling
-- This ensures that if plan lookup fails, we get reasonable defaults

CREATE OR REPLACE FUNCTION get_user_limits(user_uuid UUID)
RETURNS TABLE(max_groups INTEGER, max_items INTEGER, ai_search_enabled BOOLEAN) AS $$
DECLARE
  user_status subscription_status;
  plan_record RECORD;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  
  -- Try to find the subscription plan
  SELECT * INTO plan_record
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  -- If plan not found, use defaults based on status
  IF plan_record IS NULL THEN
    CASE user_status
      WHEN 'free' THEN
        RETURN QUERY SELECT 1, 10, false;
      WHEN 'trial' THEN
        RETURN QUERY SELECT 999999, 999999, true;
      WHEN 'pro' THEN
        RETURN QUERY SELECT 999999, 999999, true;
      WHEN 'expired' THEN
        RETURN QUERY SELECT 1, 10, false;
      ELSE
        RETURN QUERY SELECT 1, 10, false;
    END CASE;
  ELSE
    -- Return the found plan
    RETURN QUERY
    SELECT 
      plan_record.max_groups,
      plan_record.max_items,
      plan_record.ai_search_enabled;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_user_limits(UUID) IS 'Returns the subscription limits for a user with fallback handling (FIXED)'; 