import React, { FC } from "react"
import { View, Text, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"

interface WelcomeMessageProps {
  userEmail?: string | null
}

export const WelcomeMessage: FC<WelcomeMessageProps> = ({ userEmail }) => {
  const { themed } = useAppTheme()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getUserName = () => {
    if (!userEmail) return ""
    return userEmail.split('@')[0]
  }

  return (
    <View style={themed($container)}>
      <Text style={themed($greeting)}>
        {getGreeting()}{getUserName() ? `, ${getUserName()}` : ''}! 👋
      </Text>
      <Text style={themed($subtitle)}>
        Manage your groups and items with ease
      </Text>
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