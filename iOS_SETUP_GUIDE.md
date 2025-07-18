# iOS Setup Guide for Visu App

This guide covers all the requirements to get iOS builds working for your React Native app.

## 🚨 Critical Issues to Fix

### 1. **Apple Developer Account Setup**
You need an Apple Developer Account ($99/year) to build and distribute iOS apps.

**Steps:**
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign up for Apple Developer Program
3. Note your Team ID (found in Membership section)

### 2. **App Store Connect App Setup**
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app with bundle ID: `com.legingerdev.visu`
3. Note the App ID (found in App Information)

### 3. **Firebase Configuration** ✅ **COMPLETED**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Add iOS app with bundle ID: `com.legingerdev.visu`
5. Download `GoogleService-Info.plist`
6. Replace the placeholder file in `ios/GoogleService-Info.plist`

**Status**: ✅ Firebase iOS configuration is now properly set up with project ID `visu-1cebf`

### 4. **EAS Credentials Setup**
Run these commands to set up iOS credentials:

```bash
# Set up iOS credentials for all build profiles
eas credentials --platform ios --profile development
eas credentials --platform ios --profile development:device
eas credentials --platform ios --profile preview
eas credentials --platform ios --profile preview:device
eas credentials --platform ios --profile production
```

**What this will ask for:**
- Apple ID email
- App Store Connect App ID
- Apple Team ID
- Distribution certificate (EAS can generate this)
- Provisioning profile (EAS can generate this)

### 5. **Update EAS Configuration**
Update `eas.json` with your actual values:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your_actual_apple_id@example.com",
        "ascAppId": "your_actual_app_store_connect_app_id",
        "appleTeamId": "your_actual_apple_team_id"
      }
    }
  }
}
```

## 🏗️ Build Commands

### Development Builds (Remote - Recommended for Windows)
```bash
# iOS Simulator
npm run build:ios:sim:remote

# iOS Device
npm run build:ios:dev:remote
```

### Preview Builds (Remote)
```bash
# iOS for internal testing
npm run build:ios:preview:remote
```

### Production Builds (Remote)
```bash
# iOS for App Store
npm run build:ios:prod:remote
```

## 📱 Testing iOS Builds

### Simulator Testing
1. Build for simulator: `npm run build:ios:sim:remote`
2. Download the `.tar.gz` file from EAS
3. Extract and open in iOS Simulator

### Device Testing
1. Build for device: `npm run build:ios:dev:remote`
2. Download the `.ipa` file from EAS
3. Install using TestFlight or direct installation

## 🔧 Troubleshooting

### Common Build Errors

**1. Missing GoogleService-Info.plist**
- Ensure you've downloaded the correct file from Firebase Console
- Verify the bundle ID matches: `com.legingerdev.visu`

**2. Certificate/Provisioning Profile Issues**
- Run `eas credentials --platform ios --clear` to reset
- Then run `eas credentials --platform ios` to reconfigure

**3. Bundle ID Mismatch**
- Ensure bundle ID is consistent across:
  - `app.json` (`ios.bundleIdentifier`)
  - `app.config.ts` (`ios.bundleIdentifier`)
  - Firebase Console
  - App Store Connect

**4. Permission Issues**
- Verify all required permissions are in `app.config.ts`
- Check that usage descriptions are provided

### Environment Variables
Ensure these are set in your EAS project:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## 📋 Pre-Build Checklist

- [ ] Apple Developer Account active
- [ ] App Store Connect app created
- [ ] Firebase iOS app configured
- [ ] GoogleService-Info.plist downloaded and placed
- [ ] EAS credentials configured for all profiles
- [ ] Environment variables set in EAS
- [ ] Bundle ID consistent across all platforms
- [ ] App icons and splash screens ready
- [ ] Privacy policy and terms of service ready

## 🚀 Next Steps

1. **Complete Apple Developer Setup**
2. **Configure Firebase for iOS**
3. **Set up EAS credentials**
4. **Test development build**
5. **Test preview build**
6. **Submit to App Store**

## 📞 Support Resources

- [EAS iOS Build Documentation](https://docs.expo.dev/build/setup/ios-builds/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Expo iOS Permissions](https://docs.expo.dev/versions/latest/sdk/camera/) 