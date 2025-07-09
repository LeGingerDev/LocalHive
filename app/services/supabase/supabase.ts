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

// Create a function to get Supabase client with configurable session persistence
export const createSupabaseClient = (persistSession: boolean = false) => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: persistSession ? supabaseStorage : undefined,
      autoRefreshToken: persistSession,
      persistSession: persistSession,
      detectSessionInUrl: false,
    },
  })
}

// Default client with session persistence disabled
export const supabase = createSupabaseClient(false)
