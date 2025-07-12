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

-- Add item-specific columns to group_posts table
ALTER TABLE public.group_posts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS category item_category,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint to ensure title is not empty when provided
ALTER TABLE public.group_posts 
ADD CONSTRAINT group_posts_title_not_empty 
CHECK (title IS NULL OR title != '');

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_group_posts_category ON public.group_posts(category);

-- Add comments for documentation
COMMENT ON TYPE item_category IS 'Categories for items that can be shared within groups';
COMMENT ON COLUMN public.group_posts.title IS 'Title of the item being shared';
COMMENT ON COLUMN public.group_posts.category IS 'Category of the item';
COMMENT ON COLUMN public.group_posts.location IS 'Location where the item can be found';
COMMENT ON COLUMN public.group_posts.notes IS 'Additional notes about the item'; 