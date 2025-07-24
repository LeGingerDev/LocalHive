import React, { FC, memo, useCallback, useMemo, useEffect, useState } from "react"
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useUserStats } from "@/hooks/useUserStats"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

import { EditableProfileName } from "./EditableProfileName"
import ProfileStat from "./ProfileStat"

// #region Types & Interfaces
export interface ProfileBoxProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>

  /**
   * The main data for this component
   */
  data?: ProfileBoxData | null

  /**
   * Loading state indicator
   */
  isLoading?: boolean

  /**
   * Error state for the component
   */
  error?: string | null

  /**
   * Optional callback when component is pressed
   */
  onPress?: () => void

  /**
   * Optional callback for retry action
   */
  onRetry?: () => void

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

interface ProfileBoxData {
  id?: string
  name?: string
  email?: string
  avatarUrl?: string
  displayName?: string
  bio?: string
}
// #endregion

// #region Private Helper Functions
const _isValidData = (data: ProfileBoxData | null | undefined): data is ProfileBoxData => {
  return data != null && typeof data === "object"
}

const _getDisplayName = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data)) return "Guest User"
  return data.displayName ?? data.name ?? "Unknown User"
}

const _getDisplayEmail = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data)) return "No email available"
  return data.email ?? "No email provided"
}

const _getDisplayBio = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data) || !data.bio) return ""
  return data.bio
}

const _getAvatarInitial = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data)) return "G"
  const name = data.displayName ?? data.name ?? ""
  return name.charAt(0).toUpperCase() || "G"
}
// #endregion

// #region Component
/**
 * ProfileBox - A defensive component with proper error handling and loading states
 *
 * Features:
 * - Loading state support
 * - Error state handling
 * - Null safety checks
 * - Memoized for performance
 * - Follows SOLID principles
 * - Integrates with auth context for real user data
 */
export const ProfileBox: FC<ProfileBoxProps> = memo((props) => {
  // #region Props Destructuring with Defaults
  const {
    style,
    data = null,
    isLoading = false,
    error = null,
    onPress,
    onRetry,
    testID = "profileBoxComponent",
  } = props
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { user, googleUser, userProfile, isLoading: authLoading } = useAuth()
  const userStats = useUserStats()
  const [isEditingName, setIsEditingName] = useState(false)
  // #endregion

  // Removed debug logging to improve performance

  // #region Memoized Values
  const _containerStyles = useMemo(() => [themed($container), style], [themed, style])

  // Use provided data or fall back to auth context data
  const _userData = useMemo((): ProfileBoxData | null => {
    if (data) {
      return data
    }

    // First priority: use the user profile from the database
    if (userProfile) {
      return {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name,
        displayName: userProfile.full_name || userProfile.email?.split("@")[0],
        avatarUrl: userProfile.avatar_url,
        bio: userProfile.bio,
      }
    }

    // Second priority: use Supabase user data
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name,
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0],
        avatarUrl: user.user_metadata?.avatar_url,
      }
    }

    // Third priority: use Google user data
    if (googleUser) {
      return {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        displayName: googleUser.name || googleUser.email?.split("@")[0],
        avatarUrl: googleUser.picture,
      }
    }

    return null
  }, [data, user, googleUser, userProfile])

  const _displayName = useMemo(() => {
    return _getDisplayName(_userData)
  }, [_userData])

  const _displayEmail = useMemo(() => {
    return _getDisplayEmail(_userData)
  }, [_userData])

  const _displayBio = useMemo(() => {
    return _getDisplayBio(_userData)
  }, [_userData])

  const _avatarInitial = useMemo(() => {
    return _getAvatarInitial(_userData)
  }, [_userData])

  const _hasValidData = useMemo(() => {
    return _isValidData(_userData)
  }, [_userData])

  const _isLoading = useMemo(() => {
    return isLoading || authLoading || userStats.loading
  }, [isLoading, authLoading, userStats.loading])
  // #endregion

  // #region Event Handlers
  const _handlePress = useCallback((): void => {
    if (onPress && !_isLoading && !error) {
      onPress()
    }
  }, [onPress, _isLoading, error])

  const _handleRetry = useCallback((): void => {
    if (onRetry) {
      onRetry()
    }
  }, [onRetry])
  // #endregion

  // #region Render Helpers
  const _renderLoadingState = (): React.ReactElement => (
    <View style={_containerStyles} testID={`${testID}_loading`}>
      <ActivityIndicator
        size="small"
        color={themed($activityIndicatorColor).color}
        style={themed($loadingIndicator)}
      />
      <Text
        style={themed($loadingText)}
        text="Loading profile..."
        testID={`${testID}_loadingText`}
      />
    </View>
  )

  const _renderErrorState = (): React.ReactElement => (
    <View style={_containerStyles} testID={`${testID}_error`}>
      <Text
        style={themed($errorText)}
        text={error ?? "Failed to load profile"}
        testID={`${testID}_errorText`}
      />
      {onRetry && (
        <Text
          style={themed($retryButton)}
          text="Retry"
          onPress={_handleRetry}
          testID={`${testID}_retryButton`}
        />
      )}
    </View>
  )

  // #region Helper Functions
  const _getPressableProps = useCallback(() => {
    if (!onPress) return {}
    return {
      accessible: true,
      accessibilityRole: "button" as const,
      onPress: _handlePress,
    }
  }, [onPress, _handlePress])
  // #endregion

  const _renderContent = (): React.ReactElement => {
    return (
      <View style={_containerStyles} testID={testID} {..._getPressableProps()}>
        {/* Edit Button - positioned absolutely in top-right corner */}
        {!isEditingName && (
          <TouchableOpacity
            style={themed($editButton)}
            onPress={() => setIsEditingName(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={14} color={themed($editButtonIcon).color} />
          </TouchableOpacity>
        )}

        <View style={themed($contentContainer)}>
          {/* Avatar */}
          <View style={themed($avatar)}>
            <Text style={themed($avatarInitial)} text={_avatarInitial} />
          </View>
          {/* User Name */}
          <EditableProfileName
            initialName={_displayName}
            style={themed($name)}
            showEditButton={false}
            isEditing={isEditingName}
            onEditingChange={setIsEditingName}
          />
          {/* User Email */}
          <Text style={themed($email)} text={_displayEmail} testID={`${testID}_email`} />
          {/* User Bio - only show if there is bio content */}
          {_displayBio ? (
            <Text style={themed($bio)} text={_displayBio} testID={`${testID}_bio`} />
          ) : null}
        </View>
        {/* Separator line */}
        <View style={themed($separator)} />
        {/* ProfileStat */}
        <ProfileStat
          stats={[
            { value: userStats.stats.groupsCount, label: "Groups" },
            { value: userStats.stats.itemsCount, label: "Items Added" },
            { value: userStats.stats.groupsCreatedCount, label: "Groups Created" },
          ]}
        />
      </View>
    )
  }

  const _renderEmptyState = (): React.ReactElement => (
    <View style={_containerStyles} testID={`${testID}_empty`}>
      <Text
        style={themed($emptyText)}
        text="No profile data available"
        testID={`${testID}_emptyText`}
      />
    </View>
  )
  // #endregion

  // #region Main Render Logic
  if (_isLoading) {
    console.log("🔍 [ProfileBox] Rendering loading state")
    return _renderLoadingState()
  }

  if (error) {
    console.log("🔍 [ProfileBox] Rendering error state:", error)
    return _renderErrorState()
  }

  if (!_hasValidData) {
    console.log("🔍 [ProfileBox] Rendering empty state")
    return _renderEmptyState()
  }

  return _renderContent()
  // #endregion
})

// Set display name for debugging
ProfileBox.displayName = "ProfileBox"
// #endregion

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.background,
  borderRadius: 16,
  marginBottom: 12,
  elevation: 1,
  borderWidth: 1.5,
  borderColor: colors.sectionBorderColor,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  minHeight: 160,
})

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
})

const $avatar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: colors.palette.primary200,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
  borderWidth: 2,
  borderColor: colors.palette.primary400,
})

const $avatarInitial: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.primary600,
  fontFamily: typography.primary.bold,
  fontSize: 28,
})

const $name: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $email: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

const $bio: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.text,
  textAlign: "center",
  fontStyle: "italic",
  paddingHorizontal: spacing.md,
})

const $loadingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $retryButton: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.tint,
  textAlign: "center",
  textDecorationLine: "underline",
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  fontStyle: "italic",
})

const $activityIndicator: ThemedStyle<ViewStyle> = () => ({
  // Color is passed directly to ActivityIndicator component
})

const $activityIndicatorColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $separator: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  width: "100%",
  backgroundColor: colors.sectionBorderColor,
  opacity: 0.3,
  marginVertical: spacing.md,
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: spacing.sm,
  right: spacing.sm,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.xs,
  zIndex: 1,
  opacity: 0.8,
})

const $editButtonIcon: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

// #endregion
