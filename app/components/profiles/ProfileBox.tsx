import React, { FC, memo, useCallback, useMemo } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"

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
}
// #endregion

// #region Private Helper Functions
const _isValidData = (data: ProfileBoxData | null | undefined): data is ProfileBoxData => {
  return data != null && typeof data === 'object'
}

const _getDisplayName = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data)) return "Guest User"
  return data.displayName ?? data.name ?? "Unknown User"
}

const _getDisplayEmail = (data: ProfileBoxData | null | undefined): string => {
  if (!_isValidData(data)) return "No email available"
  return data.email ?? "No email provided"
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
    testID = "profileBoxComponent"
  } = props
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { user, googleUser, isLoading: authLoading } = useAuth()
  // #endregion

  // #region Memoized Values
  const _containerStyles = useMemo(() => [
    themed($container),
    style
  ], [themed, style])

  // Use provided data or fall back to auth context data
  const _userData = useMemo((): ProfileBoxData | null => {
    if (data) return data
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url
      }
    }
    
    if (googleUser) {
      return {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        displayName: googleUser.name || googleUser.email?.split('@')[0],
        avatarUrl: googleUser.picture
      }
    }
    
    return null
  }, [data, user, googleUser])

  const _displayName = useMemo(() => _getDisplayName(_userData), [_userData])
  const _displayEmail = useMemo(() => _getDisplayEmail(_userData), [_userData])
  const _avatarInitial = useMemo(() => _getAvatarInitial(_userData), [_userData])
  
  const _hasValidData = useMemo(() => _isValidData(_userData), [_userData])
  const _isLoading = useMemo(() => isLoading || authLoading, [isLoading, authLoading])
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
      onPress: _handlePress
    }
  }, [onPress, _handlePress])
  // #endregion

  const _renderContent = (): React.ReactElement => (
    <View 
      style={_containerStyles} 
      testID={testID}
      {..._getPressableProps()}
    >
      {/* Avatar */}
      <View style={themed($avatar)}>
        <Text style={themed($avatarInitial)}>{_avatarInitial}</Text>
      </View>
      
      {/* User Name */}
      <Text 
        style={themed($name)} 
        text={_displayName}
        testID={`${testID}_name`}
      />
      
      {/* User Email */}
      <Text 
        style={themed($email)} 
        text={_displayEmail}
        testID={`${testID}_email`}
      />
      
      {/* Debug info in development */}
      {__DEV__ && _userData && (
        <Text 
          style={themed($debugText)} 
          text={`ID: ${_userData.id ?? 'N/A'}`}
          testID={`${testID}_debugInfo`}
        />
      )}
    </View>
  )

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
    return _renderLoadingState()
  }

  if (error) {
    return _renderErrorState()
  }

  if (!_hasValidData) {
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
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
  borderRadius: 12,
  marginBottom: spacing.md,
})

const $avatar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.primary200,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
})

const $avatarInitial: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.primary600,
  fontFamily: typography.primary.bold,
  fontSize: 32,
})

const $name: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $email: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: colors.textDim,
  textAlign: "center",
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

const $debugText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: spacing.xs,
  opacity: 0.7,
})

const $activityIndicator: ThemedStyle<ViewStyle> = () => ({
  // Color is passed directly to ActivityIndicator component
})

const $activityIndicatorColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})
// #endregion