export interface ConfigBaseProps {
  persistNavigation: "always" | "dev" | "prod" | "never"
  catchErrors: "always" | "dev" | "prod" | "never"
  exitRoutes: string[]
  API_URL: string
  SUPABASE_URL: string
  SUPABASE_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  OPENAI_API_KEY: string
  GOOGLE_WEB_CLIENT_ID: string
}

export type PersistNavigationConfig = ConfigBaseProps["persistNavigation"]

const BaseConfig: ConfigBaseProps = {
  // This feature is particularly useful in development mode, but
  // can be used in production as well if you prefer.
  persistNavigation: "dev",

  /**
   * Only enable if we're catching errors in the right environment
   */
  catchErrors: "always",

  /**
   * This is a list of all the route names that will exit the app if the back button
   * is pressed while in that screen. Only affects Android.
   */
  exitRoutes: ["Welcome"],

  // API URLs
  API_URL: "",
  SUPABASE_URL: "",
  SUPABASE_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  OPENAI_API_KEY: "",
  GOOGLE_WEB_CLIENT_ID: "",
}

// Validate required environment variables
const validateConfig = (config: ConfigBaseProps) => {
  const requiredVars = [
    { key: "SUPABASE_URL", value: config.SUPABASE_URL },
    { key: "SUPABASE_KEY", value: config.SUPABASE_KEY },
  ]

  const missingVars = requiredVars.filter((v) => !v.value)

  if (missingVars.length > 0) {
    // During build time, these will be missing - that's expected
    if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
      console.log("ℹ️  Environment variables will be injected during EAS build")
    } else {
      console.warn("⚠️  Missing required environment variables:")
      missingVars.forEach((v) => console.warn(`   - ${v.key}`))
      console.warn("These will be available in EAS builds via EAS environment variables.")

      // In development, show more helpful message
      if (__DEV__) {
        console.warn(
          "For local development, you can create .env.development file or use EAS builds.",
        )
      }
    }
  } else {
    console.log("✅ All required environment variables are present")
  }
}

export default BaseConfig
export { validateConfig }
