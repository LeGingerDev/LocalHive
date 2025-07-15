-- Add embedding column to items table for vector search
-- This column will store OpenAI embeddings as vectors

-- First, ensure the pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column to the items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an index on the embedding column for efficient similarity searches
CREATE INDEX IF NOT EXISTS idx_items_embedding ON public.items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add a comment for documentation
COMMENT ON COLUMN public.items.embedding IS 'OpenAI text-embedding-ada-002 embeddings for semantic search (1536 dimensions)'; 