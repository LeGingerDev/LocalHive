import React from "react"
import { FC, memo } from "react"
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native"

import { Avatar } from "@/components/Avatar"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { GroupMember } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
export interface MemberCardProps {
  style?: StyleProp<ViewStyle>
  data?: GroupMember | null
  isLoading?: boolean
  error?: string | null
  onPress?: () => void
  onRemove?: () => void
  canRemove?: boolean
  onRetry?: () => void
  testID?: string
}
// #endregion

// #region Component
export const MemberCard: FC<MemberCardProps> = memo(function MemberCard(props) {
  const {
    style,
    data = null,
    isLoading = false,
    error = null,
    onPress,
    onRemove,
    canRemove = false,
    onRetry,
    testID = "memberCardComponent",
  } = props
  const { themed } = useAppTheme()

  if (isLoading) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_loading`}>
        <ActivityIndicator
          size="small"
          color={themed($activityIndicatorColor).color}
          style={themed($loadingIndicator)}
        />
        <Text style={themed($loadingText)} text="Loading..." testID={`${testID}_loadingText`} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_error`}>
        <Text
          style={themed($errorText)}
          text={error ?? "Something went wrong"}
          testID={`${testID}_errorText`}
        />
        {onRetry && (
          <Text
            style={themed($retryButton)}
            text="Retry"
            onPress={onRetry}
            testID={`${testID}_retryButton`}
          />
        )}
      </View>
    )
  }

  if (!data) return null

  // Get member information
  const memberName = data.user?.full_name || "Unknown User"
  const memberRole = data.role
  const joinedDate = new Date(data.joined_at).toLocaleDateString()
  const initial = memberName[0]?.toUpperCase() || "?"

  return (
    <View style={[themed($container), style]} testID={testID}>
      <TouchableOpacity style={$cardContent} onPress={onPress} activeOpacity={0.7}>
        <Avatar
          imageUrl={data.user?.avatar_url}
          initials={initial}
          size={44}
          style={themed($avatarSpacing)}
          testID={`${testID}_avatar`}
        />
        <View style={$infoContainer}>
          <Text style={themed($name)} text={memberName} />
          <Text style={themed($meta)} text={`Joined ${joinedDate}`} />
        </View>
        <View style={$rightContainer}>
          <Text style={themed($roleText)} text={memberRole} />
          {canRemove && onRemove && (
            <TouchableOpacity
              style={themed($removeButton)}
              onPress={onRemove}
              activeOpacity={0.7}
              testID={`${testID}_remove_button`}
            >
              <Icon icon="x" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
})

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  padding: spacing.sm,
  paddingVertical: spacing.sm + 2,
  marginBottom: spacing.sm,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
  borderWidth: 1,
  borderColor: colors.border,
  position: "relative",
})

const $cardContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
}

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 16,
})

const $avatarColor =
  (colorKey: string): ThemedStyle<ViewStyle> =>
  ({ colors }) => ({
    backgroundColor:
      colors.palette[colorKey as keyof typeof colors.palette] || colors.palette.primary300,
  })

const $avatarInitial: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.neutral100,
  fontFamily: typography.primary.medium,
  fontSize: 20,
})

const $avatarSpacing: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $infoContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
}

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
})

const $meta: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 13,
  marginTop: 2,
})

const $rightContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 80,
}

const $roleText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 12,
  textTransform: "capitalize" as const,
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  overflow: "hidden",
  textAlign: "center",
})

const $removeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: colors.error,
  alignItems: "center",
  justifyContent: "center",
  marginLeft: spacing.xs,
})

const $activityIndicatorColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $loadingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 14,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  textAlign: "center" as const,
})

const $retryButton: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textAlign: "center" as const,
  marginTop: 8,
})
// #endregion
