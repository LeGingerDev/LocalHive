import { AuthError, AuthResponse, Session, User } from "@supabase/supabase-js"

import { DatabaseService } from "./databaseService"
import { createSupabaseClient } from "./supabase"

/**
 * Service for handling authentication with Supabase
 */
export class AuthService {
  /**
   * Sign in a user with a third-party provider
   */
  static async signInWithProvider(provider: "google" | "apple"): Promise<void> {
    try {
      const supabase = createSupabaseClient(false) // No session persistence for OAuth
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
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
      // Try both clients to ensure we sign out regardless of session persistence setting
      const supabaseWithPersistence = createSupabaseClient(true)
      const supabaseWithoutPersistence = createSupabaseClient(false)
      
      // Sign out from both clients
      const [result1, result2] = await Promise.allSettled([
        supabaseWithPersistence.auth.signOut(),
        supabaseWithoutPersistence.auth.signOut(),
      ])

      // Return the first error if any
      const error = result1.status === 'rejected' ? result1.reason : 
                   result2.status === 'rejected' ? result2.reason : null

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
      // Try both clients to check for existing sessions
      const supabaseWithPersistence = createSupabaseClient(true)
      const supabaseWithoutPersistence = createSupabaseClient(false)
      
      const [result1, result2] = await Promise.allSettled([
        supabaseWithPersistence.auth.getUser(),
        supabaseWithoutPersistence.auth.getUser(),
      ])

      // Return the first successful result
      if (result1.status === 'fulfilled' && result1.value.data?.user) {
        return {
          user: result1.value.data.user,
          error: result1.value.error,
        }
      }
      
      if (result2.status === 'fulfilled' && result2.value.data?.user) {
        return {
          user: result2.value.data.user,
          error: result2.value.error,
        }
      }

      return {
        user: null,
        error: null,
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
      // Try both clients to check for existing sessions
      const supabaseWithPersistence = createSupabaseClient(true)
      const supabaseWithoutPersistence = createSupabaseClient(false)
      
      const [result1, result2] = await Promise.allSettled([
        supabaseWithPersistence.auth.getSession(),
        supabaseWithoutPersistence.auth.getSession(),
      ])

      // Return the first successful result
      if (result1.status === 'fulfilled' && result1.value.data?.session) {
        return {
          session: result1.value.data.session,
          error: result1.value.error,
        }
      }
      
      if (result2.status === 'fulfilled' && result2.value.data?.session) {
        return {
          session: result2.value.data.session,
          error: result2.value.error,
        }
      }

      return {
        session: null,
        error: null,
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
}
