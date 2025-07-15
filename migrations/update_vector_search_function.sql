-- Drop the existing function
DROP FUNCTION IF EXISTS public.match_items_by_embedding(vector, integer, uuid[]);

-- Create the updated function with correct return type
CREATE OR REPLACE FUNCTION public.match_items_by_embedding(
  query_embedding vector,
  match_count integer DEFAULT 10,
  group_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE (
  id uuid,
  group_id uuid,
  user_id uuid,
  title text,
  category text,
  location text,
  details text,
  created_at timestamptz,
  updated_at timestamptz,
  image_urls text[],
  similarity float,
  profile_id uuid,
  full_name text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.group_id,
    i.user_id,
    i.title,
    i.category::text,  -- Cast enum to text
    i.location,
    i.details,
    i.created_at,
    i.updated_at,
    i.image_urls,
    1 - (i.embedding <=> query_embedding) AS similarity,
    p.id AS profile_id,
    p.full_name,
    p.email,
    p.avatar_url
  FROM
    public.items i
    LEFT JOIN public.profiles p ON i.user_id = p.id
  WHERE
    i.embedding IS NOT NULL
    AND i.group_id = ANY(group_ids)
  ORDER BY
    i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 