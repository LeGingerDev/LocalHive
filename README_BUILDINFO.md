# Local Hive Build Information

## Development Environment Options

### 1. Expo Go
- **Command:** `npx expo start --go` or `npm start`
- **Pros:** Quick setup, fast development cycle
- **Cons:** Limited native functionality
- **Best for:** Quick UI changes, early development
- **Limitations:** Cannot test custom native modules or certain native APIs

### 2. Development Client
- **Command:** `npx expo start --dev-client` or `npm run start:dev`
- **Pros:** Full native functionality with hot reloading
- **Cons:** Requires building a development client first
- **Best for:** Testing native features while maintaining fast development
- **Size Note:** Development builds are larger (~150MB vs ~70MB for production)

### 3. Local Build (Not Recommended)
- **Command:** `npx expo run:android`
- **Requirements:** Full Android SDK setup with environment variables
- **Issues:** Requires setting up `ANDROID_HOME` and Android build tools
- **Error:** "The system cannot find the path specified" when Android SDK not configured

## Building the App

### EAS Build (Recommended)
- **Development Build:** `npx eas build --profile development --platform android`
- **Production Build:** `npx eas build --profile production --platform android`
- **Preview Build:** `npx eas build --profile preview --platform android`

### Common Build Issues
1. **Runtime Version Error:**
   - Error: "You're currently using the bare workflow, where runtime version policies are not supported"
   - Fix: Change `"runtimeVersion": {"policy": "appVersion"}` to `"runtimeVersion": "1.0.0"` in app.json

2. **Android SDK Path Issues:**
   - Error: "The system cannot find the path specified"
   - Fix: Set environment variables:
     ```
     $env:ANDROID_HOME = "C:\Users\[username]\AppData\Local\Android\Sdk"
     $env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
     ```

3. **Port Already in Use:**
   - Error: "Port 8081 is being used by another process"
   - Fix: Use `npx kill-port 8081` to free the port

## Native UI Issues

### Navigation Bar Hiding
- **Issue:** Navigation bar still visible despite configuration
- **Solution:** Centralize immersive mode control in one component
- **Implementation:**
  1. Use `expo-navigation-bar` in a dedicated component
  2. Apply settings repeatedly with an interval
  3. Remove duplicate code from other components
  4. Set proper configuration in app.json

### App Icon Issues
- **Problem:** Icons appear zoomed in or cropped
- **Solution:** Create icons with ~30% padding around all sides
- **Android Adaptive Icons:** Need foreground and background layers properly configured

## When to Create a New Build

1. **JavaScript/TypeScript Changes:**
   - No rebuild needed - use hot reloading

2. **Native Code Changes:**
   - Adding/modifying native modules
   - Changing Android/iOS configuration
   - Updating Expo SDK or native dependencies
   - Modifying app.json native settings

## Commands Reference

```bash
# Start with Expo Go
npm start

# Start with Development Client
npm run start:dev

# Build Development Client
npx eas build --profile development --platform android

# Build Production Version
npx eas build --profile production --platform android

# Free up Metro port
npx kill-port 8081
```

## Development vs Production Builds

- **Development Builds:**
  - Include debug symbols and tools
  - Support hot reloading
  - Larger file size (~150MB)
  - Uncompressed assets
  - Multiple architecture support

- **Production Builds:**
  - Optimized and compressed
  - Smaller file size (~70-80MB)
  - No debugging tools
  - Only necessary architecture included 