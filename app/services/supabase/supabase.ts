import { AppState, AppStateStatus } from "react-native"
import { createClient } from "@supabase/supabase-js"
import { MMKV } from "react-native-mmkv"

import Config from "@/config"

// Initialize the Supabase client
const supabaseUrl = Config.SUPABASE_URL
const supabaseKey = Config.SUPABASE_KEY

// Check if the Supabase URL and key are defined
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or key is missing. Please check your configuration.")
}

// Create MMKV storage instance for Supabase session persistence
const storage = new MMKV()

// Create a custom storage adapter for Supabase
const supabaseStorage = {
  getItem: (key: string) => {
    return storage.getString(key) || null
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
}

// Create a single, shared Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Handle app state changes to refresh session when app resumes
let appStateListener: any = null

export const setupAppStateListener = () => {
  if (appStateListener) {
    return // Already set up
  }

  appStateListener = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // App has come to the foreground - refresh session
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.warn("Error refreshing session on app resume:", error)
        } else if (session) {
          console.log("Session refreshed on app resume")
        }
      } catch (error) {
        console.warn("Failed to refresh session on app resume:", error)
      }
    }
  })
}

export const cleanupAppStateListener = () => {
  if (appStateListener) {
    appStateListener()
    appStateListener = null
  }
}

// Legacy function for backward compatibility (deprecated)
export const createSupabaseClient = (persistSession: boolean = true) => {
  console.warn("createSupabaseClient is deprecated. Use the shared 'supabase' instance instead.")
  return supabase
}
