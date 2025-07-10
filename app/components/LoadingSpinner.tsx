import React from "react"
import { View, ActivityIndicator, ViewStyle } from "react-native"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

interface LoadingSpinnerProps {
  size?: "small" | "large"
  text?: string
  style?: ViewStyle
}

export const LoadingSpinner = ({ size = "large", text, style }: LoadingSpinnerProps) => {
  const { themed } = useAppTheme()

  return (
    <View style={[themed($container), style]}>
      <ActivityIndicator size={size} color={themed($spinner).color} />
      {text && <Text style={themed($text)} text={text} />}
    </View>
  )
}

const $container = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})

const $spinner = ({ colors }: any) => ({
  color: colors.tint,
})

const $text = ({ typography, colors, spacing }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginTop: spacing.sm,
  textAlign: "center" as const,
}) 