import React from "react"
import { FC, memo } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"
import { GroupMember } from "@/services/api/types"

// #region Types & Interfaces
export interface MemberCardProps {
  style?: StyleProp<ViewStyle>
  data?: GroupMember | null
  isLoading?: boolean
  error?: string | null
  onPress?: () => void
  onRetry?: () => void
  testID?: string
}
// #endregion

// #region Component
export const MemberCard: FC<MemberCardProps> = memo((props) => {
  const {
    style,
    data = null,
    isLoading = false,
    error = null,
    onPress,
    onRetry,
    testID = "memberCardComponent"
  } = props
  const { themed } = useAppTheme()

  if (isLoading) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_loading`}>
        <ActivityIndicator size="small" color={themed($activityIndicatorColor).color} style={themed($loadingIndicator)} />
        <Text style={themed($loadingText)} text="Loading..." testID={`${testID}_loadingText`} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_error`}>
        <Text style={themed($errorText)} text={error ?? "Something went wrong"} testID={`${testID}_errorText`} />
        {onRetry && (
          <Text style={themed($retryButton)} text="Retry" onPress={onRetry} testID={`${testID}_retryButton`} />
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

  // Generate avatar color based on member name
  const avatarColors = ['primary300', 'accent200', 'secondary300', 'primary200', 'accent300']
  const colorIndex = memberName.length % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  return (
    <View style={[themed($container), style]} testID={testID} onTouchEnd={onPress}>
      <View style={[themed($avatar), themed($avatarColor(avatarColor))]}> 
        <Text style={themed($avatarInitial)} text={initial} />
      </View>
      <View style={$infoContainer}>
        <Text style={themed($name)} text={memberName} />
        <Text style={themed($meta)} text={`${memberRole} • Joined ${joinedDate}`} />
      </View>
      <View style={$roleContainer}>
        <Text style={themed($roleText)} text={memberRole} />
      </View>
    </View>
  )
})

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
})

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 16,
})

const $avatarColor = (colorKey: string): ThemedStyle<ViewStyle> => ({ colors }) => ({
  backgroundColor: colors.palette[colorKey as keyof typeof colors.palette] || colors.palette.primary300,
})

const $avatarInitial: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.neutral100,
  fontFamily: typography.primary.medium,
  fontSize: 20,
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

const $roleContainer: ViewStyle = {
  alignItems: "flex-end",
  justifyContent: "center",
  minWidth: 60,
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