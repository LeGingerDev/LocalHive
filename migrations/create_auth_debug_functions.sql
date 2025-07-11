-- Function to get the current authenticated user's ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.uid();
$$;

-- Function to get auth.role()
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.role()::text;
$$;

-- Function to check if the RLS condition would pass
CREATE OR REPLACE FUNCTION public.test_rls_condition(test_creator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY definer
AS $$
  SELECT test_creator_id = auth.uid();
$$;

-- Function to get detailed auth info for debugging
CREATE OR REPLACE FUNCTION public.get_auth_debug_info()
RETURNS json
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'is_authenticated', (auth.role() = 'authenticated'),
    'jwt_claims', current_setting('request.jwt.claims', true)::json
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.test_rls_condition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_rls_condition(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_auth_debug_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_debug_info() TO anon; 