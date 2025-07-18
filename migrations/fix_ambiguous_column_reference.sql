-- Fix ambiguous column reference in get_user_limits function
-- The issue is that max_groups is both a function parameter and a table column

CREATE OR REPLACE FUNCTION get_user_limits(user_uuid UUID)
RETURNS TABLE(max_groups INTEGER, max_items INTEGER, ai_search_enabled BOOLEAN) AS $$
DECLARE
  user_status subscription_status;
  plan RECORD;
BEGIN
  -- Get user's subscription status
  user_status := get_user_subscription_status(user_uuid);
  RAISE NOTICE 'DEBUG: user_status = %, user_status::text = %', user_status, user_status::text;
  
  -- Check what subscription plans exist
  RAISE NOTICE 'DEBUG: Available subscription plans:';
  FOR plan IN SELECT name, max_groups, max_items FROM public.subscription_plans LOOP
    RAISE NOTICE 'DEBUG: Plan: name=%, max_groups=%, max_items=%', plan.name, plan.max_groups, plan.max_items;
  END LOOP;
  
  -- Return the limits for the user's subscription status
  RETURN QUERY
  SELECT 
    sp.max_groups,
    sp.max_items,
    sp.ai_search_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
END;
$$ LANGUAGE plpgsql; 