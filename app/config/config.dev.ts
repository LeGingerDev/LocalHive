import Constants from "expo-constants"

// Debug: Log what we're getting from process.env
if (__DEV__) {
  console.log("🔍 process.env debug:")
  console.log(
    "  - EXPO_PUBLIC_SUPABASE_URL:",
    process.env.EXPO_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - EXPO_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - EXPO_PUBLIC_OPENAI_API_KEY:",
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:",
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "✅ Found" : "❌ Missing",
  )
}

export default {
  API_URL: "https://api.rss2json.com/v1/",

  // Try Constants first, fall back to process.env
  SUPABASE_URL:
    Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_KEY:
    Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  OPENAI_API_KEY:
    Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  GOOGLE_WEB_CLIENT_ID:
    Constants.expoConfig?.extra?.googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "",
}
