# Google Sign-In Setup After Rebranding

## Issue
After rebranding to "Visu", Google Sign-In is failing with a `DEVELOPER_ERROR`. This is because the package name and OAuth configuration need to be updated.

## Changes Made

### ✅ Updated Configuration Files
1. **app.json** - Updated package names and scheme
2. **android/app/build.gradle** - Updated applicationId and namespace
3. **android/app/src/main/AndroidManifest.xml** - Updated scheme
4. **app/services/supabase/googleAuthService.ts** - Added TODO for webClientId update

### 🔧 What You Need to Do

#### 1. Update Google Cloud Console OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Find your existing OAuth 2.0 Client ID or create a new one
5. Update the **Package name** to: `com.legingerdev.visu`
6. Get your **SHA-1 fingerprint**:
   ```bash
   # For debug keystore (development)
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For production keystore (when ready)
   keytool -list -v -keystore your-production-keystore.jks -alias your-key-alias
   ```
7. Add the SHA-1 to your OAuth 2.0 Client ID configuration

#### 2. Update webClientId in Code

Once you have the new OAuth 2.0 Client ID, update this file:
```typescript
// app/services/supabase/googleAuthService.ts
GoogleSignin.configure({
  webClientId: "YOUR_NEW_CLIENT_ID_HERE", // Replace with new Client ID
  offlineAccess: true,
  hostedDomain: "",
  forceCodeForRefreshToken: true,
})
```

#### 3. Clean and Rebuild

```bash
# Clean the project
npx expo prebuild --clean

# Rebuild for Android
npx expo run:android

# Or for iOS
npx expo run:ios
```

## Package Name Changes

| File | Old | New |
|------|-----|-----|
| app.json (android.package) | `com.legingerdev.visu` | `com.legingerdev.visu` |
| app.json (ios.bundleIdentifier) | `com.legingerdev.visu` | `com.legingerdev.visu` |
| app.json (scheme) | `visu` | `visu` |
| build.gradle (applicationId) | `com.legingerdev.visu` | `com.legingerdev.visu` |
| build.gradle (namespace) | `com.legingerdev.visu` | `com.legingerdev.visu` |

## Why This Happened

When you rebranded the app, the package identifiers changed, but Google OAuth is tied to specific package names and SHA-1 fingerprints. The OAuth client needs to be reconfigured to match the new package name.

## Testing

After completing the setup:
1. Clean install the app
2. Try Google Sign-In
3. Check the console for any remaining errors

## Troubleshooting

If you still get errors:
1. Verify the SHA-1 fingerprint matches your keystore
2. Ensure the package name in Google Cloud Console matches exactly
3. Check that the webClientId is correct
4. Make sure you're using the right OAuth 2.0 Client ID (not the web client ID)

## Additional Notes

- The swipe navigation feature is now working and should not be affected by these changes
- All other app functionality remains intact
- This only affects Google Sign-In authentication 