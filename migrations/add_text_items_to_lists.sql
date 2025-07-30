-- Add support for text-only list items
-- This allows users to add simple text items like "bread" without creating full items

-- Add new columns to list_items table
ALTER TABLE public.list_items 
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS is_text_item BOOLEAN DEFAULT FALSE;

-- Update the unique constraint to allow multiple text items with the same name
-- but still prevent duplicate item_id entries
-- First drop the constraint that depends on the index
ALTER TABLE public.list_items DROP CONSTRAINT IF EXISTS list_items_list_id_item_id_key;
-- Then drop the index
DROP INDEX IF EXISTS list_items_list_id_item_id_key;
-- Create new unique index only for non-null item_id values
CREATE UNIQUE INDEX IF NOT EXISTS list_items_list_id_item_id_unique 
ON public.list_items(list_id, item_id) 
WHERE item_id IS NOT NULL;

-- Add constraint to ensure either item_id or text_content is provided
ALTER TABLE public.list_items 
ADD CONSTRAINT list_items_item_or_text_check 
CHECK (
  (item_id IS NOT NULL AND text_content IS NULL AND is_text_item = FALSE) OR
  (item_id IS NULL AND text_content IS NOT NULL AND is_text_item = TRUE)
);

-- Add comments for documentation
COMMENT ON COLUMN public.list_items.text_content IS 'Text content for free-form list items (e.g., "bread", "milk")';
COMMENT ON COLUMN public.list_items.is_text_item IS 'Whether this is a text-only item (not linked to an existing item)'; 