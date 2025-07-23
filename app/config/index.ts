/**
 * This file imports configuration objects from either the config.dev.js file
 * or the config.prod.js file depending on whether we are in __DEV__ or not.
 *
 * Note that we do not gitignore these files. Unlike on web servers, just because
 * these are not checked into your repo doesn't mean that they are secure.
 * In fact, you're shipping a JavaScript bundle with every
 * config variable in plain text. Anyone who downloads your app can easily
 * extract them.
 *
 * If you doubt this, just bundle your app, and then go look at the bundle and
 * search it for one of your config variable values. You'll find it there.
 *
 * Read more here: https://reactnative.dev/docs/security#storing-sensitive-info
 */
import BaseConfig from "./config.base"
import { validateConfig } from "./config.base"
import DevConfig from "./config.dev"
import ProdConfig from "./config.prod"

let ExtraConfig = ProdConfig

if (__DEV__) {
  ExtraConfig = DevConfig
}

const Config = { ...BaseConfig, ...ExtraConfig }

// Debug: Log configuration loading
if (__DEV__) {
  console.log("🔧 Config loading debug:")
  console.log("  - Environment:", __DEV__ ? "development" : "production")
  console.log("  - BaseConfig keys:", Object.keys(BaseConfig))
  console.log("  - ExtraConfig keys:", Object.keys(ExtraConfig))
  console.log("  - Final Config keys:", Object.keys(Config))
  console.log("  - SUPABASE_URL:", Config.SUPABASE_URL ? "Set" : "Missing")
  console.log("  - SUPABASE_KEY:", Config.SUPABASE_KEY ? "Set" : "Missing")
  console.log("  - GOOGLE_WEB_CLIENT_ID:", Config.GOOGLE_WEB_CLIENT_ID ? "Set" : "Missing")
  console.log("  - OPENAI_API_KEY:", Config.OPENAI_API_KEY ? "Set" : "Missing")

  // Debug Constants.expoConfig.extra
  const Constants = require("expo-constants")
  console.log("🔍 Constants.expoConfig.extra debug:")
  console.log("  - Constants.expoConfig?.extra:", Constants.expoConfig?.extra)
  console.log(
    "  - supabaseUrl:",
    Constants.expoConfig?.extra?.supabaseUrl ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - supabaseAnonKey:",
    Constants.expoConfig?.extra?.supabaseAnonKey ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - openaiApiKey:",
    Constants.expoConfig?.extra?.openaiApiKey ? "✅ Found" : "❌ Missing",
  )
  console.log(
    "  - googleWebClientId:",
    Constants.expoConfig?.extra?.googleWebClientId ? "✅ Found" : "❌ Missing",
  )
}

// Validate environment variables
validateConfig(Config)

export default Config
