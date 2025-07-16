import React, { ReactNode } from "react"
import { FC, memo, useCallback, useMemo } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"

import { ItemCard } from "@/components/ItemCard"
import { Text } from "@/components/Text"
import { useItems } from "@/hooks/useItems"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
export interface RecentActivitySectionProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>

  /**
   * The group ID to fetch recent items for
   */
  groupId?: string

  /**
   * The main data for this component
   */
  data?: RecentActivitySectionData | null

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
   * Optional callback when an item is pressed
   */
  onItemPress?: (item: any) => void

  /**
   * Optional callback when an item is deleted
   */
  onItemDeleted?: (itemId: string) => void

  /**
   * Items to display in the recent activity section (overrides hook)
   */
  items?: any[]

  /**
   * Whether items are deletable (default false)
   */
  deletable?: boolean

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

interface RecentActivitySectionData {
  // TODO: Define your data structure here
  id?: string
  title?: string
  description?: string
}
// #endregion

// #region Private Helper Functions
const _isValidData = (
  data: RecentActivitySectionData | null | undefined,
): data is RecentActivitySectionData => {
  return data != null && typeof data === "object"
}

const _getDisplayTitle = (data: RecentActivitySectionData | null | undefined): string => {
  if (!_isValidData(data)) return "No Title"
  return data.title ?? "Untitled"
}

const _getDisplayDescription = (data: RecentActivitySectionData | null | undefined): string => {
  if (!_isValidData(data)) return "No description available"
  return data.description ?? "No description provided"
}
// #endregion

// #region Component
/**
 * RecentActivitySection - A defensive component with proper error handling and loading states
 *
 * Features:
 * - Loading state support
 * - Error state handling
 * - Null safety checks
 * - Memoized for performance
 * - Follows SOLID principles
 */
export const RecentActivitySection: FC<RecentActivitySectionProps> = memo((props) => {
  // #region Props Destructuring with Defaults
  const {
    style,
    groupId,
    data = null,
    isLoading = false,
    error = null,
    onPress,
    onRetry,
    onItemPress,
    onItemDeleted,
    items: itemsProp,
    deletable = false,
    testID = "recentActivitySectionComponent",
  } = props
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { items: hookItems, loading: itemsLoading, error: itemsError, getRecentItems } = useItems(groupId)
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

  // Use items from props if provided, otherwise from hook
  const itemsToShow = itemsProp ?? getRecentItems(3)

  const _renderContent = (): React.ReactNode => (
    <View style={_containerStyles} testID={testID} {..._getPressableProps()}>
      {/* Recent Items Section */}
      {groupId && (
        <View style={themed($itemsSection)}>
          {itemsLoading ? (
            <View style={themed($loadingContainer)}>
              <ActivityIndicator size="small" color={themed($activityIndicatorColor).color} />
              <Text style={themed($itemsLoadingText)} text="Loading items..." />
            </View>
          ) : itemsError ? (
            <Text style={themed($errorText)} text={itemsError} />
          ) : (
            <>
              {itemsToShow.map((item, index) => (
                <ItemCard key={item.id} item={item} onPress={onItemPress} onItemDeleted={onItemDeleted} deletable={deletable} />
              ))}
              {itemsToShow.length === 0 && (
                <Text style={themed($emptyText)} text="No recent items" />
              )}
            </>
          )}
        </View>
      )}

      {/* Original content for backward compatibility */}
      {data && (
        <>
          <Text
            style={themed($description)}
            text={_displayDescription}
            testID={`${testID}_description`}
          />

          {/* Debug info in development */}
          {__DEV__ && (
            <Text
              style={themed($debugText)}
              text={`ID: ${data.id ?? "N/A"}`}
              testID={`${testID}_debugInfo`}
            />
          )}
        </>
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
  console.log("RecentActivitySection render check:", {
    groupId,
    isLoading,
    error,
    hasValidData: _hasValidData,
  })

  if (isLoading) {
    return _renderLoadingState()
  }

  if (error) {
    return _renderErrorState()
  }

  // If we have a groupId, always render content (items will be fetched by the hook)
  if (groupId) {
    return _renderContent()
  }

  // Otherwise, check for the old data prop
  if (!_hasValidData) {
    return _renderEmptyState()
  }

  return _renderContent()
  // #endregion
})

// Set display name for debugging
RecentActivitySection.displayName = "RecentActivitySection"
// #endregion

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 8,
  marginBottom: spacing.sm,
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

const $itemsLoadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginLeft: spacing.sm,
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

const $itemsSection: ThemedStyle<ViewStyle> = () => ({
  // No padding to avoid indentation
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
})

// #endregion
