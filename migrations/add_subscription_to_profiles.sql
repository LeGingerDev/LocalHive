-- Add subscription-related columns to profiles table
-- This migration adds subscription status, expiration dates, and trial information

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('free', 'trial', 'pro', 'expired');

-- Add subscription columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires ON public.profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends ON public.profiles(trial_ends_at);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription status: free, trial, pro, or expired';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'When the pro subscription expires (null for free/trial users)';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'When the trial period ends (null for non-trial users)';
COMMENT ON COLUMN public.profiles.subscription_updated_at IS 'When subscription status was last updated';

-- Create trigger to update subscription_updated_at column
CREATE OR REPLACE FUNCTION update_subscription_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
     OLD.subscription_expires_at IS DISTINCT FROM NEW.subscription_expires_at OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    NEW.subscription_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_subscription_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at_column(); 