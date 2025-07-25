import React from "react"
import { View, StyleProp, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import StatVisual from "./StatVisual"

export interface ProfileStatProps {
  stats?: Array<{ value: number | string; label: string }>
  style?: StyleProp<ViewStyle>
}

export const ProfileStat: React.FC<ProfileStatProps> = ({ stats, style }) => {
  const { themed } = useAppTheme()
  // Use 2 placeholder stats if none provided
  const displayStats = stats ?? [
    { value: 0, label: "Groups" },
    { value: 0, label: "Items Added" },
  ]
  return (
    <View style={[themed($container), style]}>
      {displayStats.map((stat, idx) => (
        <StatVisual
          key={stat.label}
          value={stat.value}
          label={stat.label}
          style={idx < 2 ? themed($item) : undefined}
        />
      ))}
    </View>
  )
}

export default ProfileStat

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  paddingVertical: 0,
})

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.lg,
})
