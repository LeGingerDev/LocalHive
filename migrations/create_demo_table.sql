-- Create demo table for controlling demo mode visibility
CREATE TABLE IF NOT EXISTS demo (
  id SERIAL PRIMARY KEY,
  is_demo BOOLEAN DEFAULT false,
  demo_credentials JSONB DEFAULT '{"email": "demo@visu.app", "password": "demo123456"}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial record with demo mode disabled
INSERT INTO demo (is_demo) VALUES (false) ON CONFLICT DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_demo_updated_at 
    BEFORE UPDATE ON demo 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 