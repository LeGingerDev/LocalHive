/**
 * Utility functions for restarting the app
 */

/**
 * Restart the app with a delay to ensure any UI elements are properly dismissed
 * @param delayMs - Delay in milliseconds before restart (default: 500ms)
 */
export const restartApp = async (delayMs: number = 500): Promise<void> => {
  console.log(`🔄 [AppRestart] Scheduling app restart in ${delayMs}ms...`)

  setTimeout(async () => {
    try {
      console.log(`🔄 [AppRestart] Restarting app...`)

      // Use React Native's built-in reload mechanism
      const { DevSettings } = await import("react-native")

      if (__DEV__) {
        // In development, reload the app
        DevSettings.reload()
      } else {
        // In production, also reload (this will restart the app)
        DevSettings.reload()
      }
    } catch (error) {
      console.error("❌ [AppRestart] Failed to restart app:", error)

      // Fallback: try to reload using a different method
      try {
        const { DevSettings } = await import("react-native")
        DevSettings.reload()
      } catch (fallbackError) {
        console.error("❌ [AppRestart] Fallback restart also failed:", fallbackError)
        // As a last resort, we could show a message asking the user to manually restart
      }
    }
  }, delayMs)
}

/**
 * Restart the app immediately (no delay)
 */
export const restartAppImmediately = async (): Promise<void> => {
  console.log(`🔄 [AppRestart] Restarting app immediately...`)
  await restartApp(0)
}

/**
 * Restart the app after showing a success message
 * @param message - Success message to show before restart
 * @param delayMs - Delay in milliseconds before restart (default: 1000ms)
 */
export const restartAppWithMessage = (message: string, delayMs: number = 1000): void => {
  const { Alert } = require("react-native")

  Alert.alert("Success", message, [
    {
      text: "OK",
      onPress: () => restartApp(delayMs),
    },
  ])
}
