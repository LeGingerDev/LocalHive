import React from "react"
import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"

export interface SettingsSectionProps {
  style?: StyleProp<ViewStyle>
  header?: string
  children?: React.ReactNode
}

export const SettingsSection = (props: SettingsSectionProps) => {
  const { style, children, header } = props
  const { themed, theme } = useAppTheme();
  const $styles = [themed($container), style]

  return (
    <View style={$styles}>
      {header && <Text style={themed($header)}>{header}</Text>}
      {children}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: 16,
  backgroundColor: colors.background,
  borderWidth: 1.5,
  borderColor: colors.sectionBorderColor,
  paddingVertical: 8,
  marginVertical: 12,
})

const $header: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: 10,
  marginTop: 4,
  marginHorizontal: 12,
  letterSpacing: 0.5,
})
