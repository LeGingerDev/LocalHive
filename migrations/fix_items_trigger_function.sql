-- Fix the trigger function for items table to use user_id instead of creator_id
-- This migration fixes the "record 'new' has no field 'creator_id'" error

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_usage_on_item_change ON public.items;

-- Create the correct trigger function for items table
CREATE OR REPLACE FUNCTION update_usage_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_usage(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_user_usage(OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the correct function
CREATE TRIGGER trigger_update_usage_on_item_change
  AFTER INSERT OR DELETE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_on_item_change();

-- Add comment for documentation
COMMENT ON FUNCTION update_usage_on_item_change() IS 'Updates user usage when items are created or deleted (uses user_id field)'; 