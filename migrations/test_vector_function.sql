-- Test the match_items_by_embedding function with proper vector format
-- First, let's check if the function exists and see its signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'match_items_by_embedding';

-- Test with a proper vector (1536 dimensions for OpenAI ada-002 model)
-- This creates a vector with 1536 zeros (neutral embedding)
SELECT * FROM match_items_by_embedding(
  array_fill(0.0::float, ARRAY[1536])::vector,  -- proper vector format
  5,                                             -- limit to 5 results
  ARRAY[]::uuid[]                                -- empty array to test with all groups
);

-- Alternative test with a smaller vector (if your embeddings are different size)
-- SELECT * FROM match_items_by_embedding(
--   array_fill(0.0::float, ARRAY[384])::vector,   -- for smaller embeddings
--   5,
--   ARRAY[]::uuid[]
-- ); 