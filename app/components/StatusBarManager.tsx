import { useEffect } from "react"
import { AppState, AppStateStatus, StatusBar } from "react-native"

import { useAppTheme } from "@/theme/context"

export const StatusBarManager = () => {
  const {
    theme: { colors },
    themeContext,
  } = useAppTheme()

  // Function to update status bar colors
  const updateStatusBarColors = () => {
    // Set status bar background color to match header background
    StatusBar.setBackgroundColor(colors.headerBackground, true)

    // Set status bar text color based on theme
    const barStyle = themeContext === "dark" ? "light-content" : "dark-content"
    StatusBar.setBarStyle(barStyle, true)
  }

  // Update status bar colors when theme changes
  useEffect(() => {
    updateStatusBarColors()
  }, [colors.headerBackground, themeContext])

  // Update status bar colors when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App has come to the foreground - restore status bar colors
        updateStatusBarColors()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [colors.headerBackground, themeContext])

  return null
}
