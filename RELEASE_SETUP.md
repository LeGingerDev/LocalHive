# 🚀 EAS Expo Release Setup Guide

This guide covers everything needed to prepare and release your React Native app using EAS Expo.

## 📋 Prerequisites

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Verify Project Setup
```bash
eas project:info
```

## 🔧 Environment Setup

### 1. Create Environment Files
Create the following files in your project root:

#### `.env.development`
```
EXPO_PUBLIC_SUPABASE_URL=https://xnnobyeytyycngybinqj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_development_anon_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_development_openai_key_here
EXPO_PROJECT_ID=aeb32659-7b8c-4496-9d94-875ce535b7da
```

#### `.env.preview`
```
EXPO_PUBLIC_SUPABASE_URL=https://xnnobyeytyycngybinqj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_preview_anon_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_preview_openai_key_here
EXPO_PROJECT_ID=aeb32659-7b8c-4496-9d94-875ce535b7da
```

#### `.env.production`
```
EXPO_PUBLIC_SUPABASE_URL=https://xnnobyeytyycngybinqj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_production_openai_key_here
EXPO_PROJECT_ID=aeb32659-7b8c-4496-9d94-875ce535b7da
```

### 2. Update EAS Configuration
Replace placeholder values in `eas.json`:
- Replace `your_development_anon_key_here` with actual development Supabase anon key
- Replace `your_preview_anon_key_here` with actual preview Supabase anon key  
- Replace `your_production_anon_key_here` with actual production Supabase anon key
- Replace OpenAI API keys for each environment

## 🔐 Credentials Setup

### iOS Credentials
```bash
# Set up iOS credentials
eas credentials --platform ios

# This will guide you through:
# 1. Apple Developer Account setup
# 2. App Store Connect App ID creation
# 3. Provisioning profile setup
# 4. Distribution certificate setup
```

### Android Credentials
```bash
# Set up Android credentials
eas credentials --platform android

# This will guide you through:
# 1. Google Play Console setup
# 2. Service account key creation
# 3. Keystore generation
```

## 🏗️ Build Configuration

### 1. Update App Version
In `app.json`, update the version:
```json
{
  "version": "1.0.0",
  "android": {
    "versionCode": 1
  },
  "ios": {
    "buildNumber": "1"
  }
}
```

### 2. Configure Build Profiles
The `eas.json` file is already configured with:
- **development**: For development builds with dev client
- **preview**: For internal testing builds
- **production**: For App Store/Play Store builds

## 🚀 Build Commands

### Development Builds (Local)
```bash
# iOS Simulator
npm run build:ios:sim

# iOS Device
npm run build:ios:dev

# Android Emulator
npm run build:android:sim

# Android Device
npm run build:android:dev
```

### Preview Builds (Remote)
```bash
# Both platforms for internal testing
npm run build:all:preview

# Individual platforms
npm run build:ios:preview:remote
npm run build:android:preview:remote
```

### Production Builds (Remote)
```bash
# Both platforms for store submission
npm run build:all:prod

# Individual platforms
npm run build:ios:prod:remote
npm run build:android:prod:remote
```

## 📱 Store Submission

### 1. iOS App Store
```bash
# Submit to App Store
npm run submit:ios

# Or manually:
eas submit --platform ios --profile production
```

### 2. Android Google Play Store
```bash
# Submit to Play Store
npm run submit:android

# Or manually:
eas submit --platform android --profile production
```

### 3. Both Platforms
```bash
npm run submit:all
```

## 🔄 Over-the-Air Updates

### 1. Configure Update Channels
```bash
# Create update channels
eas update:configure
```

### 2. Deploy Updates
```bash
# Preview channel
npm run update:preview

# Production channel
npm run update:production
```

## 📊 Monitoring & Analytics

### 1. Set up Crash Reporting
Consider adding:
- Sentry for crash reporting
- Firebase Crashlytics
- Expo's built-in error reporting

### 2. Analytics Setup
Consider adding:
- Firebase Analytics
- Mixpanel
- Amplitude

## 🧪 Testing Before Release

### 1. Local Testing
```bash
# Run tests
npm run test

# Run Maestro E2E tests
npm run test:maestro
```

### 2. Build Testing
```bash
# Test preview build
npm run build:all:preview

# Install on test devices
# Test all features thoroughly
```

### 3. Production Build Testing
```bash
# Test production build
npm run build:all:prod

# Install on test devices
# Test all features thoroughly
```

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All tests pass
- [ ] Linting passes (`npm run lint:check`)
- [ ] TypeScript compilation passes (`npm run compile`)
- [ ] No console.log statements in production code
- [ ] Error boundaries implemented
- [ ] Loading states implemented

### Configuration
- [ ] Environment variables set correctly
- [ ] App version updated
- [ ] Build number incremented
- [ ] App icons and splash screens ready
- [ ] Privacy policy and terms of service ready

### Store Requirements
- [ ] App Store screenshots prepared
- [ ] App description and keywords ready
- [ ] Privacy policy URL ready
- [ ] Support URL ready
- [ ] Marketing URL ready

### Testing
- [ ] App tested on multiple devices
- [ ] All features working correctly
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Accessibility features working

## 🚨 Common Issues & Solutions

### 1. Build Failures
```bash
# Clear cache and rebuild
npm run prebuild:clean
eas build --clear-cache --profile production --platform all
```

### 2. Credential Issues
```bash
# Reconfigure credentials
eas credentials --platform ios --clear
eas credentials --platform android --clear
```

### 3. Environment Variable Issues
- Ensure all environment variables are set in `eas.json`
- Check that variables are prefixed with `EXPO_PUBLIC_` for client-side access
- Verify Supabase and OpenAI keys are correct

### 4. Permission Issues
- Ensure all required permissions are declared in `app.config.ts`
- Add usage descriptions for iOS
- Add permission declarations for Android

## 📞 Support Resources

- [EAS Documentation](https://docs.expo.dev/eas/)
- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## 🔄 Release Workflow

### Typical Release Process:
1. **Development**: Use development builds for testing
2. **Preview**: Use preview builds for internal testing
3. **Production**: Use production builds for store submission
4. **Submit**: Submit to app stores
5. **Monitor**: Monitor crash reports and user feedback
6. **Update**: Deploy OTA updates for minor fixes

### Version Management:
- Increment version in `app.json` for each release
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update changelog with release notes
- Tag releases in git repository 