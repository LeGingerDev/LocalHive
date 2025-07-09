import { FC } from "react"
import { View, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"

export interface PersonalCodeBoxProps {
  style?: StyleProp<ViewStyle>
  code?: string
  subtitle?: string
  onCopy?: () => void
  onShare?: () => void
}

export const PersonalCodeBox: FC<PersonalCodeBoxProps> = ({
  style,
  code = "HIVE-SJ47",
  subtitle = "Others can use this code to add you to groups",
  onCopy,
  onShare,
}) => {
  const { themed } = useAppTheme()

  return (
    <View style={[themed($container), style]}>
      <View style={themed($header)}>
        <Text
          text="Your Personal Code"
          style={themed($title)}
          accessibilityRole="header"
        />
        <TouchableOpacity
          style={themed($shareButton)}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share code"
        >
          <Text text="Share" style={themed($shareText)} />
        </TouchableOpacity>
      </View>
      <View style={themed($codeBox)}>
        <Text
          text={code}
          style={themed($code)}
          accessibilityLabel="Personal code"
        />
        <Text
          text={subtitle}
          style={themed($subtitle)}
          accessibilityLabel="Code subtitle"
        />
      </View>
      <TouchableOpacity
        style={themed($copyButton)}
        onPress={onCopy}
        accessibilityRole="button"
        accessibilityLabel="Copy code"
        activeOpacity={0.8}
      >
        <Text text="Copy Code" style={themed($copyButtonText)} />
      </TouchableOpacity>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 16,
  padding: spacing.lg,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
  borderWidth: 1,
  marginBottom: 16,
  borderColor: colors.sectionBorderColor,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.md,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: colors.text,
})

const $shareButton: ThemedStyle<ViewStyle> = () => ({
  paddingHorizontal: 4,
  paddingVertical: 2,
})

const $shareText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.link,
  textDecorationLine: "underline",
})

const $codeBox: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.lg,
  marginBottom: spacing.md,
})

const $code: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 28,
  color: colors.text,
  letterSpacing: 2,
  marginBottom: 4,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
  textAlign: "center",
})

const $copyButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 8,
  paddingVertical: spacing.md,
  alignItems: "center",
})

const $copyButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.background,
})