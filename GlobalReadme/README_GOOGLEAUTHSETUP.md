# Google Authentication Service Implementation Guide

## ⚠️ CRITICAL IMPLEMENTATION NOTE

**READ THIS BEFORE IMPLEMENTING ANYTHING:**

This code is a **TEMPLATE** and **CANNOT** be used directly in your project without significant modifications. The person providing this has **NO KNOWLEDGE** of your specific project structure, file organization, import paths, existing authentication patterns, or architectural decisions.

**YOU MUST:**
- Adapt ALL import paths to match your project structure
- Modify the service to integrate with your existing architecture
- Update configuration management to match your project's patterns
- Adjust error handling to work with your existing error management system
- Ensure the service follows your project's coding standards and patterns
- Test thoroughly in your specific environment
- **IMPORTANT:** This implementation is verified for @react-native-google-signin/google-signin v15.0.0+

**DO NOT** blindly copy-paste this code. Use it as a reference and adapt it properly to your project's needs.

## 🔄 API Updates Note

This service uses the **Original Google Sign-In API** (`GoogleSignin`) which is the stable, widely-used version. Google also offers a newer **Universal Sign-In API** (`GoogleOneTapSignIn`) which requires a paid license but offers enhanced features. The code below uses the original API which is free and well-supported.

---

## Overview

This service provides Google OAuth authentication integrated with Supabase for React Native applications. It handles the complete authentication flow including sign-in, sign-out, token management, and session persistence.

## Dependencies Required

```bash
npm install @react-native-google-signin/google-signin @react-native-async-storage/async-storage
```

## Core Service Implementation

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  SignInSuccessResponse,
  SignInSilentlyResponse,
  SignInResponse,
} from '@react-native-google-signin/google-signin';
import Config from '@/config'; // ⚠️ ADJUST PATH TO YOUR CONFIG
import { createSupabaseClient } from './supabase'; // ⚠️ ADJUST PATH TO YOUR SUPABASE CONFIG

// Make sure GOOGLE_WEB_CLIENT_ID is in your config!
const GOOGLE_WEB_CLIENT_ID = (Config as any).GOOGLE_WEB_CLIENT_ID || '';

class GoogleAuthService {
  isInitialized = false;
  currentUser: any = null;
  accessToken: string | null = null;

  constructor() {
    this.initializeGoogleSignIn();
  }

  /**
   * Initialize Google Sign-In with your configuration
   */
  async initializeGoogleSignIn() {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID, // ⚠️ REPLACE WITH YOUR ACTUAL CLIENT ID
        scopes: ['email', 'profile'], // Basic scopes - add more if needed
        offlineAccess: true, // Required for refresh tokens
        forceCodeForRefreshToken: true, // Android - better refresh token handling
        profileImageSize: 120, // Profile image size in pixels
      });

      this.isInitialized = true;
    } catch (error: any) {
      console.error('Error initializing Google Sign-In:', error);
      throw new Error('Failed to initialize Google authentication');
    }
  }

  /**
   * Check if user is already signed in
   */
  async checkExistingSignIn() {
    try {
      // Check if user was previously signed in
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();
      
      if (isSignedIn) {
        // Try to get current user info without showing UI
        const response: SignInSilentlyResponse = await GoogleSignin.signInSilently();
        
        // IMPORTANT: Check for no saved credentials FIRST, then success
        if (isNoSavedCredentialFoundResponse(response)) {
          return { isAuthenticated: false };
        } else if (isSuccessResponse(response)) {
          this.currentUser = response.data || null;
          const tokens = await GoogleSignin.getTokens();
          this.accessToken = tokens?.accessToken || null;
          
          // Also check Supabase session
          const supabase = createSupabaseClient(true);
          const { data: { session } } = await supabase.auth.getSession();
          
          return {
            isAuthenticated: true,
            user: response.data,
            supabaseSession: session
          };
        }
      }
      
      return { isAuthenticated: false };
    } catch (error: any) {
      console.error('Error checking existing sign-in:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Sign in with Google and authenticate with Supabase
   */
  async signInWithGoogle() {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Sign-In not initialized');
      }

      // Check if device supports Google Play Services (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get Google user info and tokens
      const response: SignInResponse = await GoogleSignin.signIn();
      
      // Check if sign-in was successful using helper functions
      if (isSuccessResponse(response)) {
        const googleUser = response.data;
        
        if (!googleUser?.user || !googleUser?.idToken) {
          throw new Error('No user data or ID token received from Google');
        }

        // Store current user info
        this.currentUser = googleUser;
        const tokens = await GoogleSignin.getTokens();
        this.accessToken = tokens?.accessToken || null;

        // Sign in to Supabase with Google ID token
        const supabase = createSupabaseClient(false);
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.idToken,
          access_token: this.accessToken || undefined, // Include access token
        });

        if (supabaseError) {
          throw new Error(`Supabase authentication failed: ${supabaseError.message}`);
        }

        // Store tokens securely
        await this.storeTokensSecurely(googleUser, supabaseData);

        return {
          success: true,
          user: googleUser,
          supabaseSession: supabaseData.session,
          message: 'Authentication successful'
        };

      } else if ((response as any).type === 'cancelled') {
        return {
          success: false,
          error: 'CANCELLED',
          message: 'Sign-in was cancelled by user'
        };
      } else {
        throw new Error('Unexpected response type from Google Sign-In');
      }

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases using the library's status codes
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            return {
              success: false,
              error: 'CANCELLED',
              message: 'Sign-in was cancelled by user'
            };
          
          case statusCodes.IN_PROGRESS:
            return {
              success: false,
              error: 'IN_PROGRESS',
              message: 'Sign-in is already in progress'
            };

          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            return {
              success: false,
              error: 'PLAY_SERVICES_NOT_AVAILABLE',
              message: 'Google Play Services not available or outdated'
            };
        }
      }

      return {
        success: false,
        error: 'UNKNOWN',
        message: error.message || 'An unknown error occurred'
      };
    }
  }

  /**
   * Sign out from both Google and Supabase
   */
  async signOut() {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Sign out from Supabase
      const supabase = createSupabaseClient(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign-out error:', error);
      }

      // Clear stored data
      this.currentUser = null;
      this.accessToken = null;
      await this.clearStoredTokens();

      return {
        success: true,
        message: 'Successfully signed out'
      };

    } catch (error: any) {
      console.error('Sign-out error:', error);
      return {
        success: false,
        message: error.message || 'Error during sign-out'
      };
    }
  }

  /**
   * Revoke access (more complete sign-out)
   */
  async revokeAccess() {
    try {
      await GoogleSignin.revokeAccess();
      const supabase = createSupabaseClient(true);
      await supabase.auth.signOut();
      
      this.currentUser = null;
      this.accessToken = null;
      await this.clearStoredTokens();

      return {
        success: true,
        message: 'Access revoked successfully'
      };

    } catch (error: any) {
      console.error('Revoke access error:', error);
      return {
        success: false,
        message: error.message || 'Error revoking access'
      };
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Refresh Google access token if needed
   */
  async refreshTokenIfNeeded() {
    try {
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens?.accessToken || null;
      return tokens;
    } catch (error: any) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  }

  /**
   * Get Supabase session
   */
  async getSupabaseSession() {
    try {
      const supabase = createSupabaseClient(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      return session;
    } catch (error: any) {
      console.error('Error getting Supabase session:', error);
      return null;
    }
  }

  /**
   * Store authentication tokens securely
   */
  async storeTokensSecurely(googleUser: any, supabaseData: any) {
    try {
      const tokens = await GoogleSignin.getTokens(); // Get fresh tokens
      
      const authData = {
        googleAccessToken: tokens?.accessToken || null,
        googleIdToken: googleUser.idToken || null,
        supabaseAccessToken: supabaseData.session?.access_token,
        supabaseRefreshToken: supabaseData.session?.refresh_token,
        userInfo: {
          id: googleUser.user?.id,
          email: googleUser.user?.email,
          name: googleUser.user?.name,
          photo: googleUser.user?.photo
        },
        timestamp: Date.now()
      };

      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData));
    } catch (error: any) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Clear stored tokens
   */
  async clearStoredTokens() {
    try {
      await AsyncStorage.removeItem('auth_tokens');
    } catch (error: any) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Get stored tokens
   */
  async getStoredTokens() {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch (error: any) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  /**
   * Listen to Supabase auth state changes
   */
  setupAuthStateListener(callback: (event: string, session: any) => void) {
    const supabase = createSupabaseClient(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (callback) {
          callback(event, session);
        }
      }
    );

    return subscription;
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

export default googleAuthService;
```

## Configuration Requirements

### 1. Google Cloud Console Setup
- Ensure your Google Cloud Console project has the correct OAuth 2.0 client IDs
- Replace `'YOUR_WEB_CLIENT_ID'` with your actual client ID in your config

### 2. Supabase Configuration
- Make sure your Supabase project has Google OAuth enabled
- Update the import path for your Supabase client configuration

### 3. React Native Setup
- Follow the installation guide for `@react-native-google-signin/google-signin`
- Configure platform-specific settings (iOS: GoogleService-Info.plist, Android: google-services.json)

## Usage Example

```typescript
import googleAuthService from './services/GoogleAuthService'; // ⚠️ ADJUST PATH

// Sign in
const handleSignIn = async () => {
  const result = await googleAuthService.signInWithGoogle();
  if (result.success) {
    console.log('User signed in:', result.user);
    // Handle successful sign-in
  } else {
    console.error('Sign-in failed:', result.message);
    // Handle error
  }
};

// Check existing session on app start
const checkAuth = async () => {
  const result = await googleAuthService.checkExistingSignIn();
  if (result.isAuthenticated) {
    // User is already signed in
    console.log('User is authenticated:', result.user);
  }
};

// Sign out
const handleSignOut = async () => {
  const result = await googleAuthService.signOut();
  if (result.success) {
    console.log('User signed out successfully');
  }
};

// Listen to auth state changes
const authSubscription = googleAuthService.setupAuthStateListener((event, session) => {
  console.log('Auth event:', event);
  // Handle auth state changes
});

// Don't forget to unsubscribe when component unmounts
// authSubscription.unsubscribe();
```

## Key Features

1. **Complete Authentication Flow**: Handles Google OAuth and Supabase integration
2. **Token Management**: Securely stores and manages access/refresh tokens
3. **Session Persistence**: Maintains authentication state across app restarts
4. **Error Handling**: Comprehensive error handling for various scenarios
5. **State Management**: Tracks current user and authentication status
6. **Type Safety**: Full TypeScript support with proper type guards

## Important Notes

- **Security**: Tokens are stored using AsyncStorage - consider using more secure storage for production
- **Error Handling**: Adapt error handling to match your app's error management patterns
- **Testing**: Thoroughly test the authentication flow in your specific environment
- **Platform Differences**: iOS and Android may have different setup requirements
- **Type Safety**: The implementation uses proper TypeScript types and helper functions for v15+

## Next Steps

1. Install required dependencies
2. Configure Google Cloud Console and Supabase
3. Adapt the service to your project structure
4. Implement proper error handling for your app
5. Test the complete authentication flow
6. Consider implementing additional security measures for production use

---

**Remember: This is a template - adapt it to your specific project needs!**