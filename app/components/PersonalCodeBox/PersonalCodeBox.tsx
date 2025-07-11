import { FC, useState } from "react"
import { View, TouchableOpacity, StyleProp, ViewStyle, TextStyle, Clipboard } from "react-native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { Text } from "@/components/Text"
import { PersonalCodeService } from "@/services/supabase/personalCodeService"
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
  onRefresh?: () => void
  isLoading?: boolean
}

export const PersonalCodeBox: FC<PersonalCodeBoxProps> = ({
  style,
  code = "HIVE-SJ47",
  subtitle = "Others can use this code to add you to groups",
  userName,
  onCopy,
  onShare,
  onRefresh,
  isLoading = false,
}) => {
  const { themed } = useAppTheme()
  const [isGenerating, setIsGenerating] = useState(false)
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

  const handleGenerateCode = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      const result = await PersonalCodeService.generatePersonalCode()

      if ("error" in result) {
        // If the error is that user already has a code, try to fetch it from database
        if (result.message?.includes("already has a personal code")) {
          const existingCode = await PersonalCodeService.fetchPersonalCodeFromDatabase()
          if (existingCode) {
            // Call onRefresh to update the parent component with the existing code
            onRefresh?.()
            // Show existing code message
            showCustomAlert("Code Found!", `Your existing personal code is: ${existingCode}`)
            return
          }
        }

        showCustomAlert(
          "Error",
          result.message || "Failed to generate personal code. Please try again.",
        )
      } else {
        // Call onRefresh to update the parent component
        onRefresh?.()
        // Show success message
        showCustomAlert("Success!", `Your new personal code is: ${result.personal_code}`)
      }
    } catch (error) {
      showCustomAlert(
        "Error",
        "Failed to generate personal code. Please check your connection and try again.",
      )
    } finally {
      setIsGenerating(false)
    }
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
              style={themed($refreshButton)}
              onPress={handleGenerateCode}
              disabled={isGenerating || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Generate new code"
            >
              <Text
                text={isGenerating ? "Generating..." : "Refresh"}
                style={themed($refreshText)}
              />
            </TouchableOpacity>
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
          {isLoading || isGenerating ? (
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
            text={isLoading || isGenerating ? "Generating your personal code..." : subtitle}
            style={themed($subtitle)}
            accessibilityLabel="Code subtitle"
          />
        </View>
        <TouchableOpacity
          style={themed($copyButton)}
          onPress={handleCopyCode}
          accessibilityRole="button"
          accessibilityLabel="Copy code"
          activeOpacity={0.8}
          disabled={!code || isLoading || isGenerating}
        >
          <Text text="Copy Code" style={themed($copyButtonText)} />
        </TouchableOpacity>
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

const $refreshButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  backgroundColor: colors.background,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: colors.sectionBorderColor,
})

const $refreshText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.textDim,
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
