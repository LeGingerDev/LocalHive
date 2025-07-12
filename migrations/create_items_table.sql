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

-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category item_category NOT NULL,
  location TEXT,
  details TEXT,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT items_title_not_empty CHECK (title != '')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_group_id ON public.items(group_id);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.items IS 'Stores all items shared within groups';
COMMENT ON TYPE item_category IS 'Categories for items that can be shared within groups'; 