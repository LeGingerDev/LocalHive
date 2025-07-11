import React, { ReactNode } from "react"
import { FC, memo, useCallback, useMemo } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
export interface GroupHeaderProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>

  /**
   * The main data for this component
   */
  data?: GroupHeaderData | null

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

interface GroupHeaderData {
  // TODO: Define your data structure here
  id?: string
  title?: string
  description?: string
}
// #endregion

// #region Private Helper Functions
const _isValidData = (data: GroupHeaderData | null | undefined): data is GroupHeaderData => {
  return data != null && typeof data === "object"
}

const _getDisplayTitle = (data: GroupHeaderData | null | undefined): string => {
  if (!_isValidData(data)) return "No Title"
  return data.title ?? "Untitled"
}

const _getDisplayDescription = (data: GroupHeaderData | null | undefined): string => {
  if (!_isValidData(data)) return "No description available"
  return data.description ?? "No description provided"
}
// #endregion

// #region Component
/**
 * GroupHeader - A defensive component with proper error handling and loading states
 *
 * Features:
 * - Loading state support
 * - Error state handling
 * - Null safety checks
 * - Memoized for performance
 * - Follows SOLID principles
 */
export const GroupHeader: FC<GroupHeaderProps> = memo((props) => {
  // #region Props Destructuring with Defaults
  const {
    style,
    data = null,
    isLoading = false,
    error = null,
    onPress,
    onRetry,
    testID = "groupHeaderComponent",
  } = props
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  // #endregion

  // #region Memoized Values
  const _containerStyles = useMemo(() => [themed($container), style], [themed, style])

  const _displayTitle = useMemo(() => _getDisplayTitle(data), [data])
  const _displayDescription = useMemo(() => _getDisplayDescription(data), [data])

  const _hasValidData = useMemo(() => _isValidData(data), [data])
  // #endregion

  // #region Event Handlers
  const _handlePress = useCallback((): void => {
    if (onPress && !isLoading && !error) {
      onPress()
    }
  }, [onPress, isLoading, error])

  const _handleRetry = useCallback((): void => {
    if (onRetry) {
      onRetry()
    }
  }, [onRetry])
  // #endregion

  // #region Render Helpers
  const _renderLoadingState = (): React.ReactNode => (
    <View style={_containerStyles} testID={`${testID}_loading`}>
      <ActivityIndicator
        size="small"
        color={themed($activityIndicatorColor).color}
        style={themed($loadingIndicator)}
      />
      <Text style={themed($loadingText)} text="Loading..." testID={`${testID}_loadingText`} />
    </View>
  )

  const _renderErrorState = (): React.ReactNode => (
    <View style={_containerStyles} testID={`${testID}_error`}>
      <Text
        style={themed($errorText)}
        text={error ?? "Something went wrong"}
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

  const _renderContent = (): React.ReactNode => (
    <View style={_containerStyles} testID={testID} {..._getPressableProps()}>
      <Text style={themed($title)} text={_displayTitle} testID={`${testID}_title`} />
      <Text
        style={themed($description)}
        text={_displayDescription}
        testID={`${testID}_description`}
      />

      {/* Debug info in development */}
      {__DEV__ && data && (
        <Text
          style={themed($debugText)}
          text={`ID: ${data.id ?? "N/A"}`}
          testID={`${testID}_debugInfo`}
        />
      )}
    </View>
  )

  const _renderEmptyState = (): React.ReactNode => (
    <View style={_containerStyles} testID={`${testID}_empty`}>
      <Text style={themed($emptyText)} text="No data available" testID={`${testID}_emptyText`} />
    </View>
  )
  // #endregion

  // #region Main Render Logic
  if (isLoading) {
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
GroupHeader.displayName = "GroupHeader"
// #endregion

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  backgroundColor: colors.background,
  borderRadius: 8,
  marginBottom: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $description: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
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
