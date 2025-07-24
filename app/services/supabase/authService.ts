import { Platform } from "react-native"
import { makeRedirectUri } from "expo-auth-session"
import { AuthError, AuthResponse, Session, User } from "@supabase/supabase-js"

import { DatabaseService } from "./databaseService"
import { supabase } from "./supabase"
import { AnalyticsService, AnalyticsEvents } from "../analyticsService"

/**
 * Service for handling authentication with Supabase
 */
export class AuthService {
  /**
   * Sign in a user with a third-party provider
   */
  static async signInWithProvider(provider: "google" | "apple"): Promise<void> {
    try {
      let redirectTo: string
      if (Platform.OS === "web") {
        redirectTo = window.location.origin
      } else {
        redirectTo = makeRedirectUri({ scheme: "com.legingerdev.visu" })
      }
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (!error) {
        // Track sign out event
        await AnalyticsService.trackEvent({
          name: AnalyticsEvents.USER_SIGNED_OUT,
        })
        await AnalyticsService.clearUserId()
      }

      return { error }
    } catch (error) {
      console.error("Error signing out:", error)
      return { error: error as AuthError }
    }
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser()
      return {
        user: data.user,
        error,
      }
    } catch (error) {
      console.error("Error getting current user:", error)
      return {
        user: null,
        error: error as AuthError,
      }
    }
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession()
      return {
        session: data.session,
        error,
      }
    } catch (error) {
      console.error("Error getting session:", error)
      return {
        session: null,
        error: error as AuthError,
      }
    }
  }

  /**
   * Fetch the user profile from the 'profiles' table by user id
   */
  static async getProfileByUserId(userId: string) {
    return DatabaseService.getById<any>("profiles", userId, { idColumn: "id" })
  }

  /**
   * Create or update a user profile in the 'profiles' table
   * @param userId The user's ID from auth.users
   * @param profileData The profile data to save
   * @param preserveExistingName Whether to preserve the existing full_name if it exists
   */
  static async createOrUpdateProfile(
    userId: string,
    profileData: {
      email?: string
      full_name?: string
      avatar_url?: string
      bio?: string
      theme_preference?: string
      use_system_theme?: boolean
      personal_code?: string
      updated_at?: string
    },
    preserveExistingName: boolean = false,
  ) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await this.getProfileByUserId(userId)

      if (existingProfile) {
        // Update existing profile
        const updateData = { ...profileData, updated_at: new Date().toISOString() }

        // If preserveExistingName is true and the profile already has a full_name, don't overwrite it
        if (preserveExistingName && existingProfile.full_name && profileData.full_name) {
          delete updateData.full_name
        }

        const result = await DatabaseService.update("profiles", userId, updateData, {
          idColumn: "id",
        })
        return result
      } else {
        // Create new profile
        return DatabaseService.create("profiles", {
          id: userId, // Use the auth.users id as the profile id
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Set defaults for new profiles
          theme_preference: profileData.theme_preference || "light",
          use_system_theme:
            profileData.use_system_theme !== undefined ? profileData.use_system_theme : true,
          bio: profileData.bio || "",
        })
      }
    } catch (error) {
      console.error("Error creating/updating user profile:", error)
      return {
        data: null,
        error,
      }
    }
  }
}
