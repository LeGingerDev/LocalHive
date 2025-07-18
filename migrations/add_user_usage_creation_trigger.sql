-- Add trigger to create user_usage record when a new profile is created
-- This ensures new users have usage tracking initialized

-- Function to handle new profile creation
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial user_usage record for the new user
  INSERT INTO public.user_usage (
    user_id,
    groups_count,
    items_count,
    last_updated
  ) VALUES (
    NEW.id,
    0, -- Start with 0 groups
    0, -- Start with 0 items
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_profile() IS 'Automatically creates a user_usage record when a new profile is created'; 