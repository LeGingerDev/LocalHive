# Subscription Service Documentation

## Overview

The Subscription Service manages user subscription status, usage limits, and integrates with RevenueCat for in-app purchases. It provides a comprehensive system for handling free, trial, and pro subscription tiers.

## Key Features

- **Multi-tier subscriptions**: Free, Trial, Pro, and Expired statuses
- **Usage tracking**: Monitor groups and items created
- **AI search control**: Enable/disable AI features based on subscription
- **RevenueCat integration**: Proper in-app purchase handling
- **Automatic sync**: Real-time subscription status updates
- **Platform integration**: Proper subscription management through App Store/Google Play

## Subscription Status Types

```typescript
export type SubscriptionStatus = "free" | "trial" | "pro" | "expired"
```

- **free**: Basic user with limited features
- **trial**: Temporary access to pro features (3 days)
- **pro**: Full subscription with unlimited features
- **expired**: Previously subscribed, now expired

## RevenueCat Integration

### Proper Subscription Management

The service now properly integrates with RevenueCat and platform stores (App Store/Google Play) for subscription management:

#### Key Features:
- **Platform-based cancellation**: Users manage subscriptions through their device's subscription settings
- **Real-time sync**: Automatic detection of subscription changes
- **Grace period handling**: Users keep access until billing period ends
- **Background refresh**: Detects changes when app returns from background

#### Subscription Management Flow:

1. **User clicks "Manage Subscription"** → Opens platform subscription settings
2. **User cancels in platform** → RevenueCat detects the change
3. **App syncs automatically** → Updates local database
4. **User keeps access** → Until end of billing period

#### Implementation Details:

```typescript
// Open platform subscription management
await revenueCatService.openSubscriptionManagement()

// Check if user can manage subscription
const canManage = await revenueCatService.canManageSubscription()

// Refresh subscription status (called when app comes back from background)
await revenueCatService.refreshSubscriptionStatus()
```

### Customer Info Update Listener

RevenueCat automatically listens for subscription changes and syncs with Supabase:

```typescript
// Automatically triggered when subscription status changes
Purchases.addCustomerInfoUpdateListener((customerInfo) => {
  // Handle subscription status changes
  this.handleSubscriptionStatusChange(customerInfo)
})
```

## Database Schema

### Profiles Table
```sql
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN subscription_updated_at TIMESTAMP WITH TIME ZONE;
```

### User Usage Table
```sql
CREATE TABLE user_usage (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  groups_count INTEGER DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Methods

### Core Subscription Methods

#### `getSubscriptionStatus(userId: string)`
Get the current subscription status for a user.

#### `getSubscriptionInfo(userId: string)`
Get comprehensive subscription information including usage and limits.

#### `updateSubscriptionStatus(userId: string, status: SubscriptionStatus)`
Update a user's subscription status (used by RevenueCat sync).

#### `upgradeToPro(userId: string, expiresAt: string)`
Upgrade a user to pro subscription with expiration date.

### Usage Tracking Methods

#### `getUserUsage(userId: string)`
Get current usage counts for groups and items.

#### `updateUserUsage(userId: string)`
Update usage counts based on current database state.

#### `canCreateGroup(userId: string)`
Check if user can create a new group.

#### `canCreateItem(userId: string)`
Check if user can create a new item.

#### `canUseAISearch(userId: string)`
Check if user can use AI search features.

## Subscription Plans

### Free Plan
- **Groups**: 3 maximum
- **Items**: 10 maximum
- **AI Search**: Disabled

### Trial Plan (3 days)
- **Groups**: Unlimited
- **Items**: Unlimited
- **AI Search**: Enabled

### Pro Plan
- **Groups**: Unlimited
- **Items**: Unlimited
- **AI Search**: Enabled
- **Price**: $5.99/month

## Usage Examples

### Check Subscription Status
```typescript
const { info } = await SubscriptionService.getSubscriptionInfo(userId)
if (info.subscription_status === "pro") {
  // User has pro subscription
}
```

### Check Usage Limits
```typescript
const { canCreate } = await SubscriptionService.canCreateGroup(userId)
if (canCreate) {
  // User can create a new group
}
```

### Upgrade to Pro
```typescript
const expiresAt = new Date()
expiresAt.setMonth(expiresAt.getMonth() + 1)

const { success } = await SubscriptionService.upgradeToPro(userId, expiresAt.toISOString())
```

### RevenueCat Integration
```typescript
// Purchase and sync with Supabase
const customerInfo = await revenueCatService.purchaseAndSync(userId, packageToPurchase)

// Open subscription management
await revenueCatService.openSubscriptionManagement()

// Check if user can manage subscription
const canManage = await revenueCatService.canManageSubscription()
```

## Error Handling

The service includes comprehensive error handling:

```typescript
const { success, error } = await SubscriptionService.updateSubscriptionStatus(userId, "pro")
if (!success) {
  console.error("Failed to update subscription:", error)
}
```

## Analytics Integration

All subscription events are tracked for analytics:

- `SUBSCRIPTION_STATUS_CHANGED`: When subscription status changes
- `TRIAL_ACTIVATED`: When trial is activated
- `PRO_UPGRADE`: When user upgrades to pro
- `APP_OPENED`: When app comes to foreground (triggers subscription refresh)

## Testing

Run the test suite:
```bash
npm test subscriptionService.test.ts
```

## Migration Notes

### From Fake Cancellation to Proper Management

**Before (Incorrect):**
```typescript
// ❌ This was fake - didn't actually cancel in platform
const { success } = await SubscriptionService.updateSubscriptionStatus(userId, "free")
```

**After (Correct):**
```typescript
// ✅ Opens platform subscription management
await revenueCatService.openSubscriptionManagement()

// ✅ RevenueCat automatically detects changes and syncs
// ✅ User keeps access until end of billing period
```

### Key Changes:
1. **Removed fake cancellation** from SubscriptionManagementModal
2. **Added platform integration** for proper subscription management
3. **Implemented automatic sync** when subscription status changes
4. **Added background refresh** to detect changes made in platform settings
5. **Improved user experience** with proper guidance and error handling

## Troubleshooting

### Subscription Not Updating
1. Check RevenueCat dashboard for subscription status
2. Verify user ID is properly set in RevenueCat
3. Check network connectivity for sync operations
4. Review console logs for sync errors

### Platform Management Not Opening
1. Verify device has internet connection
2. Check if user has active subscription to manage
3. Fallback to manual URL opening if automatic fails

### Usage Counts Incorrect
1. Run `updateUserUsage()` to recalculate counts
2. Check for orphaned records in database
3. Verify triggers are working correctly

## Future Enhancements

- [ ] Webhook integration for real-time updates
- [ ] Subscription analytics dashboard
- [ ] Promotional pricing support
- [ ] Family sharing support
- [ ] Enterprise subscription tiers 