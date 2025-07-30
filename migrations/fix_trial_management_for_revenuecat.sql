-- Fix trial management to let RevenueCat handle trials entirely
-- This migration removes the custom trial expiration logic that conflicts with RevenueCat

-- Update the get_user_subscription_status function to remove custom trial expiration
-- RevenueCat will handle trial management, so we only need to handle pro subscription expiration
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS subscription_status AS $$
DECLARE
  user_status subscription_status;
  sub_expires TIMESTAMPTZ;
BEGIN
  -- Get user's subscription info
  SELECT subscription_status, subscription_expires_at 
  INTO user_status, sub_expires
  FROM public.profiles 
  WHERE id = user_uuid;
  
  -- Only handle pro subscription expiration (RevenueCat handles trials)
  IF user_status = 'pro' AND sub_expires IS NOT NULL AND sub_expires < NOW() THEN
    RETURN 'expired';
  END IF;
  
  RETURN COALESCE(user_status, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the change
COMMENT ON FUNCTION get_user_subscription_status(UUID) IS 'Returns the effective subscription status for a user. RevenueCat handles trial management, this function only handles pro subscription expiration.';

-- Remove the trial_ends_at column from profiles table since RevenueCat manages trials
-- Note: We'll keep the column for now to avoid breaking existing data, but it won't be used
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS trial_ends_at;

-- Update the subscription info function to not rely on trial_ends_at
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
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
  current_groups INTEGER;
  current_items INTEGER;
  max_groups INTEGER;
  max_items INTEGER;
  ai_enabled BOOLEAN;
  sub_expires TIMESTAMPTZ;
BEGIN
  -- Get user's subscription status (RevenueCat managed)
  user_status := get_user_subscription_status(user_uuid);
  
  -- Get current usage
  SELECT COALESCE(usage.groups_count, 0), COALESCE(usage.items_count, 0)
  INTO current_groups, current_items
  FROM public.user_usage usage
  WHERE usage.user_id = user_uuid;
  
  -- Get subscription limits
  SELECT sp.max_groups, sp.max_items, sp.ai_search_enabled
  INTO max_groups, max_items, ai_enabled
  FROM public.subscription_plans sp
  WHERE sp.name = user_status::text;
  
  -- Get subscription expiration (only for pro subscriptions)
  SELECT p.subscription_expires_at
  INTO sub_expires
  FROM public.profiles p
  WHERE p.id = user_uuid;
  
  -- Return comprehensive subscription info
  RETURN QUERY SELECT
    user_status,
    current_groups,
    current_items,
    COALESCE(max_groups, 1),
    COALESCE(max_items, 10),
    COALESCE(ai_enabled, false),
    current_groups < COALESCE(max_groups, 1),
    current_items < COALESCE(max_items, 10),
    COALESCE(ai_enabled, false),
    NULL::TIMESTAMPTZ, -- trial_ends_at is managed by RevenueCat, not stored in database
    sub_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the updated function
COMMENT ON FUNCTION get_user_subscription_info(UUID) IS 'Returns comprehensive subscription information. Trial management is handled by RevenueCat, not stored in database.'; 