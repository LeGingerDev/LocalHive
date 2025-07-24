import { View, ViewStyle, Modal, TouchableOpacity, TextStyle } from "react-native"

import { Icon } from "@/components/Icon"
import { ProfileStat } from "@/components/profiles/ProfileStat"
import { Text } from "@/components/Text"
import { useUserStatsForUser } from "@/hooks/useUserStatsForUser"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface UserStatsModalProps {
  visible: boolean
  userId: string | null
  userName: string
  userAvatar?: string
  onClose: () => void
}

export const UserStatsModal = ({
  visible,
  userId,
  userName,
  userAvatar: _userAvatar,
  onClose,
}: UserStatsModalProps) => {
  const { themed } = useAppTheme()
  const { stats, loading, error } = useUserStatsForUser(userId)

  // Get user initial for avatar
  const userInitial = userName.charAt(0).toUpperCase() || "?"

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={themed($modalOverlay)}>
        <View style={themed($modalContainer)}>
          {/* Header */}
          <View style={themed($header)}>
            <View style={themed($headerContent)}>
              <View style={themed($userInfo)}>
                <View style={themed($avatar)}>
                  <Text style={themed($avatarInitial)} text={userInitial} />
                </View>
                <View style={themed($userDetails)}>
                  <Text style={themed($userName)} text={userName} />
                  <Text style={themed($userSubtitle)} text="Member Stats" />
                </View>
              </View>
            </View>
            <TouchableOpacity style={themed($closeButton)} onPress={onClose} activeOpacity={0.7}>
              <Icon icon="x" size={24} color={themed($closeButtonIcon).color} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={themed($content)}>
            {loading ? (
              <View style={themed($loadingContainer)}>
                <Text style={themed($loadingText)} text="Loading stats..." />
              </View>
            ) : error ? (
              <View style={themed($errorContainer)}>
                <Text style={themed($errorText)} text={error} />
              </View>
            ) : (
              <View style={themed($statsContainer)}>
                <ProfileStat
                  stats={[
                    { value: stats.groupsCount, label: "Groups" },
                    { value: stats.itemsCount, label: "Items Added" },
                    { value: stats.groupsCreatedCount, label: "Groups Created" },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $modalOverlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContainer = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: "45%",
  minHeight: "30%",
})

const $header = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.cardColor,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $headerContent = (): ViewStyle => ({
  flex: 1,
})

const $userInfo = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
})

const $avatar = ({ colors, spacing }: any): ViewStyle => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: colors.palette.primary200,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.md,
  borderWidth: 2,
  borderColor: colors.palette.primary300,
})

const $avatarInitial = ({ colors, typography }: any): TextStyle => ({
  color: colors.palette.primary600,
  fontFamily: typography.primary.bold,
  fontSize: 20,
})

const $userDetails = (): ViewStyle => ({
  flex: 1,
})

const $userName = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $userSubtitle = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
})

const $closeButtonIcon = ({ colors }: any): { color: string } => ({
  color: colors.text,
})

const $content = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
})

const $loadingContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $loadingText = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
})

const $errorContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $errorText = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.error,
  textAlign: "center",
})

const $statsContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.lg,
})
