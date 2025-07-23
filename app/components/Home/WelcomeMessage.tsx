import React, { FC } from "react"
import { View, Text, ViewStyle, TextStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

interface WelcomeMessageProps {
  userProfile?: {
    full_name?: string
    email?: string
  } | null
}

export const WelcomeMessage: FC<WelcomeMessageProps> = ({ userProfile }) => {
  const { themed } = useAppTheme()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getUserName = () => {
    if (!userProfile) return ""
    // Use full name if available, otherwise fall back to email username
    if (userProfile.full_name) {
      return userProfile.full_name
    }
    if (userProfile.email) {
      return userProfile.email.split("@")[0]
    }
    return ""
  }

  return (
    <View style={themed($container)}>
      <Text style={themed($greeting)}>
        {getGreeting()}
        {getUserName() ? `, ${getUserName()}` : ""}! 👋
      </Text>
      <Text style={themed($subtitle)}>Manage your groups and items with ease</Text>
    </View>
  )
}

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.sm,
})

const $greeting: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
})
