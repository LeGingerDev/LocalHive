# React Native Project Setup & Architecture Guide

A comprehensive guide for setting up a production-ready React Native project with Expo, Ignite CLI, Development Builds, proper navigation, folder structure, and error prevention patterns.

## Table of Contents
- [Project Creation Options](#project-creation-options)
- [Ignite CLI Setup (Recommended)](#ignite-cli-setup-recommended)
- [Manual Expo Setup (Alternative)](#manual-expo-setup-alternative)
- [Development Build Setup](#development-build-setup)
- [Folder Structure](#folder-structure)
- [Navigation Architecture](#navigation-architecture)
- [Error Prevention Patterns](#error-prevention-patterns)
- [TypeScript Integration](#typescript-integration)
- [Development Best Practices](#development-best-practices)
- [Common Issues & Solutions](#common-issues--solutions)

## Project Creation Options

### Recommended: Ignite CLI (Production-Ready)
**For developers who want a complete, production-ready foundation:**
- ✅ Complete app architecture pre-built
- ✅ Authentication flow ready
- ✅ Navigation fully configured
- ✅ Component library included
- ✅ State management setup
- ✅ Error prevention patterns built-in
- ✅ Perfect for vibe coding approach

### Alternative: Manual Expo Setup
**For developers who want to understand every piece:**
- ✅ Full control over dependencies
- ✅ Learn architecture step-by-step
- ✅ Custom folder structure
- ✅ More time investment required

## Ignite CLI Setup (Recommended)

### 1. Create Production-Ready Project
```bash
# Create complete app with Development Builds pre-configured
npx ignite-cli@latest new MyProject --yes
cd MyProject
```

**What you get instantly:**
- Complete app with splash screen, auth flow, and tab navigation
- **expo-dev-client** pre-installed and configured
- React Navigation 7 with proper TypeScript types
- MobX-State-Tree for state management
- Component library with buttons, inputs, screens
- API service layer ready for your backend
- Error boundaries and loading states throughout
- Dark/light theme support
- Testing setup with Jest and Maestro

### 2. Create Development Builds
```bash
# Ignite projects are Development Build ready
npx expo run:ios              # iOS Development Build (2-10 min first time)
npx expo run:android          # Android Development Build (2-10 min first time)
```

### 3. Start Development
```bash
# Daily development (instant hot reload)
npx expo start
```

### 4. Generate Additional Components
```bash
# Ignite's powerful generators for consistent code
npx ignite-cli generate component UserCard
npx ignite-cli generate screen Dashboard  
npx ignite-cli generate model User
```

### Ignite Folder Structure
```
MyProject/
├── app/
│   ├── components/          # Complete component library
│   │   ├── Button.tsx       # Pre-styled button variants
│   │   ├── TextField.tsx    # Form inputs with validation
│   │   ├── Screen.tsx       # Screen wrapper with safe areas
│   │   ├── Header.tsx       # Navigation header component
│   │   └── index.ts         # Clean exports
│   ├── screens/            # Example screens with patterns
│   │   ├── WelcomeScreen.tsx    # Landing/onboarding
│   │   ├── LoginScreen.tsx      # Authentication ready
│   │   ├── DemoShowroomScreen/  # Component showcase
│   │   └── index.ts
│   ├── navigators/         # Complete navigation setup
│   │   ├── AppNavigator.tsx     # Root navigation
│   │   ├── DemoNavigator.tsx    # Tab navigation example
│   │   └── navigationUtilities.ts
│   ├── models/            # MobX-State-Tree models
│   │   ├── RootStore.ts        # Global state management
│   │   ├── AuthenticationStore.ts # Auth state & logic
│   │   └── index.ts
│   ├── services/          # API and external services
│   │   ├── api/
│   │   │   ├── api.ts          # API client with auth
│   │   │   ├── apiProblem.ts   # Error handling
│   │   │   └── index.ts
│   │   └── reactotron/         # Debug tooling
│   ├── theme/             # Complete theming system
│   │   ├── colors.ts           # Color palette
│   │   ├── spacing.ts          # Consistent spacing
│   │   ├── typography.ts       # Font system
│   │   └── index.ts
│   ├── utils/             # Helper functions
│   │   ├── formatDate.ts
│   │   ├── validate.ts
│   │   └── index.ts
│   ├── config/            # App configuration
│   │   ├── config.base.ts
│   │   └── config.dev.ts
│   └── app.tsx           # Main app with error boundaries
├── assets/               # Images, fonts, etc.
├── test/                # Testing utilities
└── package.json
```

## Manual Expo Setup (Alternative)

### 1. Create Basic Expo Project
```bash
# Create TypeScript project
npx create-expo-app@latest MyProject --template blank-typescript
cd MyProject

# Add Development Build support
npx expo install expo-dev-client
```

### 2. Install Navigation Dependencies
```bash
# Core navigation packages
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer

# Required navigation dependencies
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Optional but recommended
npx expo install react-native-vector-icons
```

### 3. Install Additional Packages
```bash
# State Management
npx expo install @reduxjs/toolkit react-redux
# OR
npx expo install mobx mobx-state-tree

# Data Fetching
npx expo install @tanstack/react-query

# Environment variables
npx expo install expo-constants

# Development dependencies
npm install -D @types/react @types/react-native
```

### 4. Create Development Builds
```bash
# Create platform-specific Development Builds
npx expo run:ios              # iOS Development Build
npx expo run:android          # Android Development Build
```

### 5. Setup Manual Folder Structure
```
MyProject/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── App.tsx
├── app.json
├── package.json
└── metro.config.js
```

### 6. Configure Metro for src Folder
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@navigation': './src/navigation',
  '@services': './src/services',
  '@utils': './src/utils',
  '@constants': './src/constants',
  '@hooks': './src/hooks',
  '@types': './src/types',
};

module.exports = config;
```

## Development Build Setup

### Why Development Builds Over Expo Go

**Development Builds** provide full native access that Expo Go cannot:
- ✅ **Android immersive mode** (hiding navigation bars)
- ✅ **Custom native modules** and libraries
- ✅ **Advanced file system access**
- ✅ **Biometric authentication** (fingerprint, face ID)
- ✅ **Push notifications** with custom sounds
- ✅ **Background tasks** and services
- ✅ **Custom URL schemes** and deep linking
- ✅ **Production-like environment** for testing

### Development Build Workflow
```bash
# Initial setup (one-time, 2-10 minutes per platform)
npx expo run:ios              # Creates iOS Development Build
npx expo run:android          # Creates Android Development Build

# Daily development (instant like Expo Go)
npx expo start               # Hot reloading works normally
```

## Folder Structure

### Ignite vs Manual Structure Comparison

#### Ignite Structure (Recommended)
```
app/
├── components/           # Complete UI library
├── screens/             # Example screens with best practices
├── navigators/          # Fully configured navigation
├── models/              # MobX-State-Tree (state management)
├── services/            # API layer with auth
├── theme/               # Complete design system
├── utils/               # Helper functions
├── config/              # Environment configuration
└── app.tsx             # Error boundaries included
```

#### Manual Structure (Learning)
```
src/
├── components/           # Build your own components
├── screens/             # Create screens from scratch
├── navigation/          # Configure navigation manually
├── services/            # Build API layer
├── utils/               # Create utilities
├── constants/           # Define constants
├── types/               # TypeScript definitions
└── App.tsx             # Basic app setup
```

### Component Export Patterns

#### Ignite Export Pattern
```typescript
// app/components/index.ts (already set up)
export * from "./Button"
export * from "./TextField"
export * from "./Screen"
export * from "./Header"

// Usage:
import { Button, TextField, Screen, Header } from "@/components"
```

#### Manual Export Pattern
```typescript
// src/components/index.ts (you create this)
export { default as Button } from './common/Button';
export { default as Input } from './common/Input';
export { default as LoadingSpinner } from './common/LoadingSpinner';

// Usage:
import { Button, Input, LoadingSpinner } from '@components';
```

## Navigation Architecture

### Ignite Navigation (Pre-Built)

#### Ready-to-Use Navigation
```typescript
// app/navigators/AppNavigator.tsx (already configured)
export const AppNavigator = observer(function AppNavigator(props: AppNavigatorProps) {
  const {
    authenticationStore: { isAuthenticated },
  } = useStores()

  return (
    <NavigationContainer {...props}>
      <StatusBar style="light" />
      {isAuthenticated ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Welcome" component={Screens.WelcomeScreen} />
          <AppStack.Screen name="Demo" component={DemoNavigator} />
        </AppStack.Navigator>
      ) : (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Login" component={Screens.LoginScreen} />
        </AppStack.Navigator>
      )}
    </NavigationContainer>
  )
})
```

#### Ignite Screen Example
```typescript
// app/screens/WelcomeScreen.tsx (already built)
export const WelcomeScreen: FC<AppStackScreenProps<"Welcome">> = observer(function WelcomeScreen(_props) {
  const { navigation } = _props

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} backgroundColor={colors.background}>
      <Header 
        title="Welcome!" 
        rightIcon="settings" 
        onRightPress={() => navigation.navigate("Demo")}
      />
      
      <Text preset="heading" text="Ready to build amazing apps!" />
      
      <Button
        text="Get Started"
        preset="filled"
        onPress={() => navigation.navigate("Demo")}
      />
    </Screen>
  )
})
```

### Manual Navigation Setup

#### Navigation Types
```typescript
// src/types/navigation.ts
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

#### Manual Navigator Setup
```typescript
// src/navigation/navigators/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Error Prevention Patterns

### Ignite's Built-in Error Prevention

Ignite includes comprehensive error prevention:

#### Pre-Built Error Boundaries
```typescript
// app/app.tsx (already included)
function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppStateManager>
        <ErrorBoundary catchErrors={Config.catchErrors}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppNavigator linking={linking} />
          </GestureHandlerRootView>
        </ErrorBoundary>
      </AppStateManager>
    </SafeAreaProvider>
  )
}
```

#### Safe Component Patterns (Pre-Built)
```typescript
// Ignite components already handle edge cases
<Screen preset="scroll">
  {data ? (
    <FlatList
      data={data}
      renderItem={({ item }) => <ListItem item={item} />}
      ListEmptyComponent={<EmptyState />}
    />
  ) : (
    <LoadingState />
  )}
</Screen>
```

### Manual Error Prevention Implementation

#### 1. Mandatory Loading State Pattern
```typescript
const ExampleScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // CRITICAL: Handle ALL states explicitly
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Text>No data available</Text>;

  return (
    <View>
      <DataComponent data={data} />
    </View>
  );
};
```

#### 2. Safe Conditional Rendering Rules
```typescript
// NEVER DO THIS (causes $typeof errors):
{someData && <Component data={someData} />}

// ALWAYS DO THIS INSTEAD:
{someData ? <Component data={someData} /> : <Text>Loading...</Text>}

// OR use default values:
const items = data?.items || [];
{items.length > 0 && <ItemsList items={items} />}
```

## TypeScript Integration

### Ignite TypeScript Setup (Pre-Configured)

Ignite comes with **strict TypeScript** already configured:

```json
// tsconfig.json (already optimized)
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./app",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

#### Type-Safe Screen Usage
```typescript
// Already properly typed in Ignite
export const ProfileScreen: FC<AppStackScreenProps<"Profile">> = observer(function ProfileScreen(props) {
  const { route, navigation } = props
  const { userId } = route.params // TypeScript knows the type
  
  return (
    <Screen>
      <Text text={`Profile for user: ${userId}`} />
    </Screen>
  )
})
```

### Manual TypeScript Configuration

#### TypeScript Setup
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@navigation/*": ["navigation/*"]
    }
  }
}
```

## Development Best Practices

### Ignite Development Workflow

#### Using Ignite's State Management
```typescript
// app/models/AuthenticationStore.ts (already built)
export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .actions((self) => ({
    setAuthToken(value?: string) {
      self.authToken = value
    },
    setAuthEmail(value: string) {
      self.authEmail = value
    },
    logout() {
      self.authToken = undefined
      self.authEmail = ""
    },
  }))
  .views((self) => ({
    get isAuthenticated() {
      return !!self.authToken
    },
  }))

// Usage in components:
const { authenticationStore } = useStores()
if (authenticationStore.isAuthenticated) {
  // User is logged in
}
```

#### Using Ignite's API Service
```typescript
// app/services/api/api.ts (already configured)
const api = apisauce.create({
  baseURL: Config.API_URL,
  timeout: 10000,
})

// Already includes auth token handling
api.addAsyncRequestTransform(async (request) => {
  const authToken = getGeneralApiProblem(request)
  if (authToken) {
    request.headers["Authorization"] = `Bearer ${authToken}`
  }
})

// Usage:
const response = await api.get("/users")
```

### Manual Development Patterns

#### Custom Hook Pattern
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // Implementation details...
  
  return {
    ...authState,
    login,
    logout,
  };
};
```

#### Manual API Service
```typescript
// src/services/api/index.ts
class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Implementation...
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }
}

export default new ApiService();
```

## Common Issues & Solutions

### Ignite-Specific Solutions

#### Ignite Metro Issues
```bash
# Clear Ignite project cache
npx expo start --clear

# Rebuild Development Builds
npx expo run:ios --clear
npx expo run:android --clear

# Reset Ignite project
npx ignite-cli doctor
```

#### Ignite Generator Issues
```bash
# List available generators
npx ignite-cli generate --list

# Generate with specific options
npx ignite-cli generate component MyComponent --folder=common
npx ignite-cli generate screen MyScreen --navigator=App
```

### General Issues

#### Metro Bundle Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset Development Build
npx expo run:ios --clear
npx expo run:android --clear
```

#### Import Path Issues
```bash
# For Ignite projects
# Paths are already configured to use @/ prefix

# For manual projects
# Check metro.config.js configuration
# Restart Metro bundler: npx expo start --clear
```

## Production Build & Deployment

### Ignite Production Setup

#### EAS Configuration (Pre-Configured)
```json
// eas.json (already optimized for Ignite)
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
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

#### Production Build Commands
```bash
# Install EAS CLI
npm install -g @expo/cli

# Build for production (Ignite projects are already configured)
npx eas build --platform ios
npx eas build --platform android

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android
```

## Performance Optimization

### Ignite Optimizations (Built-in)

Ignite includes performance optimizations out of the box:
- ✅ **Hermes** enabled by default
- ✅ **Flipper** configured for debugging
- ✅ **Bundle analyzer** setup
- ✅ **Memory leak prevention** patterns
- ✅ **Lazy loading** examples

### Manual Optimizations

#### Enable Performance Tools
```typescript
// For manual projects, add these optimizations:

// 1. Lazy loading screens
const ProfileScreen = lazy(() => import('../screens/ProfileScreen'));

// 2. Optimize images
import { Image } from 'expo-image';

// 3. Memory management
useEffect(() => {
  const cleanup = () => {
    // Cleanup logic
  };
  return cleanup;
}, []);
```

## Quick Start Commands

### Ignite Workflow (Recommended)
```bash
# 1. Create production-ready project
npx ignite-cli@latest new MyProject --yes
cd MyProject

# 2. Create Development Builds
npx expo run:ios
npx expo run:android

# 3. Start development
npx expo start

# 4. Generate components as needed
npx ignite-cli generate component UserCard
npx ignite-cli generate screen Dashboard

# 5. Build for production
npx eas build --platform all
```

### Manual Expo Workflow
```bash
# 1. Create basic project
npx create-expo-app@latest MyProject --template blank-typescript
cd MyProject
npx expo install expo-dev-client

# 2. Install navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 3. Create Development Builds
npx expo run:ios
npx expo run:android

# 4. Start development
npx expo start
```

## Common Gotchas & Solutions

### Android Back Button Handler
Android's hardware back button can cause navigation chaos if not handled properly:

```javascript
// src/hooks/useBackHandler.js
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const useBackHandler = (onBackPress) => {
  const navigation = useNavigation();

  useEffect(() => {
    const backAction = () => {
      if (onBackPress) {
        return onBackPress(); // Return true to prevent default behavior
      }
      
      // Default behavior - go back if possible
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      
      // Let system handle (usually exits app)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation, onBackPress]);
};

// Usage in screen that needs custom back behavior
const MyScreen = () => {
  useBackHandler(() => {
    // Custom logic here
    console.log('Custom back button pressed');
    return true; // Prevent default
  });
  
  return <View>...</View>;
};
```

### iOS SafeArea Hell
SafeArea handling is different between iOS devices and can break layouts:

```javascript
// src/components/SafeScreen/index.js
import React from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeScreen = ({ children, backgroundColor = '#FFFFFF' }) => {
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={{
        flex: 1,
        backgroundColor,
        paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
};

export default SafeScreen;
```

### Metro Cache Nuclear Option
When Metro goes completely bonkers (and it will):

```bash
# The Nuclear Reset (saves your sanity)
#!/bin/bash
# Save as reset-everything.sh

echo "🧹 Nuclear Metro Reset - This will fix 99% of weird issues"

# Stop all Metro processes
pkill -f metro || true

# Clear all possible caches
npx react-native start --reset-cache
rm -rf node_modules
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*

# Clear platform-specific caches
if [ -d "ios" ]; then
  cd ios && xcodebuild clean && rm -rf ~/Library/Developer/Xcode/DerivedData && cd ..
fi

if [ -d "android" ]; then
  cd android && ./gradlew clean && cd ..
fi

# Clear package manager caches
npm cache clean --force
# or yarn cache clean

# Reinstall everything
npm install

# iOS pods
if [ -d "ios" ]; then
  cd ios && rm -rf Pods && pod install && cd ..
fi

echo "✅ Everything nuked and rebuilt. Try running your app now."
```

### Android Keyboard Behavior Nightmare
Android keyboard handling can push your UI around:

```javascript
// src/components/KeyboardAvoidingWrapper/index.js
import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KeyboardAvoidingWrapper = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAvoidingWrapper;
```

### TextInput Focus Chain Issues
Multiple TextInputs can cause focus problems:

```javascript
// src/components/FormInput/index.js
import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';

const FormInput = forwardRef(({ 
  onSubmitEditing, 
  returnKeyType = 'next',
  blurOnSubmit = false,
  ...props 
}, ref) => {
  return (
    <TextInput
      ref={ref}
      returnKeyType={returnKeyType}
      blurOnSubmit={blurOnSubmit}
      onSubmitEditing={onSubmitEditing}
      {...props}
    />
  );
});

// Usage for form with multiple inputs
const LoginForm = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  return (
    <View>
      <FormInput
        ref={emailRef}
        placeholder="Email"
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
      />
      <FormInput
        ref={passwordRef}
        placeholder="Password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        secureTextEntry
      />
    </View>
  );
};
```

### Image Loading Fails Silently
Images from URLs can fail without obvious errors:

```javascript
// src/components/SafeImage/index.js
import React, { useState } from 'react';
import { Image, View, Text, ActivityIndicator } from 'react-native';

const SafeImage = ({ source, fallbackText = "Image unavailable", style, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => setLoading(true);
  const handleLoadEnd = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
        <Text>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      {loading && (
        <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

export default SafeImage;
```

### AsyncStorage Migration Errors
AsyncStorage data can become corrupted between app updates:

```javascript
// src/services/storage/SafeStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class SafeStorage {
  async getItem(key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return defaultValue;
      
      // Try to parse JSON, fall back to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from storage:`, error);
      return defaultValue;
    }
  }

  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
      return false;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from storage:`, error);
      return false;
    }
  }

  // Migration helper for app updates
  async migrateData(migrations) {
    try {
      const currentVersion = await this.getItem('dataVersion', 0);
      
      for (const migration of migrations) {
        if (currentVersion < migration.version) {
          await migration.migrate();
          await this.setItem('dataVersion', migration.version);
        }
      }
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }
}

export default new SafeStorage();
```

### When Your App Needs Backend Logic
While React Native handles your mobile app, some logic belongs on the server for security and performance:

**Use Edge Functions when you need:**
- Server-side validation (preventing cheating in games)
- Database operations that join multiple tables
- Rate limiting and abuse prevention
- Processing sensitive data
- Complex business logic
- Integration with third-party APIs

**For a complete guide on implementing Edge Functions with Supabase, see the [Edge Functions documentation](README_EDGEFUNCTIONS.md).**

---

## Quick Start Commands

```bash
# Start development
npx react-native start

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android

# Debug
npx react-native log-ios
npx react-native log-android

# Nuclear reset when everything breaks
./reset-everything.sh
```

This guide should serve as your comprehensive reference for building a solid React Native application with proper architecture and error prevention patterns.

## Recommendation Summary

### Choose Ignite If:
- ✅ **Building a real production app**
- ✅ **Want to focus on features, not setup**
- ✅ **Prefer vibe coding approach**
- ✅ **Working with a team**
- ✅ **Need proven patterns and architecture**

### Choose Manual Setup If:
- ✅ **Learning React Native fundamentals**
- ✅ **Want full control over every dependency**
- ✅ **Building a very simple app**
- ✅ **Have specific architectural requirements**

**For most developers building real apps, Ignite provides the perfect foundation to start building features immediately while following production-ready patterns and preventing common errors like the $typeof issue.**