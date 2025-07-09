import React from "react"
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from "react-native"

import { Icon, IconTypes } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"

export interface RoundedButtonProps {
  /**
   * Text to display on the button
   */
  text: string

  /**
   * Function to call when button is pressed
   */
  onPress?: () => void

  /**
   * Button preset style
   */
  preset?: "primary" | "secondary" | "outline" | "google" | "apple" | "email"

  /**
   * Optional icon name to display before text
   */
  icon?: IconTypes

  /**
   * Color of the icon
   */
  iconColor?: string

  /**
   * Size of the icon
   */
  iconSize?: number

  /**
   * Whether the button is in a loading state
   */
  loading?: boolean

  /**
   * Whether the button is disabled
   */
  disabled?: boolean

  /**
   * Additional styles for the button container
   */
  style?: ViewStyle | ViewStyle[]

  /**
   * Additional styles for the button text
   */
  textStyle?: TextStyle

  /**
   * Additional styles for the content container
   */
  contentContainerStyle?: ViewStyle
}

/**
 * A reusable rounded button component with various presets
 */
export function RoundedButton(props: RoundedButtonProps) {
  const {
    text,
    onPress,
    preset = "primary",
    icon,
    iconColor,
    iconSize = 20,
    loading = false,
    disabled = false,
    style: styleOverride,
    textStyle: textStyleOverride,
    contentContainerStyle: contentContainerStyleOverride,
  } = props

  const { theme } = useAppTheme()

  // Determine container style based on preset
  const containerStyle = [
    styles.container,
    preset === "primary" && { backgroundColor: theme.colors.tint },
    preset === "secondary" && { backgroundColor: theme.colors.palette.neutral200 },
    preset === "outline" && {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    preset === "google" && {
      backgroundColor: "white",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    preset === "apple" && { backgroundColor: "black" },
    preset === "email" && {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    disabled && { opacity: 0.6 },
    styleOverride,
  ]

  // Determine text style based on preset
  const textStyle = [
    styles.text,
    preset === "primary" && { color: "white" },
    preset === "secondary" && { color: theme.colors.text },
    preset === "outline" && { color: "white" },
    preset === "google" && { color: "#333" },
    preset === "apple" && { color: "white" },
    preset === "email" && { color: "white" },
    disabled && { opacity: 0.6 },
    textStyleOverride,
  ]

  // Determine icon color based on preset if not explicitly provided
  const finalIconColor =
    iconColor ||
    (preset === "primary"
      ? "white"
      : preset === "secondary"
        ? theme.colors.text
        : preset === "outline"
          ? "white"
          : preset === "google"
            ? "#4285F4"
            : preset === "apple"
              ? "white"
              : "white")

  const contentContainerStyle = [styles.contentContainer, contentContainerStyleOverride]

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={contentContainerStyle}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              preset === "secondary" ? theme.colors.text : preset === "google" ? "#4285F4" : "white"
            }
            style={styles.icon}
          />
        ) : icon ? (
          <Icon icon={icon} size={iconSize} color={finalIconColor} style={styles.icon} />
        ) : null}

        <Text style={textStyle}>{text}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: "100%",
  },
  contentContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: "700",
  },
})
