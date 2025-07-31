-- Migration: Add lists field to groups table
-- This migration adds a lists field to the groups table to enable linking lists to groups

-- Add lists column to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS lists UUID[] DEFAULT '{}';

-- Create index for better performance when querying groups by lists
CREATE INDEX IF NOT EXISTS idx_groups_lists ON public.groups USING GIN (lists);

-- Add comment for documentation
COMMENT ON COLUMN public.groups.lists IS 'Array of list IDs linked to this group';

-- Update RLS policy to allow group members to view groups with lists
-- (This is already covered by existing policies, but documenting for clarity)
-- Existing policies allow users to view groups they are members of
-- and group creators can update their groups

-- Add trigger to validate list IDs exist in item_lists table
CREATE OR REPLACE FUNCTION validate_group_lists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all list IDs in the arrays exist in item_lists table
  IF NEW.lists IS NOT NULL AND array_length(NEW.lists, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.lists) AS list_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.item_lists WHERE id = list_id
      )
    ) THEN
      RAISE EXCEPTION 'One or more list IDs do not exist in item_lists table';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate lists before insert/update
CREATE TRIGGER validate_group_lists_trigger
BEFORE INSERT OR UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION validate_group_lists();

-- Add comment for documentation
COMMENT ON FUNCTION validate_group_lists() IS 'Validates that all list IDs in groups.lists array exist in item_lists table'; 