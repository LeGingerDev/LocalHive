# Expo and React Native Setup Guide for 2025

**Expo SDK 52 with React Native 0.76 is the current stable version** and the recommended choice for new projects. The most significant changes are that **global expo-cli is deprecated**, **Development Builds have replaced Expo Go** for full native access, and **Ignite CLI has emerged as the gold standard** for production-ready React Native development.

Modern Expo development offers two primary paths: **Ignite CLI for production apps** (complete foundation with best practices) and **manual create-expo-app for learning** (step-by-step understanding). Both approaches use Development Builds to provide full native capabilities from day one.

## Project Creation Decision Tree

### Choose Ignite CLI When:
- ✅ **Building a production app**
- ✅ **Want to ship features fast** (vibe coding approach)
- ✅ **Need proven architecture patterns**
- ✅ **Working with a team**
- ✅ **Want error prevention built-in**

### Choose Manual Setup When:
- ✅ **Learning React Native fundamentals**
- ✅ **Want to understand every piece**
- ✅ **Building very simple apps**
- ✅ **Have specific custom requirements**

## Ignite CLI Commands (Recommended)

### Complete Production Setup
```bash
      npx ignite-cli new LocalHiveProject \
        --bundle=com.legingerdev.localhiveproject \
        --git=false \
        --install-deps=false \
        --packager=npm \
        --target-path=C:\Users\Jordan\Documents\ReactNative\LocalHiveProject \
        --remove-demo \
        --workflow=manual \
        --no-timeout=false




# Create production-ready app with everything pre-configured
npx ignite-cli@latest new MyApp --yes

# What you get instantly:
# ✅ Complete authentication flow (splash → landing → login/signup → main app)
# ✅ Tab navigation with example screens
# ✅ Component library (buttons, inputs, screens, headers)
# ✅ State management (MobX-State-Tree)
# ✅ API service layer with auth
# ✅ Error boundaries and loading states
# ✅ TypeScript strict mode
# ✅ Testing setup (Jest + Maestro)
# ✅ Theme system (dark/light mode)
# ✅ expo-dev-client pre-configured
```

### Development Build Creation
```bash
# Navigate to project
cd MyApp

# Create Development Builds (first time: 2-10 minutes each)
npx expo run:ios              # iOS Development Build
npx expo run:android          # Android Development Build

# Daily development (instant hot reload)
npx expo start
```

### Code Generation
```bash
# Ignite's powerful generators for consistent patterns
npx ignite-cli generate component UserCard
npx ignite-cli generate screen Dashboard
npx ignite-cli generate model User

# List all available generators
npx ignite-cli generate --list

# Generate with options
npx ignite-cli generate component Button --folder=ui
npx ignite-cli generate screen Settings --navigator=Main
```

### Ignite Project Structure
```
MyApp/
├── app/
│   ├── components/          # Complete UI component library
│   │   ├── Button.tsx       # Pre-styled with variants
│   │   ├── TextField.tsx    # Form inputs with validation
│   │   ├── Screen.tsx       # Screen wrapper with safe areas
│   │   ├── Header.tsx       # Navigation header
│   │   └── index.ts         # Clean exports
│   ├── screens/            # Example screens with best practices
│   │   ├── WelcomeScreen.tsx    # Landing page example
│   │   ├── LoginScreen.tsx      # Auth flow ready
│   │   ├── DemoShowroomScreen/  # Component showcase
│   │   └── ErrorScreen/         # Error boundary UI
│   ├── navigators/         # Complete navigation setup
│   │   ├── AppNavigator.tsx     # Root navigation with auth flow
│   │   ├── DemoNavigator.tsx    # Tab navigation example
│   │   └── navigationUtilities.ts
│   ├── models/            # MobX-State-Tree state management
│   │   ├── RootStore.ts        # Global state
│   │   ├── AuthenticationStore.ts # Auth state & logic
│   │   └── EpisodeStore.ts     # Example data model
│   ├── services/          # API and external services
│   │   ├── api/
│   │   │   ├── api.ts          # HTTP client with auth
│   │   │   ├── apiProblem.ts   # Error handling
│   │   │   └── types.ts        # API type definitions
│   │   └── reactotron/         # Debug tooling
│   ├── theme/             # Complete design system
│   │   ├── colors.ts           # Color palette (dark/light)
│   │   ├── spacing.ts          # Consistent spacing scale
│   │   ├── typography.ts       # Font system
│   │   └── index.ts
│   ├── utils/             # Helper functions
│   │   ├── formatDate.ts
│   │   ├── validate.ts
│   │   ├── storage.ts          # Async storage wrapper
│   │   └── index.ts
│   ├── config/            # Environment configuration
│   │   ├── config.base.ts
│   │   ├── config.dev.ts
│   │   └── config.prod.ts
│   └── app.tsx           # Main app with error boundaries
├── assets/               # Images, fonts, sounds
├── test/                # Testing utilities and helpers
├── bin/                 # Ignite CLI scripts
└── ignite/              # Ignite configuration
```

## Manual Expo Commands (Learning Path)

### Basic Project Creation
```bash
# Create TypeScript project with immediate dev build setup
npx create-expo-app@latest MyApp --template "blank-typescript"
cd MyApp

# Essential: Install development build client immediately
npx expo install expo-dev-client
```

### Navigation Setup
```bash
# Install navigation packages
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer

# Required dependencies
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Optional but recommended
npx expo install react-native-vector-icons
```

### State Management Options
```bash
# Option 1: Redux Toolkit (popular)
npx expo install @reduxjs/toolkit react-redux

# Option 2: MobX-State-Tree (Ignite's choice)
npx expo install mobx mobx-state-tree mobx-react-lite

# Option 3: Zustand (lightweight)
npx expo install zustand
```

### Development Build Creation
```bash
# Create platform-specific Development Builds
npx expo run:ios              # iOS Development Build (2-10 min first time)
npx expo run:android          # Android Development Build (2-10 min first time)

# Start development server
npx expo start               # Hot reloading works like Expo Go
```

### Manual Project Structure
```
MyApp/
├── src/
│   ├── components/          # Build your own components
│   │   ├── common/         # Shared components
│   │   ├── forms/          # Form components
│   │   └── index.ts        # Export file
│   ├── screens/            # App screens
│   │   ├── auth/          # Authentication screens
│   │   ├── main/          # Main app screens
│   │   └── index.ts
│   ├── navigation/         # Navigation setup
│   │   ├── navigators/    # Navigator components
│   │   ├── services/      # Navigation utilities
│   │   └── types/         # TypeScript types
│   ├── services/          # API and services
│   │   ├── api/           # API client
│   │   ├── storage/       # Storage utilities
│   │   └── index.ts
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── constants/         # App constants
│   ├── types/             # TypeScript definitions
│   └── App.tsx           # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── metro.config.js        # Metro bundler config
```

## Essential Development Commands

### Ignite Development Workflow
```bash
# Daily development commands
npx expo start                    # Start development server
npx expo start --clear           # Clear cache and start
npx expo start --dev-client      # Force Development Build mode

# Building and testing
npx expo run:ios --clear         # Rebuild iOS Development Build
npx expo run:android --clear     # Rebuild Android Development Build
npx expo run:ios --device        # Run on specific iOS device

# Code generation (Ignite-specific)
npx ignite-cli generate component MyComponent
npx ignite-cli generate screen MyScreen
npx ignite-cli doctor            # Check project health

# Production builds
npx eas build --platform ios
npx eas build --platform android
npx eas build --platform all
```

### Manual Development Commands
```bash
# Development server
npx expo start                    # Start development server
npx expo start --localhost       # Local network only
npx expo start --tunnel          # Ngrok tunneling for remote testing
npx expo start --clear           # Clear Metro cache

# Development Builds
npx expo run:ios                 # Create/run iOS Development Build
npx expo run:android             # Create/run Android Development Build
npx expo run:ios --device        # Select specific device
npx expo run:android --variant release  # Release build

# Package management
npx expo install package-name    # Install with compatibility check
npx expo install --check         # Check package compatibility
npx expo install --fix           # Fix version conflicts

# Debugging and diagnostics
npx expo doctor                  # Check project configuration
npx expo-doctor@latest           # Advanced compatibility checks
```

## React Native Version Compatibility

### Current Stable Versions (January 2025)
- **Expo SDK 52**: React Native 0.76.7 (stable and recommended)
- **React Version**: 18.3.1
- **Node.js**: 18+ (LTS recommended)
- **New Architecture**: Enabled by default
- **Minimum OS**: iOS 15.1+, Android 7+ (API 24)
- **Development Method**: Development Builds (Expo Go has limitations)

### Why React Native 0.76 Over Newer Versions?
**React Native 0.76** is the sweet spot for new projects because:
- ✅ **Stable ecosystem** with full library support
- ✅ **Production-ready** with extensive real-world testing
- ✅ **Expo Go compatibility** (useful for quick demos)
- ✅ **No experimental features** that could cause issues
- ✅ **Best documentation** and community support

### React Native 0.77+ Considerations
For bleeding-edge features, React Native 0.77+ is available but:
- ❌ **No Expo Go support** (Development Builds mandatory)
- ❌ **Longer initial setup** time
- ❌ **Potential library incompatibilities**
- ❌ **Less community testing** in production

## Development Builds vs Expo Go

### Why Development Builds Are Now Standard
**Development Builds** have replaced Expo Go as the primary development method because they provide:

- ✅ **Full native access** (immersive mode, biometric auth, etc.)
- ✅ **Any React Native library** support
- ✅ **Custom native code** integration
- ✅ **Production-like environment** for accurate testing
- ✅ **No feature limitations** that plague Expo Go

### Features Requiring Development Builds
```bash
# Common features that DON'T work in Expo Go:
✅ Android immersive mode (hiding navigation/status bars)
✅ Custom splash screens with native animations
✅ Push notifications with custom sounds/actions
✅ Advanced file system access and downloads
✅ Camera with custom native features (QR scanning, filters)
✅ Biometric authentication (fingerprint, face ID, iris)
✅ Background tasks and location services
✅ Custom URL schemes and advanced deep linking
✅ Third-party native libraries (payment processors, analytics)
✅ Custom native modules and bridge communications
```

### Development Build Workflow
```bash
# One-time setup (2-10 minutes per platform)
npx create-expo-app@latest MyApp --template blank-typescript
# OR
npx ignite-cli@latest new MyApp --yes

cd MyApp
npx expo install expo-dev-client  # If not using Ignite
npx expo run:ios                  # Creates iOS Development Build
npx expo run:android              # Creates Android Development Build

# Daily development (instant like Expo Go)
npx expo start                    # Hot reloading works normally
# Code changes appear instantly, just like Expo Go did
```

### When Expo Go Is Still Useful
Expo Go remains valuable for:
- 🎯 **Quick prototyping** with basic React Native features
- 🎯 **Sharing simple demos** without requiring builds
- 🎯 **Learning React Native** fundamentals and concepts
- 🎯 **UI-only development** without native integrations
- 🎯 **Client presentations** of basic app concepts

But for **any serious app development**, Development Builds are essential.

## Major Changes in 2024-2025

### CLI Evolution and Workflow Changes
**Global expo-cli is deprecated** and the ecosystem has shifted to local tooling:

```bash
# Remove deprecated global CLI
npm uninstall -g expo-cli

# Modern local workflow
npx create-expo-app@latest MyApp
# OR
npx ignite-cli@latest new MyApp

cd MyApp
npx expo start  # Local expo package
```

### Command Migration Reference
| Old Global Command | New Local Command | Purpose |
|-------------------|-------------------|---------|
| `expo init` | `npx create-expo-app` | Create new project |
| `expo start` | `npx expo start` | Start development server |
| `expo build:ios` | `npx eas build --platform ios` | Build for App Store |
| `expo build:android` | `npx eas build --platform android` | Build for Play Store |
| `expo publish` | `npx eas update` | Over-the-air updates |
| **Expo Go workflow** | **Development Build workflow** | Core development method |

### New Architecture as Default
The New Architecture is enabled by default in all new projects:
- ✅ **Hermes engine** (JavaScriptCore no longer supported)
- ✅ **Fabric renderer** for better UI performance
- ✅ **TurboModules** for efficient native communication
- ✅ **Library compatibility** checks required
- ⚠️ **Legacy architecture** will be removed in late 2025

### Deprecated and Removed Features
Several packages have been deprecated or removed in SDK 52:
- ❌ **expo-barcode-scanner** removed (use expo-camera instead)
- ❌ **expo-av Video API** deprecated (migrate to expo-video)
- ❌ **Expo Webpack** deprecated (use Metro for web)
- ❌ **expo-camera/legacy** and **expo-sqlite/legacy** removed
- ❌ **Global expo-cli** no longer maintained

## Best Practices for 2025 Project Setup

### Ignite Production Workflow (Recommended)
```bash
# 1. Create complete production app
npx ignite-cli@latest new MyApp --yes

# 2. Navigate to project (expo-dev-client already configured)
cd MyApp

# 3. Create Development Builds for testing
npx expo run:ios        # iOS Development Build
npx expo run:android    # Android Development Build

# 4. Start daily development
npx expo start          # Full hot reloading with native access

# 5. Generate components as you build features
npx ignite-cli generate component UserCard
npx ignite-cli generate screen ProfileSettings
npx ignite-cli generate model UserPreferences

# 6. Build for production when ready
npx eas build --platform all
```

### Manual Learning Workflow
```bash
# 1. Create TypeScript project for learning
npx create-expo-app@latest MyApp --template "blank-typescript"

# 2. Navigate and add Development Build support
cd MyApp
npx expo install expo-dev-client

# 3. Install navigation (most apps need this)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# 4. Create Development Builds
npx expo run:ios
npx expo run:android

# 5. Start development with full native access
npx expo start
```

### Environment Configuration
Modern Expo projects use environment variables with the `EXPO_PUBLIC_` prefix:

```bash
# .env file
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```typescript
// app.config.js
export default {
  expo: {
    name: 'MyApp',
    slug: 'my-app',
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      environment: process.env.EXPO_PUBLIC_APP_ENV,
    },
  },
};

// Access in code
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

## Database Integration (External Factors)

### Supabase Integration Example
Both Ignite and manual setups work excellently with Supabase:

```bash
# Install Supabase client
npx expo install @supabase/supabase-js

# Environment setup
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Ignite + Supabase Integration
```typescript
// app/services/api/supabase.ts (add to Ignite project)
import { createClient } from '@supabase/supabase-js'
import Config from '../../config'

export const supabase = createClient(
  Config.SUPABASE_URL,
  Config.SUPABASE_ANON_KEY
)

// Integrate with Ignite's existing API structure
// app/services/api/api.ts
export const api = {
  // Existing Ignite API methods...
  
  // Add Supabase methods
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) throw error
    return data
  }
}
```

#### Manual + Supabase Integration
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## Testing and Quality Assurance

### Ignite Testing (Pre-Configured)
Ignite includes comprehensive testing setup:

```bash
# Run tests (already configured)
npm test                     # Jest unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# E2E testing with Maestro
npm run maestro:ios         # iOS E2E tests
npm run maestro:android     # Android E2E tests
```

### Manual Testing Setup
```bash
# Install testing dependencies
npm install -D @testing-library/react-native @testing-library/jest-native jest-expo

# Update package.json
{
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"]
  }
}
```

## Performance Optimization

### Ignite Performance Features (Built-in)
- ✅ **Hermes** enabled by default for better performance
- ✅ **Flipper** integration for debugging and profiling
- ✅ **Bundle analyzer** setup for size optimization
- ✅ **Memory leak prevention** patterns implemented
- ✅ **Image optimization** examples and utilities

### Manual Performance Setup
```bash
# Enable performance monitoring
npx expo install expo-dev-client react-native-flipper

# Image optimization
npx expo install expo-image

# Performance monitoring
npx expo install @react-native-firebase/perf
```

## Production Deployment

### EAS Build Setup (Both Approaches)
```bash
# Install EAS CLI globally
npm install -g @expo/cli

# Initialize EAS (for manual projects)
npx eas build:configure

# Build for production
npx eas build --platform ios      # iOS App Store
npx eas build --platform android  # Google Play Store
npx eas build --platform all      # Both platforms

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android
```

### EAS Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Troubleshooting Common Issues

### Ignite-Specific Issues
```bash
# Ignite project health check
npx ignite-cli doctor

# Reset Ignite project
rm -rf node_modules
npm install
npx expo run:ios --clear
npx expo run:android --clear

# Generator issues
npx ignite-cli generate --list    # See available generators
npx ignite-cli --help            # Ignite help
```

### General Development Build Issues
```bash
# Clear all caches
npx expo start --clear

# Rebuild Development Builds completely
npx expo run:ios --clear
npx expo run:android --clear

# Check project configuration
npx expo doctor
npx expo-doctor@latest          # Advanced checks

# Network issues
npx expo start --localhost      # Local only
npx expo start --tunnel         # Remote access
```

### Package Compatibility Issues
```bash
# Check package compatibility
npx expo install --check

# Fix version conflicts
npx expo install --fix

# Install specific versions
npx expo install package-name@version
```

## Conclusion

The Expo ecosystem has evolved dramatically in 2025, with **Ignite CLI emerging as the gold standard** for production React Native development and **Development Builds becoming mandatory** for real app development. 

**For developers building production apps**, the **Ignite + Development Builds + React Native 0.76** combination provides an unmatched foundation that eliminates weeks of setup time and prevents common pitfalls. The vibe coding approach becomes truly viable when you have a complete, working app architecture to build upon.

**For developers learning React Native**, the **manual Expo setup** provides valuable understanding of the underlying architecture while still benefiting from Development Builds' full native access.

The shift away from Expo Go limitations and toward unlimited native capabilities represents a fundamental maturation of the React Native ecosystem. Whether you choose Ignite for rapid development or manual setup for learning, Development Builds ensure you'll never hit the walls that previously frustrated React Native developers.

**The future of React Native development is bright, fast, and unlimited** - exactly what developers have been waiting for.