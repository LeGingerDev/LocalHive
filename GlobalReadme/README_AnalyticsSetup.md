# Firebase Analytics Setup

This document outlines the Firebase Analytics integration in the LocalHive app.

## Overview

Firebase Analytics has been integrated to track user behavior, app usage, and key events throughout the application.

## Setup

### 1. Firebase Project Configuration
- Firebase project created with Android app registered
- Package name: `com.legingerdev.visu`
- `google-services.json` file placed in `android/app/`

### 2. Dependencies Installed
```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### 3. Android Configuration
- Google Services plugin added to `android/build.gradle`
- Google Services plugin applied in `android/app/build.gradle`

## Architecture

### Analytics Service (`app/services/analyticsService.ts`)
- Wraps Firebase Analytics with a clean interface
- Provides methods for tracking events, screen views, and user properties
- Includes error handling and logging

### Analytics Hook (`app/hooks/useAnalytics.ts`)
- React hook for easy access to analytics functions
- Provides consistent interface across components

## Usage

### Basic Event Tracking
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const MyComponent = () => {
  const { trackEvent } = useAnalytics()
  
  const handleButtonPress = () => {
    trackEvent({
      name: 'button_pressed',
      properties: {
        button_name: 'submit',
        screen: 'home'
      }
    })
  }
}
```

### Screen View Tracking
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const MyScreen = () => {
  const { trackScreenView } = useAnalytics()
  
  useEffect(() => {
    trackScreenView({ screenName: 'MyScreen' })
  }, [trackScreenView])
}
```

### User Properties
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const MyComponent = () => {
  const { setUserProperties } = useAnalytics()
  
  const updateUserProperties = () => {
    setUserProperties({
      user_type: 'premium',
      subscription_status: 'active'
    })
  }
}
```

## Predefined Events

The following events are predefined in `AnalyticsEvents`:

### App Lifecycle
- `APP_OPENED` - App comes to foreground
- `APP_BACKGROUNDED` - App goes to background

### Authentication
- `USER_SIGNED_IN` - User signs in
- `USER_SIGNED_OUT` - User signs out

### Groups
- `GROUP_CREATED` - New group created
- `GROUP_JOINED` - User joins group
- `GROUP_LEFT` - User leaves group
- `INVITATION_SENT` - Invitation sent
- `INVITATION_ACCEPTED` - Invitation accepted
- `INVITATION_DECLINED` - Invitation declined

### Items
- `ITEM_ADDED` - New item added
- `ITEM_VIEWED` - Item viewed
- `ITEM_EDITED` - Item edited
- `ITEM_DELETED` - Item deleted

### Search
- `SEARCH_PERFORMED` - Search executed
- `AI_SEARCH_PERFORMED` - AI search executed

### Navigation
- `SCREEN_VIEWED` - Screen viewed

### Errors
- `ERROR_OCCURRED` - Error occurred

## Integration Points

### Automatic Tracking
- **App Lifecycle**: Tracked automatically in `app/app.tsx`
- **Authentication**: Tracked automatically in `app/context/AuthContext.tsx`
- **Screen Views**: Can be added to individual screens

### Manual Tracking
- User actions (button presses, form submissions)
- Feature usage (search, item management)
- Error tracking

## Privacy Considerations

- Analytics collection can be disabled via `setAnalyticsCollectionEnabled(false)`
- User consent should be obtained before tracking
- No personally identifiable information is tracked by default
- User ID is only set after authentication

## Testing

### Development
- Events are logged to console for debugging
- Firebase console shows real-time events
- Test events appear in Firebase Analytics dashboard

### Production
- Events are sent to Firebase Analytics
- Data appears in Firebase console after processing (24-48 hours)
- Custom dashboards can be created in Firebase Analytics

## Next Steps

1. **Add more event tracking** to key user actions
2. **Create custom dashboards** in Firebase Analytics
3. **Set up conversion tracking** for important user flows
4. **Add A/B testing** capabilities if needed
5. **Implement crash reporting** with Firebase Crashlytics

## Troubleshooting

### Common Issues
- **Events not appearing**: Check Firebase console, events may take time to process
- **Build errors**: Ensure `google-services.json` is in correct location
- **Permission errors**: Check Firebase project settings and API keys

### Debug Mode
- Enable debug logging in development
- Check console for analytics event logs
- Verify Firebase project configuration 