import { FC, useState } from "react"
import { View, TouchableOpacity, StyleProp, ViewStyle, TextStyle, Clipboard } from "react-native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Text } from "@/components/Text"

import { ShareService } from "@/services/supabase/shareService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface PersonalCodeBoxProps {
  style?: StyleProp<ViewStyle>
  code?: string
  subtitle?: string
  userName?: string
  onCopy?: () => void
  onShare?: () => void
  isLoading?: boolean
}

export const PersonalCodeBox: FC<PersonalCodeBoxProps> = ({
  style,
  code = "HIVE-SJ47",
  subtitle = "Others can use this code to add you to groups",
  userName,
  onCopy,
  onShare,
  isLoading = false,
}) => {
  const { themed } = useAppTheme()

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmText, setAlertConfirmText] = useState("OK")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )
  const [alertOnConfirm, setAlertOnConfirm] = useState<() => void>(
    () => () => setAlertVisible(false),
  )

  // Helper to show a CustomAlert
  const showCustomAlert = (
    title: string,
    message: string,
    confirmText = "OK",
    confirmStyle: "default" | "destructive" | "success" = "default",
    onConfirm?: () => void,
  ) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertConfirmText(confirmText)
    setAlertConfirmStyle(confirmStyle)
    setAlertOnConfirm(() => () => {
      setAlertVisible(false)
      if (onConfirm) onConfirm()
    })
    setAlertVisible(true)
  }

  

  const handleCopyCode = async () => {
    if (!code) {
      showCustomAlert("No Code", "Generate a personal code first.")
      return
    }

    try {
      await Clipboard.setString(code)
      showCustomAlert("Copied!", "Personal code copied to clipboard.")
    } catch (error) {
      showCustomAlert("Error", "Failed to copy code to clipboard.")
    }
  }

  const handleShareCode = async () => {
    if (!code) {
      showCustomAlert("No Code", "Generate a personal code first.")
      return
    }

    try {
      const success = await ShareService.sharePersonalCode(code, userName)

      if (!success) {
        showCustomAlert("Sharing Unavailable", "Sharing is not available on this device.")
      }
    } catch (error) {
      showCustomAlert("Error", "Failed to share code. Please try again.")
    }
  }

  return (
    <>
      <View style={[themed($container), style]}>
        <View style={themed($header)}>
          <Text text="Your Personal Code" style={themed($title)} accessibilityRole="header" />
          <View style={themed($headerButtons)}>
            <TouchableOpacity
              style={themed($shareButton)}
              onPress={handleShareCode}
              accessibilityRole="button"
              accessibilityLabel="Share code"
            >
              <Text text="Share" style={themed($shareText)} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={themed($codeBox)}>
          {isLoading ? (
            <Text
              text="Loading..."
              style={themed($code)}
              accessibilityLabel="Loading personal code"
            />
          ) : code ? (
            <Text text={code} style={themed($code)} accessibilityLabel="Personal code" />
          ) : (
            <Text
              text="No code generated"
              style={themed($code)}
              accessibilityLabel="No personal code"
            />
          )}
          <Text
            text={isLoading ? "Loading your personal code..." : subtitle}
            style={themed($subtitle)}
            accessibilityLabel="Code subtitle"
          />
        </View>
        <CustomGradient preset="primary" style={themed($copyButton)}>
          <TouchableOpacity
            style={themed($copyButtonInner)}
            onPress={handleCopyCode}
            accessibilityRole="button"
            accessibilityLabel="Copy code"
            activeOpacity={0.8}
            disabled={!code || isLoading}
          >
            <Text text="Copy Code" style={themed($copyButtonText)} />
          </TouchableOpacity>
        </CustomGradient>
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText={alertConfirmText}
        onConfirm={alertOnConfirm}
        confirmStyle={alertConfirmStyle}
      />
    </>
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

const $headerButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
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
  borderRadius: 8,
  overflow: "hidden",
})
const $copyButtonInner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: "transparent",
  borderRadius: 8,
  paddingVertical: spacing.md,
  alignItems: "center",
})

const $copyButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: "#ffffff",
})
