import React from "react"
import { StyleProp, TextStyle, View, ViewStyle, TouchableOpacity } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface SettingsItemProps {
  icon: string
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  signOut?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void
}

export const SettingsItem = (props: SettingsItemProps) => {
  const { icon, label, onPress, style, signOut, toggle, toggleValue, onToggleChange } = props
  const { themed, theme } = useAppTheme()
  const $styles = [themed($container), signOut && themed($signOut), style]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={$styles}>
      <View style={themed([$iconContainer, signOut && $iconContainerSignOut])}>
        <Ionicons
          name={icon}
          size={22}
          color={signOut ? theme.colors.palette.angry500 : theme.colors.text}
        />
      </View>
      <Text style={themed([$label, signOut && $labelSignOut])}>{label}</Text>
      {toggle ? (
        <View style={{ marginLeft: "auto" }}>
          <Switch value={toggleValue} onValueChange={onToggleChange} />
        </View>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={22}
          color={signOut ? theme.colors.palette.angry500 : theme.colors.textDim}
          style={{ marginLeft: "auto" }}
        />
      )}
    </TouchableOpacity>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.cardColor,
  paddingVertical: 16,
  paddingHorizontal: 20,

  marginBottom: 0,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
})

const $iconContainerSignOut: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.angry100,
})

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})

const $labelSignOut: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
  fontWeight: "700",
})

const $signOut: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.angry100,
})
