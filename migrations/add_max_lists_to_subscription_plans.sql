-- Add max_lists column to subscription_plans table
-- This migration adds list limits to the subscription system

-- Add max_lists column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_lists INTEGER NOT NULL DEFAULT 5;

-- Update existing subscription plans with appropriate list limits
UPDATE public.subscription_plans 
SET max_lists = CASE 
  WHEN name = 'free' THEN 3
  WHEN name = 'trial' THEN 999999
  WHEN name = 'pro' THEN 999999
  WHEN name = 'expired' THEN 1
  ELSE 5
END
WHERE name IN ('free', 'trial', 'pro', 'expired');

-- Add constraint to ensure positive limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscription_plans_positive_list_limits'
    AND table_name = 'subscription_plans'
  ) THEN
    ALTER TABLE public.subscription_plans 
    ADD CONSTRAINT subscription_plans_positive_list_limits 
    CHECK (max_lists >= 0);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_plans.max_lists IS 'Maximum number of lists allowed (999999 = unlimited)';

-- Update the subscription_plans table comment to include lists
COMMENT ON TABLE public.subscription_plans IS 'Defines subscription plan limits and pricing (groups, items, lists)'; 