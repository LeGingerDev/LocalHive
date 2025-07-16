# Subscription Service Documentation

## Overview

The `SubscriptionService` provides a comprehensive interface for managing user subscriptions, usage tracking, and limit enforcement in the LocalHive application. It integrates with the database functions created in the subscription migrations to provide real-time subscription status and usage information.

## Features

- **Subscription Status Management**: Get and update user subscription status (free, trial, pro, expired)
- **Usage Tracking**: Monitor current usage of groups and items
- **Limit Enforcement**: Check if users can create groups, items, or use AI search
- **Trial Management**: Activate and manage trial periods
- **Upgrade Flow**: Handle subscription upgrades to pro
- **Analytics Integration**: Track subscription-related events
- **Real-time Updates**: Automatic usage tracking via database triggers

## Database Integration

The service integrates with the following database functions:

- `get_user_subscription_status(user_uuid)` - Returns effective subscription status
- `get_user_usage(user_uuid)` - Returns current usage counts
- `get_user_limits(user_uuid)` - Returns subscription limits
- `get_user_subscription_info(user_uuid)` - Returns comprehensive subscription info
- `can_create_group(user_uuid)` - Checks group creation permission
- `can_create_item(user_uuid)` - Checks item creation permission
- `can_use_ai_search(user_uuid)` - Checks AI search permission
- `update_user_usage(user_uuid)` - Updates usage counts
- `initialize_all_user_usage()` - Initializes usage for all users

## Usage

### Basic Usage

```typescript
import { SubscriptionService } from "@/services/subscriptionService"

// Get subscription info for a user
const { info, error } = await SubscriptionService.getSubscriptionInfo(userId)

if (info) {
  console.log(`User has ${info.groups_count}/${info.max_groups} groups`)
  console.log(`User has ${info.items_count}/${info.max_items} items`)
  console.log(`Can create group: ${info.can_create_group}`)
  console.log(`Can create item: ${info.can_create_item}`)
  console.log(`Can use AI search: ${info.can_use_ai}`)
}
```

### Using the React Hook

```typescript
import { useSubscription } from "@/hooks/useSubscription"

const MyComponent = ({ userId }) => {
  const {
    subscriptionInfo,
    isFree,
    isTrial,
    isPro,
    groupsUsed,
    groupsLimit,
    itemsUsed,
    itemsLimit,
    canCreateGroupNow,
    canCreateItemNow,
    canUseAISearchNow,
    loading,
    error,
    activateTrial,
    upgradeToPro,
  } = useSubscription(userId)

  const handleCreateGroup = async () => {
    if (!canCreateGroupNow) {
      // Show upgrade prompt
      return
    }
    // Create group logic
  }

  const handleActivateTrial = async () => {
    const { success, error } = await activateTrial()
    if (success) {
      // Trial activated successfully
    }
  }

  return (
    <View>
      <Text>Subscription: {subscriptionInfo?.subscription_status}</Text>
      <Text>Groups: {groupsUsed}/{groupsLimit}</Text>
      <Text>Items: {itemsUsed}/{itemsLimit}</Text>
      <Button 
        title="Create Group" 
        disabled={!canCreateGroupNow}
        onPress={handleCreateGroup}
      />
    </View>
  )
}
```

## API Reference

### SubscriptionService

#### `getSubscriptionStatus(userId: string)`
Returns the current subscription status for a user.

**Returns:**
```typescript
{
  status: "free" | "trial" | "pro" | "expired" | null
  error: PostgrestError | null
}
```

#### `getUserUsage(userId: string)`
Returns the current usage counts for a user.

**Returns:**
```typescript
{
  usage: {
    groups_count: number
    items_count: number
    last_updated: string
  } | null
  error: PostgrestError | null
}
```

#### `getUserLimits(userId: string)`
Returns the subscription limits for a user.

**Returns:**
```typescript
{
  limits: {
    max_groups: number
    max_items: number
    ai_search_enabled: boolean
  } | null
  error: PostgrestError | null
}
```

#### `getSubscriptionInfo(userId: string)`
Returns comprehensive subscription information.

**Returns:**
```typescript
{
  info: {
    subscription_status: SubscriptionStatus
    groups_count: number
    items_count: number
    max_groups: number
    max_items: number
    ai_search_enabled: boolean
    can_create_group: boolean
    can_create_item: boolean
    can_use_ai: boolean
    trial_ends_at: string | null
    subscription_expires_at: string | null
  } | null
  error: PostgrestError | null
}
```

#### `canCreateGroup(userId: string)`
Checks if a user can create a new group.

**Returns:**
```typescript
{
  canCreate: boolean
  error: PostgrestError | null
}
```

#### `canCreateItem(userId: string)`
Checks if a user can create a new item.

**Returns:**
```typescript
{
  canCreate: boolean
  error: PostgrestError | null
}
```

#### `canUseAISearch(userId: string)`
Checks if a user can use AI search.

**Returns:**
```typescript
{
  canUse: boolean
  error: PostgrestError | null
}
```

#### `updateSubscriptionStatus(userId: string, status: SubscriptionStatus, options?)`
Updates a user's subscription status.

**Parameters:**
- `userId`: User ID
- `status`: New subscription status
- `options`: Optional trial/subscription expiration dates

**Returns:**
```typescript
{
  success: boolean
  error: PostgrestError | null
}
```

#### `activateTrial(userId: string)`
Activates a 3-day trial for a user.

**Returns:**
```typescript
{
  success: boolean
  error: PostgrestError | null
}
```

#### `upgradeToPro(userId: string, expiresAt: string)`
Upgrades a user to pro subscription.

**Returns:**
```typescript
{
  success: boolean
  error: PostgrestError | null
}
```

#### `getSubscriptionPlans()`
Returns all available subscription plans.

**Returns:**
```typescript
{
  plans: SubscriptionPlan[] | null
  error: PostgrestError | null
}
```

#### `isApproachingLimits(userId: string)`
Checks if a user is approaching their limits (80% or more).

**Returns:**
```typescript
{
  approaching: boolean
  details: {
    groups: { current: number; max: number; percentage: number }
    items: { current: number; max: number; percentage: number }
  } | null
  error: PostgrestError | null
}
```

### useSubscription Hook

The `useSubscription` hook provides a React-friendly interface for subscription management.

**Parameters:**
- `userId: string | null` - The user ID to get subscription info for

**Returns:**
```typescript
{
  // Data
  subscriptionInfo: SubscriptionInfo | null
  subscriptionStatus: SubscriptionStatus
  
  // Computed values
  isFree: boolean
  isTrial: boolean
  isPro: boolean
  isExpired: boolean
  
  // Usage
  groupsUsed: number
  groupsLimit: number
  groupsPercentage: number
  itemsUsed: number
  itemsLimit: number
  itemsPercentage: number
  
  // Permissions
  canCreateGroupNow: boolean
  canCreateItemNow: boolean
  canUseAISearchNow: boolean
  
  // State
  loading: boolean
  error: string | null
  
  // Actions
  refresh: () => void
  activateTrial: () => Promise<{ success: boolean; error: string | null }>
  upgradeToPro: (expiresAt: string) => Promise<{ success: boolean; error: string | null }>
  canCreateGroup: () => Promise<boolean>
  canCreateItem: () => Promise<boolean>
  canUseAISearch: () => Promise<boolean>
  isApproachingLimits: () => Promise<{ approaching: boolean; details: any }>
}
```

## Subscription Plans

The system supports three subscription plans:

### Free Plan
- **Groups**: 1 group maximum
- **Items**: 10 items maximum
- **AI Search**: ❌ Disabled
- **Trial**: 0 days
- **Price**: $0.00/month

### Trial Plan
- **Groups**: Unlimited (999,999)
- **Items**: Unlimited (999,999)
- **AI Search**: ✅ Enabled
- **Trial**: 3 days
- **Price**: $0.00 (trial)

### Pro Plan
- **Groups**: Unlimited (999,999)
- **Items**: Unlimited (999,999)
- **AI Search**: ✅ Enabled
- **Trial**: 0 days
- **Price**: $5.99/month

## Analytics Events

The service automatically tracks the following analytics events:

- `subscription_status_changed` - When subscription status changes
- `trial_activated` - When a trial is activated
- `pro_upgrade` - When user upgrades to pro
- `upgrade_prompt_shown` - When upgrade prompt is shown
- `upgrade_attempted` - When user attempts to upgrade

## Error Handling

All service methods return error information in a consistent format:

```typescript
{
  data: T | null
  error: PostgrestError | null
}
```

Common error scenarios:
- **Network errors**: Connection issues with Supabase
- **Authentication errors**: User not authenticated
- **Permission errors**: User doesn't have required permissions
- **Database errors**: Issues with database functions or tables

## Testing

Run the subscription service tests:

```bash
npm test subscriptionService.test.ts
```

**Note**: Tests require a running Supabase instance with subscription migrations applied.

## Migration Requirements

Before using the subscription service, ensure the following migrations have been applied:

1. `add_subscription_to_profiles.sql`
2. `create_subscription_limits.sql`
3. `update_rls_for_subscriptions.sql`
4. `create_usage_tracking_functions.sql`

After migrations, initialize usage for existing users:

```sql
SELECT initialize_all_user_usage();
```

## Best Practices

1. **Always check permissions before actions**: Use `canCreateGroup`, `canCreateItem`, etc. before performing operations
2. **Handle loading states**: Use the `loading` state from the hook to show appropriate UI feedback
3. **Error handling**: Always check for errors and provide user-friendly error messages
4. **Real-time updates**: The service automatically updates usage via database triggers, but you can call `refresh()` to get the latest data
5. **Analytics**: The service automatically tracks important events, but you can add custom tracking as needed
6. **Upgrade prompts**: Use `isApproachingLimits` to show upgrade prompts before users hit their limits

## Integration Examples

### Group Creation with Limits

```typescript
const handleCreateGroup = async () => {
  const { canCreate, error } = await SubscriptionService.canCreateGroup(userId)
  
  if (error) {
    Alert.alert("Error", "Unable to check subscription limits")
    return
  }
  
  if (!canCreate) {
    // Show upgrade modal
    showUpgradeModal("groups")
    return
  }
  
  // Proceed with group creation
  createGroup()
}
```

### AI Search with Permission Check

```typescript
const handleAISearch = async () => {
  const { canUse, error } = await SubscriptionService.canUseAISearch(userId)
  
  if (error) {
    Alert.alert("Error", "Unable to check AI search permission")
    return
  }
  
  if (!canUse) {
    // Show upgrade modal for AI search
    showUpgradeModal("ai_search")
    return
  }
  
  // Proceed with AI search
  performAISearch()
}
```

### Upgrade Flow

```typescript
const handleUpgrade = async () => {
  const { success, error } = await activateTrial()
  
  if (error) {
    Alert.alert("Error", "Failed to activate trial")
    return
  }
  
  if (success) {
    Alert.alert("Success", "Trial activated! You now have 3 days of full access.")
    refresh() // Refresh subscription info
  }
}
``` 