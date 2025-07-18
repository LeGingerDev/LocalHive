-- Fix existing profiles without user_usage records
-- This migration creates user_usage records for profiles that don't have them

-- Function to create missing user_usage records
CREATE OR REPLACE FUNCTION create_missing_user_usage()
RETURNS INTEGER AS $$
DECLARE
  profile_record RECORD;
  count INTEGER := 0;
BEGIN
  -- Find profiles that don't have corresponding user_usage records
  FOR profile_record IN 
    SELECT p.id
    FROM public.profiles p
    LEFT JOIN public.user_usage uu ON p.id = uu.user_id
    WHERE uu.user_id IS NULL
  LOOP
    -- Create user_usage record for this profile
    INSERT INTO public.user_usage (
      user_id,
      groups_count,
      items_count,
      last_updated
    ) VALUES (
      profile_record.id,
      0, -- Start with 0 groups
      0, -- Start with 0 items
      NOW()
    );
    
    count := count + 1;
  END LOOP;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create missing user_usage records
SELECT create_missing_user_usage() as usage_records_created;

-- Add comment for documentation
COMMENT ON FUNCTION create_missing_user_usage() IS 'Creates user_usage records for existing profiles that don''t have them'; 