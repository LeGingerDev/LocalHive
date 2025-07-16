import React, { FC, memo, useCallback, useState } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator, TouchableOpacity } from "react-native"

import { ItemCard } from "@/components/ItemCard"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { useRecentItemsFromAllGroups, RecentItemWithGroup } from "@/hooks/useRecentItemsFromAllGroups"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { navigate } from "@/navigators/navigationUtilities"
import { CustomGradient } from "@/components/Gradient/CustomGradient"

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
  const [isCollapsed, setIsCollapsed] = useState(false)
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

  const _handleToggleCollapse = useCallback(() => {
    console.log("[RecentActivitySection] Toggle collapse, current state:", isCollapsed)
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])
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
      {/* Header with Gradient Background */}
      <TouchableOpacity 
        style={themed($headerGradient)} 
        onPress={_handleToggleCollapse}
        activeOpacity={0.8}
      >
        <CustomGradient preset="primary" style={themed($gradientContainer)}>
          <View style={themed($headerContent)}>
            <View style={themed($headerTextContainer)}>
              <Icon icon="view" size={20} color="#FFFFFF" />
              <Text style={themed($sectionTitle)} text="Recent Activity" />
            </View>
            <Icon 
              icon={isCollapsed ? "caretRight" : "caretLeft"} 
              size={20} 
              color="#FFFFFF"
              style={themed($arrowIcon)}
            />
          </View>
        </CustomGradient>
      </TouchableOpacity>

      {/* Content */}
      {isCollapsed ? (
        <View style={themed($collapsedContainer)}>
          <Text style={themed($collapsedText)} text="Items hidden" />
        </View>
      ) : loading ? (
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
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  overflow: "hidden",
})

const $headerGradient: ThemedStyle<ViewStyle> = () => ({
  // TouchableOpacity wrapper for the gradient
})

const $gradientContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $headerTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $arrowIcon: ThemedStyle<{ transform: [{ rotate: string }] }> = () => ({
  transform: [{ rotate: "90deg" }], // Rotate caretLeft to point down
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: "#FFFFFF",
})

const $itemsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.lg,
  backgroundColor: colors.background,
})

const $collapsedContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
})

const $collapsedText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
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

const $errorContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
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

const $emptyContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
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