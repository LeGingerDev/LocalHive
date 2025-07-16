import Constants from "expo-constants"

/**
 * These are configuration settings for the production environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
export default {
  API_URL: "https://api.rss2json.com/v1/",

  // Supabase configuration - read from Constants.expoConfig.extra
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || "",
  SUPABASE_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || "",
  SUPABASE_SERVICE_ROLE_KEY: "", // Keep empty - this should never be in client-side code
  OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey || "",
  GOOGLE_WEB_CLIENT_ID: Constants.expoConfig?.extra?.googleWebClientId || "",
}
