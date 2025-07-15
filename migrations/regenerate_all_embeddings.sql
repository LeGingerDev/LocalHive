-- Migration to regenerate embeddings for all existing items
-- This will update all items with improved embedding generation

-- First, let's create a function to regenerate embeddings for all items
CREATE OR REPLACE FUNCTION regenerate_all_item_embeddings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    item_record RECORD;
    embedding_text TEXT;
    openai_response JSONB;
    embedding_vector vector;
BEGIN
    -- Loop through all items that have the required fields
    FOR item_record IN 
        SELECT 
            id,
            title,
            details,
            category,
            location
        FROM items 
        WHERE title IS NOT NULL 
        AND title != ''
    LOOP
        -- Create the improved embedding text structure
        embedding_text := 'Title: ' || item_record.title || '. ';
        
        IF item_record.details IS NOT NULL AND item_record.details != '' THEN
            embedding_text := embedding_text || 'Details: ' || item_record.details || '. ';
        END IF;
        
        embedding_text := embedding_text || 'Category: ' || COALESCE(item_record.category, 'other') || '. ';
        
        IF item_record.location IS NOT NULL AND item_record.location != '' THEN
            embedding_text := embedding_text || 'Location: ' || item_record.location || '.';
        END IF;
        
        -- Note: This is a placeholder. In practice, you would need to call the OpenAI API
        -- from within the database, which requires additional setup (like pg_net extension)
        -- For now, we'll set a flag to indicate items need embedding regeneration
        
        -- Update the item to mark it for embedding regeneration
        UPDATE items 
        SET 
            updated_at = NOW(),
            -- Clear the existing embedding to force regeneration
            embedding = NULL
        WHERE id = item_record.id;
        
        RAISE NOTICE 'Marked item % for embedding regeneration: %', item_record.id, embedding_text;
    END LOOP;
    
    RAISE NOTICE 'All items have been marked for embedding regeneration. Run the edge function for each item to generate new embeddings.';
END;
$$;

-- Execute the function
SELECT regenerate_all_item_embeddings();

-- Clean up the temporary function
DROP FUNCTION regenerate_all_item_embeddings(); 