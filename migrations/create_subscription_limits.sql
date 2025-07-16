-- Create subscription limits and usage tracking tables
-- This migration creates tables to track subscription limits and current user usage

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create subscription plans table to define limits for each plan
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  max_groups INTEGER NOT NULL,
  max_items INTEGER NOT NULL,
  ai_search_enabled BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscription_plans_name_not_empty CHECK (name != ''),
  CONSTRAINT subscription_plans_positive_limits CHECK (max_groups >= 0 AND max_items >= 0)
);

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  groups_count INTEGER NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, max_groups, max_items, ai_search_enabled, trial_days, price_monthly, price_yearly) VALUES
  ('free', 1, 10, false, 0, 0.00, 0.00),
  ('trial', 999999, 999999, true, 3, 0.00, 0.00),
  ('pro', 999999, 999999, true, 0, 5.99, 59.99)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON public.subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_last_updated ON public.user_usage(last_updated);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (read-only for all authenticated users)
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- User usage policies
CREATE POLICY "Users can read their own usage" ON public.user_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can read all usage" ON public.user_usage
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert usage" ON public.user_usage
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update usage" ON public.user_usage
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create trigger to update updated_at column for subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Defines subscription plan limits and pricing';
COMMENT ON TABLE public.user_usage IS 'Tracks current usage counts for each user';
COMMENT ON COLUMN public.subscription_plans.max_groups IS 'Maximum number of groups allowed (999999 = unlimited)';
COMMENT ON COLUMN public.subscription_plans.max_items IS 'Maximum number of items allowed (999999 = unlimited)';
COMMENT ON COLUMN public.subscription_plans.ai_search_enabled IS 'Whether AI search is enabled for this plan';
COMMENT ON COLUMN public.user_usage.groups_count IS 'Current number of groups created by the user';
COMMENT ON COLUMN public.user_usage.items_count IS 'Current number of items created by the user'; 