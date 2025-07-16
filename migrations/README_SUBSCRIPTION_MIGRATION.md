# Subscription System Migration Guide

This document outlines the database migrations required to implement the subscription system.

## Migration Files (Run in Order)

1. **add_subscription_to_profiles.sql**
   - Adds subscription status, expiration dates, and trial information to profiles table
   - Creates subscription_status enum
   - Adds indexes for performance

2. **create_subscription_limits.sql**
   - Creates the update_updated_at_column function (required for triggers)
   - Creates subscription_plans table with plan definitions
   - Creates user_usage table for tracking current usage
   - Inserts default plans (free, trial, pro)
   - Sets up RLS policies

3. **update_rls_for_subscriptions.sql**
   - Creates functions to check subscription status and limits
   - Updates RLS policies to respect subscription limits
   - Adds server-side validation for group and item creation

4. **create_usage_tracking_functions.sql**
   - Creates functions to track and update user usage
   - Adds triggers to automatically update usage counts
   - Provides comprehensive subscription info functions

## Key Database Functions

### Subscription Status Functions
- `get_user_subscription_status(user_uuid)` - Returns effective subscription status
- `can_create_group(user_uuid)` - Checks if user can create more groups
- `can_create_item(user_uuid)` - Checks if user can create more items
- `can_use_ai_search(user_uuid)` - Checks if user can use AI search

### Usage Tracking Functions
- `update_user_usage(user_uuid)` - Updates usage counts for a user
- `get_user_usage(user_uuid)` - Returns current usage counts
- `get_user_limits(user_uuid)` - Returns subscription limits
- `get_user_subscription_info(user_uuid)` - Returns comprehensive subscription info

## Subscription Plans

| Plan | Groups | Items | AI Search | Trial Days | Monthly Price |
|------|--------|-------|-----------|------------|---------------|
| Free | 1 | 10 | ❌ | 0 | $0.00 |
| Trial | Unlimited | Unlimited | ✅ | 3 | $0.00 |
| Pro | Unlimited | Unlimited | ✅ | 0 | $5.99 |

## Post-Migration Steps

1. **Initialize Usage for Existing Users**
   ```sql
   SELECT initialize_all_user_usage();
   ```

2. **Verify Migration**
   ```sql
   -- Check subscription plans
   SELECT * FROM subscription_plans;
   
   -- Check user usage (should be populated)
   SELECT * FROM user_usage LIMIT 5;
   
   -- Test subscription functions
   SELECT get_user_subscription_info('your-user-id');
   ```

## RLS Policy Changes

- **Groups**: Users can only create groups within their subscription limits
- **Items**: Users can only create items within their subscription limits
- **AI Search**: Controlled by subscription plan (free users cannot use AI search)

## Important Notes

- All existing users will start with 'free' subscription status
- Usage counts are automatically tracked via database triggers
- Trial expiration is handled automatically by the `get_user_subscription_status` function
- Pro subscription expiration is handled automatically
- No data loss occurs when subscriptions expire - users keep all existing data

## Testing the Migration

1. Create a test user
2. Verify they start with 'free' status
3. Test group creation (should allow 1 group)
4. Test item creation (should allow 10 items)
5. Test AI search (should be disabled)
6. Update user to 'trial' status and test full access
7. Update user to 'pro' status and test unlimited access 