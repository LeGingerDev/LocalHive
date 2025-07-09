// Try to import GoogleSignin, but handle the case where it's not available
let GoogleSignin: any = null
let statusCodes: any = null

try {
  // Use dynamic import to prevent the module from being loaded if not available
  const googleSigninModule = require("@react-native-google-signin/google-signin")
  GoogleSignin = googleSigninModule.GoogleSignin
  statusCodes = googleSigninModule.statusCodes
} catch (error: any) {
  console.warn("Google Sign-In module not available in this build:", error.message)
  // Set up mock functions to prevent crashes
  GoogleSignin = {
    configure: () => console.warn("GoogleSignin.configure called but module not available"),
    hasPlayServices: () => Promise.resolve(true),
    signIn: () => Promise.reject(new Error("Google Sign-In not available")),
    getTokens: () => Promise.reject(new Error("Google Sign-In not available")),
    hasPreviousSignIn: () => Promise.resolve(false),
    signInSilently: () => Promise.reject(new Error("Google Sign-In not available")),
    signOut: () => Promise.resolve(),
    revokeAccess: () => Promise.resolve(),
  }
  statusCodes = {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  }
}

import { supabase } from "./supabase"

// Types for Google Sign-In responses
export interface SignInResult {
  success: boolean
  error?: string
  message?: string
}

export interface CheckSignInResult {
  isAuthenticated: boolean
  user?: any
}

// Google Auth Service Class
class GoogleAuthService {
  private signInSilentlyPromise: Promise<any> | null = null

  constructor() {
    if (GoogleSignin) {
      this.configureGoogleSignIn()
    }
  }

  /**
   * Configure Google Sign-In with your Google Client ID
   */
  private configureGoogleSignIn() {
    if (!GoogleSignin) {
      console.warn("GoogleSignin not available")
      return
    }
    
    GoogleSignin.configure({
      webClientId: "1059094099801-n0dvupob4kiers1dupmvu8su8io63e4s.apps.googleusercontent.com",
      offlineAccess: true,
      hostedDomain: "",
      forceCodeForRefreshToken: true,
    })
  }

  /**
   * Sign in with Google
   * @returns Promise<SignInResult>
   */
  async signInWithGoogle(): Promise<SignInResult> {
    if (!GoogleSignin) {
      return {
        success: false,
        error: "MODULE_NOT_AVAILABLE",
        message: "Google Sign-In module is not available in this build",
      }
    }

    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn()

      if (!userInfo) {
        return {
          success: false,
          error: "SIGN_IN_CANCELLED",
          message: "Sign in was cancelled",
        }
      }

      // Get the ID token
      const { idToken } = await GoogleSignin.getTokens()

      if (!idToken) {
        return {
          success: false,
          error: "NO_ID_TOKEN",
          message: "Failed to get id token",
        }
      }

      // Sign in to Supabase with Google OAuth
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      })

      if (error) {
        console.error("Supabase Google sign-in error:", error)
        return {
          success: false,
          error: "SUPABASE_ERROR",
          message: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: "NO_USER",
          message: "No user data returned",
        }
      }

      return {
        success: true,
        message: "Successfully signed in with Google",
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error)

      // Handle specific Google Sign-In errors
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: "CANCELLED",
          message: "Sign in was cancelled",
        }
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: "IN_PROGRESS",
          message: "Sign in is already in progress",
        }
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: "PLAY_SERVICES_NOT_AVAILABLE",
          message: "Google Play Services is not available",
        }
      } else {
        return {
          success: false,
          error: "UNKNOWN_ERROR",
          message: error.message || "An unknown error occurred",
        }
      }
    }
  }

  /**
   * Sign out from Google
   * @returns Promise<void>
   */
  async signOut(): Promise<void> {
    try {
      // First sign out from Supabase to clear the main session
      await supabase.auth.signOut()
      
      // Then sign out from Google Sign-In
      if (GoogleSignin) {
        await GoogleSignin.signOut()
      }
    } catch (error) {
      console.error("Error signing out from Google:", error)
      // Even if Google sign-out fails, ensure Supabase is signed out
      try {
        await supabase.auth.signOut()
      } catch (supabaseError) {
        console.error("Error signing out from Supabase:", supabaseError)
      }
    }
  }

  /**
   * Get current user info
   * @returns Promise<any>
   */
  async getCurrentUser(): Promise<any> {
    if (!GoogleSignin) {
      return null
    }

    // Prevent multiple simultaneous calls to signInSilently
    if (this.signInSilentlyPromise) {
      try {
        return await this.signInSilentlyPromise
      } catch (error) {
        // If the existing promise fails, clear it and return null
        this.signInSilentlyPromise = null
        console.error("Error getting current user from existing promise:", error)
        return null
      }
    }

    try {
      this.signInSilentlyPromise = GoogleSignin.signInSilently()
      const result = await this.signInSilentlyPromise
      this.signInSilentlyPromise = null
      return result
    } catch (error) {
      this.signInSilentlyPromise = null
      console.error("Error getting current user:", error)
      return null
    }
  }

  /**
   * Check if user is already signed in with Google
   * @returns Promise<CheckSignInResult>
   */
  async checkExistingSignIn(): Promise<CheckSignInResult> {
    try {
      // STEP 1: Check Supabase session first (primary source of truth)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Valid Supabase session - user is authenticated
        return { isAuthenticated: true, user: session.user }
      }

      // STEP 2: No Supabase session - attempt restoration from Google
      if (!GoogleSignin) {
        return { isAuthenticated: false }
      }

      const hasPreviousSignIn = await GoogleSignin.hasPreviousSignIn()
      if (!hasPreviousSignIn) {
        return { isAuthenticated: false }
      }

      // STEP 3: Google has cached credentials - attempt to restore Supabase session
      try {
        // Use the protected getCurrentUser method instead of direct signInSilently call
        const currentUser = await this.getCurrentUser()
        if (!currentUser) {
          return { isAuthenticated: false }
        }
        
        const { idToken } = await GoogleSignin.getTokens()
        
        // Attempt to restore Supabase session using Google token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })

        if (!error && data.session) {
          // Successfully restored Supabase session
          return { isAuthenticated: true, user: data.user }
        }
        
        // Failed to restore - clear Google state and return unauthenticated
        await GoogleSignin.signOut()
        return { isAuthenticated: false }
        
      } catch (error) {
        // Google credentials invalid - clear and return unauthenticated
        await GoogleSignin.signOut()
        return { isAuthenticated: false }
      }

    } catch (error) {
      console.error("Error checking authentication:", error)
      return { isAuthenticated: false }
    }
  }

  /**
   * Revoke access and sign out
   * @returns Promise<void>
   */
  async revokeAccess(): Promise<void> {
    try {
      if (GoogleSignin) {
        await GoogleSignin.revokeAccess()
        await GoogleSignin.signOut()
      }
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error revoking Google access:", error)
    }
  }
}

// Export a singleton instance
const googleAuthService = new GoogleAuthService()
export default googleAuthService

