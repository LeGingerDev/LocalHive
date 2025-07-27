import { Platform } from "react-native"
import * as AppleAuthentication from "expo-apple-authentication"

import { AuthService } from "./authService"
import { supabase } from "./supabase"

// Types for Apple Sign-In responses
export interface AppleSignInResult {
  success: boolean
  error?: string
  message?: string
  user?: any
}

export interface CheckAppleSignInResult {
  isAuthenticated: boolean
  user?: any
}

// Apple Auth Service Class
class AppleAuthService {
  private isConfigured: boolean = false

  constructor() {
    this.configureAppleAuth()
  }

  /**
   * Configure Apple Authentication
   */
  private configureAppleAuth() {
    console.log("🍎 Configuring Apple Authentication...")
    this.isConfigured = true
  }

  /**
   * Check if Apple Authentication is available on this device
   */
  private async isAppleAuthAvailable(): Promise<boolean> {
    try {
      return await AppleAuthentication.isAvailableAsync()
    } catch (error) {
      console.warn("Apple Authentication not available:", error)
      return false
    }
  }

  /**
   * Get the configuration status of Apple Authentication
   */
  getConfigurationStatus(): { isConfigured: boolean } {
    return {
      isConfigured: this.isConfigured,
    }
  }

  /**
   * Get the authentication status
   */
  async getAuthenticationStatus(): Promise<{
    appleAuth: { isConfigured: boolean; isAvailable: boolean }
  }> {
    const isAvailable = await this.isAppleAuthAvailable()
    return {
      appleAuth: {
        isConfigured: this.isConfigured,
        isAvailable,
      },
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<AppleSignInResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: "Apple Authentication not configured",
        message: "Apple Authentication is not properly configured",
      }
    }

    try {
      console.log("🍎 Starting Apple Sign In...")

      // Check if Apple Authentication is available on this device
      const isAvailable = await this.isAppleAuthAvailable()
      if (!isAvailable) {
        return {
          success: false,
          error: "Apple Authentication not available",
          message: "Apple Authentication is not available on this device",
        }
      }

      // Perform Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      console.log("🍎 Apple Sign In successful:", {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      })

      // Get the identity token from Apple
      const { identityToken } = credential

      if (!identityToken) {
        return {
          success: false,
          error: "No identity token",
          message: "Apple did not provide an identity token",
        }
      }

      // Sign in with Supabase using the Apple identity token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      })

      if (error) {
        console.error("🍎 Supabase Apple Sign In error:", error)
        return {
          success: false,
          error: error.message,
          message: "Failed to authenticate with Supabase",
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: "No user data",
          message: "No user data received from Supabase",
        }
      }

      // Create or update the user profile with Apple data
      try {
        // Extract relevant user information from Apple and Supabase
        const userId = data.user.id
        const email = data.user.email
        const fullName = credential.fullName?.givenName && credential.fullName?.familyName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
          : data.user.user_metadata?.full_name
        const avatarUrl = data.user.user_metadata?.avatar_url

        // Save profile data to the profiles table
        await AuthService.createOrUpdateProfile(
          userId,
          {
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          true, // Preserve existing name if profile already exists
        )
      } catch (profileError) {
        console.error("🍎 Error creating user profile:", profileError)
        // We don't want to fail the sign-in if profile creation fails
        // The user is still authenticated, but might see incomplete profile data
      }

      console.log("🍎 Apple Sign In completed successfully")
      return {
        success: true,
        message: "Successfully signed in with Apple",
        user: data.user,
      }
    } catch (error: any) {
      console.error("🍎 Apple Sign In error:", error)
      console.error("  - Error code:", error.code)
      console.error("  - Error message:", error.message)
      console.error("  - Full error object:", JSON.stringify(error, null, 2))

      // Handle specific Apple Authentication errors
      if (error.code === "ERR_REQUEST_CANCELED") {
        return {
          success: false,
          error: "CANCELLED",
          message: "Sign in was canceled by the user",
        }
      } else if (error.code === "ERR_INVALID_RESPONSE") {
        return {
          success: false,
          error: "INVALID_RESPONSE",
          message: "Invalid response from Apple. Please try again.",
        }
      } else if (error.code === "ERR_NOT_AVAILABLE") {
        return {
          success: false,
          error: "NOT_AVAILABLE",
          message: "Apple Sign In is not available on this device.",
        }
      } else if (error.code === "ERR_UNKNOWN") {
        return {
          success: false,
          error: "UNKNOWN_ERROR",
          message: "An unknown error occurred during Apple Sign In.",
        }
      } else {
        return {
          success: false,
          error: "UNKNOWN_ERROR",
          message: error.message || "An error occurred during Apple Sign In",
        }
      }
    }
  }

  /**
   * Sign out from Apple Authentication
   */
  async signOut(): Promise<void> {
    try {
      // First sign out from Supabase to clear the main session
      await supabase.auth.signOut()
      console.log("🍎 Apple Sign Out completed")
    } catch (error) {
      console.error("🍎 Apple Sign Out error:", error)
      // Even if Apple sign-out fails, ensure Supabase is signed out
      try {
        await supabase.auth.signOut()
      } catch (supabaseError) {
        console.error("🍎 Error signing out from Supabase:", supabaseError)
      }
    }
  }

  /**
   * Get the current user from Supabase
   */
  async getCurrentUser(): Promise<any> {
    try {
      const { user, error } = await AuthService.getCurrentUser()
      if (error) {
        console.error("🍎 Error getting current user:", error)
        return null
      }
      return user
    } catch (error) {
      console.error("🍎 Error getting current user:", error)
      return null
    }
  }

  /**
   * Check if user is already signed in
   */
  async checkExistingSignIn(): Promise<CheckAppleSignInResult> {
    try {
      const user = await this.getCurrentUser()
      return {
        isAuthenticated: !!user,
        user,
      }
    } catch (error) {
      console.error("🍎 Error checking existing sign in:", error)
      return {
        isAuthenticated: false,
      }
    }
  }

  /**
   * Revoke Apple authentication access
   */
  async revokeAccess(): Promise<void> {
    try {
      // Sign out from Supabase
      await this.signOut()
      console.log("🍎 Apple access revoked")
    } catch (error) {
      console.error("🍎 Error revoking Apple access:", error)
    }
  }
}

// Export a singleton instance
export const appleAuthService = new AppleAuthService()

// Export the class for testing purposes
export { AppleAuthService } 