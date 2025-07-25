import React from "react"
import { View, StyleProp, ViewStyle, FlexAlignType, TextStyle } from "react-native"

import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { HapticService } from "@/services/hapticService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row" as ViewStyle["flexDirection"],
  alignItems: "center" as FlexAlignType,
  backgroundColor: colors.cardColor,
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 16,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
  marginBottom: 16,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center" as FlexAlignType,
  justifyContent: "center" as ViewStyle["justifyContent"],
  marginRight: 8,
})

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { themeContext, setThemeContextOverride, themed, theme } = useAppTheme()

  const handleToggle = (value: boolean) => {
    HapticService.light()
    setThemeContextOverride(value ? "dark" : "light")
  }

  return (
    <View style={[themed($container), style]}>
      <View style={themed($iconContainer)}>
        {/* 'moon' icon does not exist, using 'settings' as placeholder */}
        <Icon icon="settings" size={22} color={theme.colors.text} />
      </View>
      <Text style={themed($label)}>Dark Mode</Text>
      <View style={{ marginLeft: "auto" }}>
        <Switch value={themeContext === "dark"} onValueChange={handleToggle} />
      </View>
    </View>
  )
}
