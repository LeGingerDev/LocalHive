import React from "react"
import { StyleSheet, ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { useAppTheme } from "@/theme/context"
import { GradientColors } from "@/theme/types"

export interface CustomGradientProps {
  /**
   * The style of the container.
   */
  style?: ViewStyle
  /**
   * Which preset gradient to use.
   */
  preset?: "primary" | "secondary" | "accent" | "custom"
  /**
   * Custom colors to use for gradient if preset is "custom"
   */
  customColors?: string[]
  /**
   * Children components.
   */
  children?: React.ReactNode
  /**
   * Start point of the gradient
   */
  start?: { x: number; y: number }
  /**
   * End point of the gradient
   */
  end?: { x: number; y: number }
}

/**
 * A reusable gradient component that can be used as a background.
 */
export function CustomGradient(props: CustomGradientProps) {
  const {
    style,
    preset = "primary",
    customColors,
    children,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
  } = props
  const { theme } = useAppTheme()

  // Get the appropriate colors based on the preset
  const getGradientColors = (): GradientColors => {
    switch (preset) {
      case "primary":
        return theme.colors.gradientPrimary
      case "secondary":
        return theme.colors.gradientSecondary
      case "accent":
        return theme.colors.gradientAccent
      case "custom":
        return customColors && customColors.length >= 2
          ? ([customColors[0], customColors[1]] as GradientColors)
          : theme.colors.gradientPrimary
      default:
        return theme.colors.gradientPrimary
    }
  }

  return (
    <LinearGradient
      style={[styles.gradient, style]}
      colors={getGradientColors()}
      start={start}
      end={end}
    >
      {children}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
})
