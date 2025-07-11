import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface StatVisualProps {
  value: number | string
  label: string
  style?: StyleProp<ViewStyle>
}

export const StatVisual: React.FC<StatVisualProps> = ({ value, label, style }) => {
  const { themed } = useAppTheme()
  return (
    <View style={[themed($container), style]}>
      <Text style={themed($value)}>{value}</Text>
      <Text style={themed($label)}>{label}</Text>
    </View>
  )
}

export default StatVisual

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $value: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: colors.text,
})

const $label: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: colors.textDim,
  marginTop: spacing.xxs,
})
