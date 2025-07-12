-- Create enum type for item categories
CREATE TYPE item_category AS ENUM (
  'food',
  'drinks',
  'household',
  'electronics',
  'clothing',
  'health',
  'beauty',
  'books',
  'sports',
  'toys',
  'automotive',
  'garden',
  'office',
  'entertainment',
  'other'
);

-- Create separate items table
CREATE TABLE IF NOT EXISTS public.group_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category item_category NOT NULL,
  location TEXT,
  notes TEXT,
  media_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT group_items_title_not_empty CHECK (title != '')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON public.group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_items_user_id ON public.group_items(user_id);
CREATE INDEX IF NOT EXISTS idx_group_items_category ON public.group_items(category);
CREATE INDEX IF NOT EXISTS idx_group_items_created_at ON public.group_items(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.group_items ENABLE ROW LEVEL SECURITY;

-- Group items policies
CREATE POLICY "Users can view items in groups they belong to" ON public.group_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create items" ON public.group_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own items" ON public.group_items
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own items" ON public.group_items
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can delete any item" ON public.group_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_group_items_updated_at
BEFORE UPDATE ON public.group_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.group_items IS 'Stores items shared within groups';
COMMENT ON TYPE item_category IS 'Categories for items that can be shared within groups'; 