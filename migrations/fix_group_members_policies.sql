-- Fix infinite recursion in group_members policies
-- Enable Row Level Security
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Fix SELECT policy
ALTER POLICY "Members can view their group memberships"
  ON group_members
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR 
    -- Group creators can see all memberships in their groups
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_id AND creator_id = auth.uid()
    )
  );

-- Fix INSERT policy
ALTER POLICY "Allow adding members by self or admin"
  ON group_members
  WITH CHECK (
    -- Users can add themselves
    auth.uid() = user_id
    OR 
    -- Group creators can add anyone
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_id AND creator_id = auth.uid()
    )
  );

-- Fix DELETE policy
ALTER POLICY "Allow removal by self, creator, or admin"
  ON group_members
  USING (
    -- Users can remove themselves
    auth.uid() = user_id
    OR 
    -- Group creators can remove anyone
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_id AND creator_id = auth.uid()
    )
  );

-- Fix UPDATE policy
ALTER POLICY "Allow role updates by creator or admin"
  ON group_members
  USING (
    -- Only group creators can update roles
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_id AND creator_id = auth.uid()
    )
  ); 