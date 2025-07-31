-- Migration: Add group_id column to item_lists table
-- This migration adds a group_id column to the item_lists table to enable linking lists to groups
-- This replaces the lists array approach in groups table with a more normalized foreign key relationship

-- Add group_id column to item_lists table
ALTER TABLE public.item_lists 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Create index for better performance when querying lists by group
CREATE INDEX IF NOT EXISTS idx_item_lists_group_id ON public.item_lists(group_id);

-- Create index for better performance when querying lists by user and group
CREATE INDEX IF NOT EXISTS idx_item_lists_user_group ON public.item_lists(user_id, group_id);

-- Add comment for documentation
COMMENT ON COLUMN public.item_lists.group_id IS 'Foreign key reference to groups table. NULL means the list is personal (not linked to any group)';

-- Add RLS policy to allow users to view lists in groups they are members of
-- This policy allows users to see lists that belong to groups they are members of
CREATE POLICY "Users can view lists in groups they are members of" ON public.item_lists
FOR SELECT USING (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = item_lists.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Add RLS policy to allow users to update lists in groups they are members of
-- This policy allows users to update lists that belong to groups they are members of
CREATE POLICY "Users can update lists in groups they are members of" ON public.item_lists
FOR UPDATE USING (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = item_lists.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Add RLS policy to allow users to insert lists into groups they are members of
-- This policy allows users to create lists in groups they are members of
CREATE POLICY "Users can insert lists into groups they are members of" ON public.item_lists
FOR INSERT WITH CHECK (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = item_lists.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Add RLS policy to allow users to delete lists in groups they are members of
-- This policy allows users to delete lists that belong to groups they are members of
CREATE POLICY "Users can delete lists in groups they are members of" ON public.item_lists
FOR DELETE USING (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = item_lists.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Add comment for documentation
COMMENT ON POLICY "Users can view lists in groups they are members of" ON public.item_lists IS 'Allows users to view lists in groups they are members of, or their own personal lists';
COMMENT ON POLICY "Users can update lists in groups they are members of" ON public.item_lists IS 'Allows users to update lists in groups they are members of, or their own personal lists';
COMMENT ON POLICY "Users can insert lists into groups they are members of" ON public.item_lists IS 'Allows users to create lists in groups they are members of, or their own personal lists';
COMMENT ON POLICY "Users can delete lists in groups they are members of" ON public.item_lists IS 'Allows users to delete lists in groups they are members of, or their own personal lists'; 