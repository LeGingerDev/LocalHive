/**
 * Utility functions for restarting the app
 */

import { Platform, Alert } from "react-native"

/**
 * Restart the app with a delay to ensure any UI elements are properly dismissed
 * @param delayMs - Delay in milliseconds before restart (default: 500ms)
 */
export const restartApp = async (delayMs: number = 500): Promise<void> => {
  console.log(`🔄 [AppRestart] Scheduling app restart in ${delayMs}ms...`)

  setTimeout(async () => {
    try {
      console.log(`🔄 [AppRestart] Restarting app...`)

      if (__DEV__) {
        // In development, use DevSettings.reload()
        const { DevSettings } = await import("react-native")
        DevSettings.reload()
      } else {
        // In production, use platform-specific restart methods
        if (Platform.OS === "ios") {
          // For iOS, we need to use a different approach
          // Since we can't truly restart the app, we'll show a message asking the user to restart manually
          Alert.alert(
            "Restart Required",
            "Your subscription has been activated! Please restart the app to see all changes.",
            [
              {
                text: "Restart Now",
                onPress: () => {
                  // Try to reload anyway as a fallback
                  try {
                    const { DevSettings } = require("react-native")
                    DevSettings.reload()
                  } catch (error) {
                    console.log("DevSettings.reload() not available in production")
                  }
                },
              },
              {
                text: "Later",
                style: "cancel",
              },
            ]
          )
        } else if (Platform.OS === "android") {
          // For Android, try to restart using the Android-specific method
          try {
            const { NativeModules } = await import("react-native")
            if (NativeModules.DevSettings) {
              NativeModules.DevSettings.reload()
            } else {
              // Fallback for Android
              Alert.alert(
                "Restart Required",
                "Your subscription has been activated! Please restart the app to see all changes.",
                [
                  {
                    text: "OK",
                    style: "default",
                  },
                ]
              )
            }
          } catch (error) {
            console.error("❌ [AppRestart] Android restart failed:", error)
            Alert.alert(
              "Restart Required",
              "Your subscription has been activated! Please restart the app to see all changes.",
              [
                {
                  text: "OK",
                  style: "default",
                },
              ]
            )
          }
        }
      }
    } catch (error) {
      console.error("❌ [AppRestart] Failed to restart app:", error)

      // Fallback: show a message asking the user to restart manually
      Alert.alert(
        "Restart Required",
        "Your subscription has been activated! Please restart the app to see all changes.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      )
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
  Alert.alert("Success", message, [
    {
      text: "OK",
      onPress: () => restartApp(delayMs),
    },
  ])
}
