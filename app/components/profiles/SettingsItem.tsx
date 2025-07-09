import React from "react"
import { StyleProp, TextStyle, View, ViewStyle, TouchableOpacity } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"
import Ionicons from "react-native-vector-icons/Ionicons"
import { Switch } from "@/components/Toggle/Switch"

export interface SettingsItemProps {
  icon: string
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  signOut?: boolean
  first?: boolean
  last?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void
}

export const SettingsItem = (props: SettingsItemProps) => {
  const { icon, label, onPress, style, signOut, first, last, toggle, toggleValue, onToggleChange } = props
  const { themed, theme } = useAppTheme();
  const $styles = [
    themed($container),
    first && themed($first),
    last && themed($last),
    signOut && themed($signOut),
    style,
  ]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={$styles}>
      <View style={themed($iconContainer)}>
        <Ionicons name={icon} size={22} color={signOut ? theme.colors.palette.angry500 : theme.colors.text} />
      </View>
      <Text style={themed([ $label, signOut && $labelSignOut ])}>{label}</Text>
      {toggle ? (
        <View style={{ marginLeft: 'auto' }}>
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
          />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={22} color={signOut ? theme.colors.palette.angry500 : theme.colors.textDim} style={{ marginLeft: 'auto' }} />
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
  borderRadius: 12,
  marginVertical: 6,
  marginHorizontal: 12,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 16,
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

const $first: ThemedStyle<ViewStyle> = () => ({
  marginTop: 0,
})

const $last: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 0,
})
