import { createSupabaseClient } from "./supabase"

export interface PersonalCodeResponse {
  personal_code: string
}

export interface PersonalCodeError {
  error: string
  message?: string
}

/**
 * Service for handling personal code generation via Edge Function
 */
export class PersonalCodeService {
  private static readonly EDGE_FUNCTION_URL =
    "https://xnnobyeytyycngybinqj.functions.supabase.co/generate-personal-code"

  /**
   * Generate a personal code for the current user
   * @returns Promise with the personal code or error
   */
  static async generatePersonalCode(): Promise<PersonalCodeResponse | PersonalCodeError> {
    try {
      // Get the current session to access the access token
      const supabase = createSupabaseClient(true)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        return {
          error: "No valid session found",
          message: "Please sign in again to generate your personal code",
        }
      }

      // Call the Edge Function
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          error: `HTTP ${response.status}`,
          message: errorData.message || "Failed to generate personal code",
        }
      }

      const data: PersonalCodeResponse = await response.json()
      return data
    } catch (error) {
      console.error("Error generating personal code:", error)
      return {
        error: "Network error",
        message: "Failed to connect to the server. Please check your internet connection.",
      }
    }
  }

  /**
   * Check if the current user has a personal code
   * @returns Promise with the personal code if it exists, or null
   */
  static async getCurrentPersonalCode(): Promise<string | null> {
    try {
      const result = await this.generatePersonalCode()

      if ("error" in result) {
        // If it's a "code already exists" error, we need to fetch it from the database
        if (result.message?.includes("already has a personal code")) {
          // For now, we'll return null and let the UI handle this
          // In a future iteration, we could add a separate endpoint to just fetch the code
          return null
        }
        return null
      }

      return result.personal_code
    } catch (error) {
      console.error("Error getting current personal code:", error)
      return null
    }
  }

  /**
   * Fetch the current user's personal code from the database
   * @returns Promise with the personal code if it exists, or null
   */
  static async fetchPersonalCodeFromDatabase(): Promise<string | null> {
    try {
      const supabase = createSupabaseClient(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return null
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("personal_code")
        .eq("id", user.id)
        .single()

      if (error || !profile) {
        return null
      }

      return profile.personal_code || null
    } catch (error) {
      console.error("Error fetching personal code from database:", error)
      return null
    }
  }
}
