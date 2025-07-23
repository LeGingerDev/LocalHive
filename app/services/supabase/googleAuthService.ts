// Try to import GoogleSignin, but handle the case where it's not available
import Constants from "expo-constants"

import Config from "@/config"

import { AuthService } from "./authService"
import { supabase } from "./supabase"

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
  private isConfigured: boolean = false

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

    // Debug: Log what we're trying to access
    console.log("🔍 Debugging Google Sign-In configuration:")
    console.log("  - Config.GOOGLE_WEB_CLIENT_ID:", Config.GOOGLE_WEB_CLIENT_ID)
    console.log(
      "  - process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:",
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    )
    console.log(
      "  - Constants.manifest?.extra?.googleWebClientId:",
      (Constants.manifest as any)?.extra?.googleWebClientId,
    )
    console.log("  - Config object keys:", Object.keys(Config))

    // Try to get the client ID from multiple sources
    const clientId =
      Config.GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      (Constants.manifest as any)?.extra?.googleWebClientId

    if (!clientId) {
      console.warn("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not found in environment variables")
      console.log("  - Available Config values:", {
        SUPABASE_URL: Config.SUPABASE_URL ? "✅ Set" : "❌ Missing",
        SUPABASE_KEY: Config.SUPABASE_KEY ? "✅ Set" : "❌ Missing",
        OPENAI_API_KEY: Config.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
        GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID ? "✅ Set" : "❌ Missing",
      })
      return
    }

    console.log("  - Using clientId:", clientId.substring(0, 20) + "...")

    try {
      GoogleSignin.configure({
        webClientId: clientId,
        offlineAccess: true,
        hostedDomain: "",
        forceCodeForRefreshToken: true,
      })
      this.isConfigured = true
      console.log("✅ Google Sign-In configured successfully")
      console.log(
        "  - Using client ID type:",
        clientId.includes(".apps.googleusercontent.com") ? "Web Client ID" : "Unknown type",
      )
    } catch (error) {
      console.error("❌ Failed to configure Google Sign-In:", error)
      this.isConfigured = false
    }
  }

  /**
   * Check if Google Sign-In is properly configured
   */
  private isGoogleSignInAvailable(): boolean {
    return GoogleSignin !== null && this.isConfigured
  }

  /**
   * Get the configuration status of Google Sign-In
   */
  getConfigurationStatus(): { isConfigured: boolean; hasModule: boolean; hasWebClientId: boolean } {
    return {
      isConfigured: this.isConfigured,
      hasModule: GoogleSignin !== null,
      hasWebClientId: !!(
        Config.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      ),
    }
  }

  /**
   * Get comprehensive authentication status including Play Integrity
   */
  async getAuthenticationStatus(): Promise<{
    googleSignIn: { isConfigured: boolean; hasModule: boolean; hasWebClientId: boolean }
  }> {
    const googleStatus = this.getConfigurationStatus()
    // Remove: const integrityStatus = await playIntegrityService.getIntegrityStatus()

    return {
      googleSignIn: googleStatus,
      // Remove: playIntegrity: integrityStatus
    }
  }

  /**
   * Sign in with Google
   * @returns Promise<SignInResult>
   */
  async signInWithGoogle(): Promise<SignInResult> {
    if (!this.isGoogleSignInAvailable()) {
      return {
        success: false,
        error: "MODULE_NOT_AVAILABLE",
        message:
          "Google Sign-In is not properly configured. Please check your environment variables.",
      }
    }

    try {
      // Check device integrity before proceeding with Google Sign-In
      console.log("🔍 Checking device integrity before Google Sign-In...")
      // Remove: const isIntegrityValid = await playIntegrityService.checkBasicIntegrity()

      // Remove: if (!isIntegrityValid) {
      // Remove:   console.warn("⚠️ Device integrity check failed")
      // Remove:   return {
      // Remove:     success: false,
      // Remove:     error: "INTEGRITY_CHECK_FAILED",
      // Remove:     message: "Device integrity verification failed. Please ensure you're using a genuine device and the app is installed from Google Play.",
      // Remove:   }
      // Remove: }

      // Remove: console.log("✅ Device integrity check passed")

      // Request integrity token for backend verification
      console.log("🔍 Requesting Play Integrity token...")
      // Remove: const integrityToken = await playIntegrityService.requestIntegrityToken()

      // Remove: if (typeof integrityToken !== 'string') {
      // Remove:   console.warn("⚠️ Failed to get Play Integrity token:", integrityToken)
      // Remove:   return {
      // Remove:     success: false,
      // Remove:     error: "INTEGRITY_TOKEN_FAILED",
      // Remove:     message: "Failed to verify app integrity. Please try again or contact support.",
      // Remove:   }
      // Remove: }

      // Remove: console.log("✅ Play Integrity token obtained")

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

      // Create or update the user profile with Google data
      try {
        // Extract relevant user information from Google and Supabase
        const userId = data.user.id
        const email = data.user.email
        const fullName = userInfo.user?.name || data.user.user_metadata?.full_name
        const avatarUrl = userInfo.user?.photo || data.user.user_metadata?.avatar_url

        // Save profile data to the profiles table
        await AuthService.createOrUpdateProfile(userId, {
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
        })
      } catch (profileError) {
        console.error("Error creating user profile:", profileError)
        // We don't want to fail the sign-in if profile creation fails
        // The user is still authenticated, but might see incomplete profile data
      }

      return {
        success: true,
        message: "Successfully signed in with Google",
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      console.error("  - Error code:", error.code)
      console.error("  - Error message:", error.message)
      console.error("  - Full error object:", JSON.stringify(error, null, 2))

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
      } else if (error.code === "DEVELOPER_ERROR") {
        return {
          success: false,
          error: "DEVELOPER_ERROR",
          message:
            "Developer error - You're likely using a Web Client ID instead of an Android OAuth 2.0 Client ID. Create an Android OAuth 2.0 Client ID in Google Cloud Console with package name 'com.legingerdev.visu' and your SHA-1 fingerprint.",
        }
      } else if (error.code === "SIGN_IN_FAILED") {
        return {
          success: false,
          error: "SIGN_IN_FAILED",
          message: "Sign in failed - check client ID and OAuth configuration",
        }
      } else if (
        error.message &&
        error.message.includes("getTokens requires a user to be signed in")
      ) {
        // Treat getTokens errors as cancellations
        return {
          success: false,
          error: "CANCELLED",
          message: "Sign in was cancelled",
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
      if (this.isGoogleSignInAvailable()) {
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
    if (!this.isGoogleSignInAvailable()) {
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
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log("Your Supabase access token:", session?.access_token)
      if (session) {
        // Valid Supabase session - user is authenticated
        return { isAuthenticated: true, user: session.user }
      }

      // STEP 2: No Supabase session - attempt restoration from Google
      if (!this.isGoogleSignInAvailable()) {
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
          provider: "google",
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
      if (this.isGoogleSignInAvailable()) {
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
