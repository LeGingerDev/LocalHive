import { useState, useCallback } from "react"

import googleAuthService from "@/services/supabase/googleAuthService"

export interface GoogleAuthWithIntegrityResult {
  success: boolean
  error?: string
  message?: string
}

export const useGoogleAuthWithIntegrity = () => {
  const [isSigningIn, setIsSigningIn] = useState(false)

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthWithIntegrityResult> => {
    if (isSigningIn) {
      return {
        success: false,
        error: "IN_PROGRESS",
        message: "Sign-in already in progress",
      }
    }

    setIsSigningIn(true)

    try {
      // Check if Google Sign-In is available
      const configStatus = googleAuthService.getConfigurationStatus()

      if (!configStatus.hasModule) {
        return {
          success: false,
          error: "PLAY_SERVICES_NOT_AVAILABLE",
          message: "Google Sign-In module not available",
        }
      }

      if (!configStatus.isConfigured) {
        return {
          success: false,
          error: "CONFIGURATION_ERROR",
          message: "Google Sign-In not properly configured",
        }
      }

      // Attempt to sign in with Google
      const result = await googleAuthService.signInWithGoogle()

      return result
    } catch (error: any) {
      console.error("Google sign-in error:", error)

      // Handle specific error types
      if (error.code === "SIGN_IN_CANCELLED") {
        return {
          success: false,
          error: "CANCELLED",
          message: "Sign-in was cancelled by user",
        }
      }

      if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        return {
          success: false,
          error: "PLAY_SERVICES_NOT_AVAILABLE",
          message: "Google Play Services not available",
        }
      }

      // Check for integrity-related errors
      if (error.message?.includes("integrity") || error.message?.includes("verification")) {
        return {
          success: false,
          error: "INTEGRITY_CHECK_FAILED",
          message: "Device verification failed",
        }
      }

      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: error.message || "An unknown error occurred",
      }
    } finally {
      setIsSigningIn(false)
    }
  }, [isSigningIn])

  return {
    isSigningIn,
    signInWithGoogle,
  }
}
