import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Icon } from "@/components/Icon"
// import LinearGradient from "react-native-linear-gradient" // Remove if not installed

export interface SubContainerProps {
  style?: StyleProp<ViewStyle>
  onUpgrade?: () => void
}

export const SubContainer: React.FC<SubContainerProps> = ({ style, onUpgrade }) => {
  const { themed, theme } = useAppTheme()
  return (
    <View style={[themed($container), style]}>
      <View style={themed($row)}>
        {/* Fallback: Use a View with a solid color if LinearGradient is not available */}
        <View style={themed($iconGradient)}>
          <Icon icon="settings" color={theme.colors.background} size={28} />
        </View>
        <View style={themed($textCol)}>
          <Text style={themed($title)}>Local Hive Pro</Text>
          <Text style={themed($subtitle)}>AI-powered search & premium features</Text>
        </View>
      </View>
      <View style={themed($footerRow)}>
        <Text style={themed($trialInfo)}>Free Trial • 5 days left</Text>
        <TouchableOpacity style={themed($button)} onPress={onUpgrade}>
          <Text style={themed($buttonText)}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SubContainer

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 16,
  backgroundColor: colors.cardColor,
  padding: spacing.lg,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
})

const $row: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
})

const $iconGradient: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 48,
  height: 48,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.md,
  backgroundColor: colors.gradientOrange[0], // orange gradient background
})

const $textCol: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginTop: spacing.xxs,
})

const $footerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: spacing.lg,
})

const $trialInfo: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
})

const $button: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.gradientOrange[0],
  borderRadius: 10,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xl,
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: colors.background,
})