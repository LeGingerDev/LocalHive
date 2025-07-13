import { useEffect } from "react"
import { StatusBar } from "react-native"

import { useAppTheme } from "@/theme/context"

export const StatusBarManager = () => {
  const {
    theme: { colors },
    themeContext,
  } = useAppTheme()

  useEffect(() => {
    // Set status bar background color to match header background
    StatusBar.setBackgroundColor(colors.headerBackground, true)

    // Set status bar text color based on theme
    const barStyle = themeContext === "dark" ? "light-content" : "dark-content"
    StatusBar.setBarStyle(barStyle, true)
  }, [colors.headerBackground, themeContext])

  return null
}
