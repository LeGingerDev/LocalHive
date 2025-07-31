-- Add can_create_list function
-- This migration adds a function to check if a user can create a new list

-- Function to check if user can create a new list
CREATE OR REPLACE FUNCTION can_create_list(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_lists INTEGER;
BEGIN
  -- Get current list count
  SELECT COALESCE(lists_count, 0) INTO current_count
  FROM public.user_usage
  WHERE user_id = user_uuid;
  
  -- If no usage record exists, assume 0
  IF current_count IS NULL THEN
    current_count := 0;
  END IF;
  
  -- Get max lists from subscription plan
  SELECT sp.max_lists INTO max_lists
  FROM public.subscription_plans sp
  JOIN public.profiles p ON p.subscription_status = sp.name::subscription_status
  WHERE p.id = user_uuid;
  
  -- If no plan found, default to 0 (cannot create)
  IF max_lists IS NULL THEN
    max_lists := 0;
  END IF;
  
  -- Return true if current count is less than max
  RETURN current_count < max_lists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION can_create_list(UUID) IS 'Checks if a user can create a new list based on their subscription limits'; 