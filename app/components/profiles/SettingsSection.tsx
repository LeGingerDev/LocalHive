import React from "react"
import { View, StyleProp, ViewStyle } from "react-native"

export interface SettingsSectionProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ children, style }) => {
  return <View style={style}>{children}</View>
}
