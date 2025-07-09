import { Platform } from "react-native"
import * as NavigationBar from "expo-navigation-bar"

/**
 * Function to hide the Android navigation bar
 * This is a centralized utility to hide the navigation bar consistently across the app
 */
export const hideNavigationBar = async (): Promise<void> => {
  if (Platform.OS === "android") {
    try {
      // Set the navigation bar to hidden
      await NavigationBar.setVisibilityAsync("hidden")
      // Set behavior to overlay-swipe so it doesn't reappear easily
      await NavigationBar.setBehaviorAsync("overlay-swipe")
      // Make it transparent for good measure (in case it briefly appears)
      await NavigationBar.setBackgroundColorAsync("transparent")
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
