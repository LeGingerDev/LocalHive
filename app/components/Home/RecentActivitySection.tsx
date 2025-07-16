import React, { FC, memo, useCallback } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"

import { ItemCard } from "@/components/ItemCard"
import { Text } from "@/components/Text"
import { useRecentItemsFromAllGroups, RecentItemWithGroup } from "@/hooks/useRecentItemsFromAllGroups"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { navigate } from "@/navigators/navigationUtilities"

// #region Types & Interfaces
export interface RecentActivitySectionProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>

  /**
   * Maximum number of items to display
   */
  limit?: number

  /**
   * Optional callback when an item is pressed
   */
  onItemPress?: (item: RecentItemWithGroup) => void

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
// #endregion

// #region Component
/**
 * RecentActivitySection - Displays recent items from all user's groups
 *
 * Features:
 * - Shows top 5 most recent items from all groups
 * - Displays group information for each item
 * - Loading and error states
 * - Empty state handling
 * - Follows theme colors
 * - Memoized for performance
 * - Wrapped in Card component for consistency
 * - Uses ItemCard for visual consistency
 */
export const RecentActivitySection: FC<RecentActivitySectionProps> = memo((props) => {
  // #region Props Destructuring with Defaults
  const {
    style,
    limit = 5,
    onItemPress,
    testID = "recentActivitySectionComponent",
  } = props
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { items, loading, error, refresh } = useRecentItemsFromAllGroups(limit)
  // #endregion

  // #region Event Handlers
  const _handleItemPress = useCallback((item: RecentItemWithGroup) => {
    if (onItemPress) {
      onItemPress(item)
    } else {
      // Default navigation to group detail screen
      navigate("GroupDetail", { groupId: item.group_id })
    }
  }, [onItemPress])

  const _handleRetry = useCallback(() => {
    refresh()
  }, [refresh])
  // #endregion

  // #region Render Helpers
  const _renderLoadingState = () => (
    <View style={themed($loadingContainer)}>
      <ActivityIndicator size="small" color={themed($activityIndicatorColor).color} />
      <Text style={themed($loadingText)} text="Loading recent activity..." />
    </View>
  )

  const _renderErrorState = () => (
    <View style={themed($errorContainer)}>
      <Text style={themed($errorText)} text="Failed to load recent activity" />
      <Text style={themed($retryButton)} text="Retry" onPress={_handleRetry} />
    </View>
  )

  const _renderEmptyState = () => (
    <View style={themed($emptyContainer)}>
      <Text style={themed($emptyText)} text="No recent activity yet" />
      <Text style={themed($emptySubtext)} text="Start by creating your first group!" />
    </View>
  )

  const _renderItems = () => (
    <View style={themed($itemsContainer)} testID={`${testID}_items`}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          groupName={item.group_name}
          onPress={() => _handleItemPress(item)}
        />
      ))}
    </View>
  )
  // #endregion

  return (
    <View style={themed([$container, style])} testID={testID}>
      {/* Section Header */}
      <View style={themed($headerContainer)}>
        <Text style={themed($sectionTitle)} text="Recent Activity" />
        <Text style={themed($sectionSubtitle)} text="Latest items from your groups" />
      </View>

      {/* Content */}
      {loading ? (
        _renderLoadingState()
      ) : error ? (
        _renderErrorState()
      ) : items.length === 0 ? (
        _renderEmptyState()
      ) : (
        _renderItems()
      )}
    </View>
  )
})

// Set display name for debugging
RecentActivitySection.displayName = "RecentActivitySection"
// #endregion

// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  padding: spacing.md,
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $sectionSubtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})

const $itemsContainer: ThemedStyle<ViewStyle> = () => ({
  // No additional styling needed
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginTop: spacing.sm,
})

const $activityIndicatorColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  marginBottom: spacing.sm,
})

const $retryButton: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.tint,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})
// #endregion 