-- Create a profiles table that is linked to the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  theme_preference TEXT DEFAULT 'light',
  use_system_theme BOOLEAN DEFAULT TRUE,
  avatar_url TEXT
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow the service role to read all profiles
CREATE POLICY "Service role can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Allow the service role to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Allow the service role to update profiles
CREATE POLICY "Service role can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Comment on the table and columns
COMMENT ON TABLE public.profiles IS 'Stores user profile information linked to auth.users';
COMMENT ON COLUMN public.profiles.id IS 'References the auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.full_name IS 'User display name';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user avatar image';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when the profile was last updated';
COMMENT ON COLUMN public.profiles.theme_preference IS 'User theme preference (light/dark)';
COMMENT ON COLUMN public.profiles.use_system_theme IS 'Whether to use system theme settings'; 