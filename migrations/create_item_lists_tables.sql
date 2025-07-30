-- Create Item Lists tables
-- These tables are designed to work alongside existing items and profiles tables
-- No RLS policies are applied - they work regardless of authentication state

-- Create lists table
CREATE TABLE IF NOT EXISTS public.item_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT item_lists_name_not_empty CHECK (name != '')
);

-- Create list items junction table
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.item_lists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, item_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_lists_user_id ON public.item_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_item_lists_created_at ON public.item_lists(created_at);
CREATE INDEX IF NOT EXISTS idx_item_lists_is_active ON public.item_lists(is_active);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_item_id ON public.list_items(item_id);
CREATE INDEX IF NOT EXISTS idx_list_items_is_completed ON public.list_items(is_completed);

-- Create triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_item_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_list_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to both tables
CREATE TRIGGER update_item_lists_updated_at
BEFORE UPDATE ON public.item_lists
FOR EACH ROW
EXECUTE FUNCTION update_item_lists_updated_at();

CREATE TRIGGER update_list_items_updated_at
BEFORE UPDATE ON public.list_items
FOR EACH ROW
EXECUTE FUNCTION update_list_items_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.item_lists IS 'Stores user-created lists for organizing items';
COMMENT ON TABLE public.list_items IS 'Junction table linking lists to items with additional metadata';
COMMENT ON COLUMN public.item_lists.name IS 'Name/title of the list';
COMMENT ON COLUMN public.item_lists.description IS 'Optional description of the list';
COMMENT ON COLUMN public.item_lists.is_active IS 'Whether the list is active or archived';
COMMENT ON COLUMN public.list_items.quantity IS 'Quantity of the item in this list';
COMMENT ON COLUMN public.list_items.notes IS 'User notes for this specific item in the list';
COMMENT ON COLUMN public.list_items.is_completed IS 'Whether this item has been completed/checked off'; 