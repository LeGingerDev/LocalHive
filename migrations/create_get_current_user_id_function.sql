-- Function to get the current authenticated user's ID
-- This allows us to test if auth.uid() is working correctly in database context
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;

COMMENT ON FUNCTION public.get_current_user_id() IS 'Returns the UUID of the currently authenticated user via auth.uid()'; 