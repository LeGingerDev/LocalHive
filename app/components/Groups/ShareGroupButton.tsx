import React from "react"
import { TouchableOpacity, ViewStyle, StyleProp } from "react-native"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { useShare } from "@/hooks/useShare"
import { CustomAlert } from "@/components/Alert/CustomAlert"

interface ShareGroupButtonProps {
  groupName: string
  groupCode?: string
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export const ShareGroupButton: React.FC<ShareGroupButtonProps> = ({
  groupName,
  groupCode,
  style,
  disabled = false,
}) => {
  const { themed } = useAppTheme()
  const { shareGroupInvitation, isSharing } = useShare()
  const [alertVisible, setAlertVisible] = React.useState(false)
  const [alertMessage, setAlertMessage] = React.useState("")

  const handleShare = async () => {
    if (disabled || isSharing) return

    try {
      const success = await shareGroupInvitation(groupName, groupCode)
      
      if (!success) {
        setAlertMessage("Sharing is not available on this device.")
        setAlertVisible(true)
      }
    } catch (error) {
      setAlertMessage("Failed to share group invitation. Please try again.")
      setAlertVisible(true)
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[
          themed($shareButton),
          disabled && themed($disabledButton),
          style,
        ]}
        onPress={handleShare}
        disabled={disabled || isSharing}
        accessibilityRole="button"
        accessibilityLabel="Share group invitation"
      >
        <Text
          text={isSharing ? "Sharing..." : "Share Group"}
          style={themed($shareButtonText)}
        />
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        title="Share Error"
        message={alertMessage}
        confirmText="OK"
        onConfirm={() => setAlertVisible(false)}
        confirmStyle="default"
      />
    </>
  )
}

const $shareButton = ({ colors, spacing }: any) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  alignItems: "center" as const,
  justifyContent: "center" as const,
})

const $disabledButton = ({ colors }: any) => ({
  backgroundColor: colors.palette.neutral300,
  opacity: 0.6,
})

const $shareButtonText = ({ colors, typography }: any) => ({
  color: "white",
  fontFamily: typography.primary.medium,
  fontSize: 14,
}) 