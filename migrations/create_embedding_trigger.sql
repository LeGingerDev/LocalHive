-- Create a function to handle embedding generation via HTTP
CREATE OR REPLACE FUNCTION trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function asynchronously
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-item-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'item_id', NEW.id,
      'title', NEW.title,
      'details', NEW.notes,
      'category', NEW.category,
      'location', NEW.location
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER items_embedding_trigger
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_embedding_generation();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http; 