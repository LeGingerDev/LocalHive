# RevenueCat Environment Variables Setup

This document explains how to set up RevenueCat API keys using EAS environment variables for secure configuration.

## Overview

RevenueCat API keys are now loaded from EAS environment variables instead of being hardcoded in the source code. This provides better security and allows different keys for different environments (development, staging, production).

## Environment Variables Required

You need to set the following environment variables in your EAS project:

- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - Your RevenueCat Android API key
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - Your RevenueCat iOS API key

## How to Set Environment Variables

### Option 1: Using EAS CLI

```bash
# Set environment variables for all builds
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "your_android_key_here"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "your_ios_key_here"

# Or set for specific environments
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "your_android_key_here" --type production
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "your_ios_key_here" --type production
```

### Option 2: Using EAS Dashboard

1. Go to your EAS project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variables:
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

## Getting Your RevenueCat API Keys

1. Log in to your RevenueCat dashboard
2. Go to "Project Settings" > "API Keys"
3. Copy the appropriate API keys:
   - **Android**: Use the Android API key
   - **iOS**: Use the iOS API key

## Verification

After setting up the environment variables, you can verify they're working by:

1. Running the app in development mode
2. Checking the console logs for the environment variable debug output
3. Looking for "✅ Found" next to the RevenueCat keys

## Troubleshooting

### Missing API Keys
If you see "❌ Missing" in the debug output:
1. Verify the environment variables are set correctly in EAS
2. Check that the variable names match exactly (case-sensitive)
3. Ensure you're using the correct EAS project

### API Key Not Working
If RevenueCat fails to initialize:
1. Verify the API keys are correct in your RevenueCat dashboard
2. Check that the keys match the platform you're testing on
3. Ensure the keys are for the correct RevenueCat project

## Security Notes

- Never commit API keys to version control
- Use different keys for development and production environments
- Regularly rotate your API keys for security
- Monitor RevenueCat dashboard for any suspicious activity

## Code Changes Made

The following files were updated to support EAS environment variables:

1. `app.config.ts` - Added RevenueCat environment variables to the extra config
2. `app/config/config.dev.ts` - Added RevenueCat keys to the config object and debug logging
3. `app/services/revenueCatService.ts` - Updated to use Config instead of hardcoded keys

## Migration from Hardcoded Keys

If you were previously using hardcoded API keys, they have been removed and replaced with environment variable loading. The app will now fail gracefully with a warning if the environment variables are not set. 