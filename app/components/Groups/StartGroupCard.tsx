import React from "react"
import { View, ViewStyle, TouchableOpacity } from "react-native"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"

interface StartGroupCardProps {
  onPress: () => void
}

export const StartGroupCard = ({ onPress }: StartGroupCardProps) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($startGroupCard)}>
      <View style={themed($plusIcon)}><Text text="+" style={themed($plusIconText)} /></View>
      <Text style={themed($startTitle)} text="Start Your Own Group" />
      <Text style={themed($startDesc)} text="Invite friends and family to build local knowledge together" />
      <TouchableOpacity 
        style={themed($createGroupButton)} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={themed($createGroupButtonText)} text="Create Group" />
      </TouchableOpacity>
    </View>
  )
}

// Styles (copy from GroupsScreen)
const $startGroupCard = ({ colors, spacing }: any) => ({ backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, alignItems: "center" as const, shadowColor: colors.palette.neutral800, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 })
const $plusIcon = ({ colors }: any) => ({ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary100, alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 8 })
const $plusIconText = ({ colors, typography }: any) => ({ color: colors.tint, fontFamily: typography.primary.bold, fontSize: 28 })
const $startTitle = ({ typography, colors }: any) => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.text, marginTop: 8 })
const $startDesc = ({ typography, colors }: any) => ({ fontFamily: typography.primary.normal, fontSize: 13, color: colors.textDim, marginTop: 4, marginBottom: 12, textAlign: "center" as const })
const $createGroupButton = ({ colors, typography }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24, overflow: "hidden" as "hidden" })
const $createGroupButtonText = ({ colors, typography }: any) => ({ color: colors.tint, fontFamily: typography.primary.medium, fontSize: 15, textAlign: "center" as const }) 