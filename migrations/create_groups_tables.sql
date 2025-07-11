-- Create enum types for group categories, member roles, and invitation status
CREATE TYPE group_category AS ENUM ('family', 'friends', 'work', 'community', 'hobby', 'travel', 'other');
CREATE TYPE member_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category group_category NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  member_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  CONSTRAINT groups_name_not_empty CHECK (name != '')
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, invitee_id, status)
);

-- Create group_posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  media_urls TEXT[],
  CONSTRAINT group_posts_content_not_empty CHECK (content != '')
);

-- Add personal_code column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personal_code TEXT UNIQUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_id ON public.group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_group_invitations_created_at ON public.group_invitations(created_at);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON public.group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON public.group_posts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view public groups" ON public.groups
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view groups they are members of" ON public.groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators can update their groups" ON public.groups
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Group creators can delete their groups" ON public.groups
  FOR DELETE USING (creator_id = auth.uid());

-- Group members policies
CREATE POLICY "Users can view members of groups they belong to" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Group admins can update member roles" ON public.group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can remove themselves from groups" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can remove any member" ON public.group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Group invitations policies
CREATE POLICY "Users can view invitations sent to them" ON public.group_invitations
  FOR SELECT USING (invitee_id = auth.uid());

CREATE POLICY "Users can view invitations they sent" ON public.group_invitations
  FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Group members can create invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Invitees can respond to their invitations" ON public.group_invitations
  FOR UPDATE USING (invitee_id = auth.uid());

-- Group posts policies
CREATE POLICY "Users can view posts in groups they belong to" ON public.group_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create posts" ON public.group_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts" ON public.group_posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON public.group_posts
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can delete any post" ON public.group_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Create trigger to update updated_at column for group_posts
CREATE TRIGGER update_group_posts_updated_at
BEFORE UPDATE ON public.group_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.groups IS 'Stores group information and metadata';
COMMENT ON TABLE public.group_members IS 'Tracks membership and roles within groups';
COMMENT ON TABLE public.group_invitations IS 'Manages group invitations and their status';
COMMENT ON TABLE public.group_posts IS 'Stores posts and content within groups';
COMMENT ON COLUMN public.profiles.personal_code IS 'Unique code for sharing and invitations'; 