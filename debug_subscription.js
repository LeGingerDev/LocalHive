// Debug script to check subscription state
// Run this in your Supabase SQL editor to see what's happening

-- Check current user's profile subscription status
SELECT 
  id,
  full_name,
  email,
  subscription_status,
  subscription_expires_at,
  trial_ends_at,
  subscription_updated_at
FROM public.profiles 
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Check user usage
SELECT 
  user_id,
  groups_count,
  items_count,
  last_updated
FROM public.user_usage 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'your-email@example.com');

-- Check subscription plans
SELECT * FROM public.subscription_plans;

-- Test the subscription status function
SELECT get_user_subscription_status((SELECT id FROM public.profiles WHERE email = 'your-email@example.com'));

-- Test the comprehensive subscription info function
SELECT * FROM get_user_subscription_info((SELECT id FROM public.profiles WHERE email = 'your-email@example.com'));

-- Check if there are any recent subscription updates
SELECT 
  id,
  full_name,
  email,
  subscription_status,
  subscription_expires_at,
  subscription_updated_at
FROM public.profiles 
WHERE subscription_status = 'pro'
ORDER BY subscription_updated_at DESC
LIMIT 10; 