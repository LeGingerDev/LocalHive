import { Platform } from "react-native"
import * as NavigationBar from "expo-navigation-bar"

/**
 * Function to hide the Android navigation bar
 * This is a centralized utility to hide the navigation bar consistently across the app
 */
export const hideNavigationBar = async (): Promise<void> => {
  if (Platform.OS === "android") {
    try {
      // Suppress console warnings for unsupported methods
      const originalWarn = console.warn
      console.warn = (...args) => {
        // Filter out navigation bar warnings when edge-to-edge is enabled
        const message = args[0]
        if (typeof message === 'string' && 
            (message.includes('setBehaviorAsync') || message.includes('setBackgroundColorAsync')) &&
            message.includes('edge-to-edge')) {
          return // Suppress this warning
        }
        originalWarn.apply(console, args)
      }

      // Set the navigation bar to hidden
      await NavigationBar.setVisibilityAsync("hidden")
      
      // Note: setBehaviorAsync and setBackgroundColorAsync are not supported with edge-to-edge enabled
      // These calls are removed to prevent warnings
      // The edge-to-edge configuration in app.json handles the navigation bar styling

      // Restore original console.warn
      console.warn = originalWarn
    } catch (error) {
      console.warn("Failed to hide navigation bar:", error)
    }
  }
}

/**
 * Function to set up a navigation bar hiding interval
 * This creates a recurring interval that continuously ensures the navigation bar stays hidden
 * Returns a cleanup function to clear the interval when no longer needed
 */
export const setupNavigationBarHidingInterval = (): (() => void) => {
  // Hide immediately
  hideNavigationBar()

  // Set up an interval to continuously hide the navigation bar
  const interval = setInterval(() => {
    hideNavigationBar()
  }, 500) // Check every 500ms

  // Return cleanup function
  return () => clearInterval(interval)
}
