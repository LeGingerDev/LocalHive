import type { Theme } from "./types"
import { Platform } from "react-native"

const systemui = require("expo-system-ui")

/**
 * Set the system UI background color to the given color. This is only available if the app has
 * installed expo-system-ui.
 *
 * Note: This function is disabled when edge-to-edge is enabled to prevent warnings.
 *
 * @param color The color to set the system UI background to
 */
export const setSystemUIBackgroundColor = (color: string) => {
  // Skip setting background color when edge-to-edge is enabled to prevent warnings
  if (Platform.OS === "android") {
    // Edge-to-edge is enabled in app.json, so we skip this call
    return
  }
  
  if (systemui) {
    systemui.setBackgroundColorAsync(color)
  }
}

/**
 * Set the app's native background color to match the theme.
 * This is only available if the app has installed expo-system-ui
 *
 * Note: This function is disabled when edge-to-edge is enabled to prevent warnings.
 *
 * @param theme The theme object to use for the background color
 */
export const setImperativeTheming = (theme: Theme) => {
  setSystemUIBackgroundColor(theme.colors.background)
}
