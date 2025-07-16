import React, { FC, useState, useCallback } from "react"
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { useSubscription } from "@/hooks/useSubscription"
import { Icon } from "@/components/Icon"
import { CustomGradient } from "@/components/Gradient/CustomGradient"

interface QuickActionsProps {
  userId: string | null
  onCreateGroup?: () => void
  onAddItem?: () => void
  onSearch?: () => void
  onViewGroups?: () => void
}

export const QuickActions: FC<QuickActionsProps> = ({
  userId,
  onCreateGroup,
  onAddItem,
  onSearch,
  onViewGroups,
}) => {
  const { themed } = useAppTheme()
  const subscription = useSubscription(userId)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleCreateGroup = () => {
    // Only show alert if actually at the limit (groupsUsed >= groupsLimit)
    if (subscription.groupsUsed >= subscription.groupsLimit) {
      Alert.alert(
        "Group Limit Reached",
        "You've reached your group limit. Upgrade to Pro for unlimited groups!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleUpgrade() },
        ]
      )
      return
    }
    
    if (onCreateGroup) {
      onCreateGroup()
    }
  }

  const handleAddItem = () => {
    // Only show alert if actually at the limit (itemsUsed >= itemsLimit)
    if (subscription.itemsUsed >= subscription.itemsLimit) {
      Alert.alert(
        "Item Limit Reached",
        "You've reached your item limit. Upgrade to Pro for unlimited items!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleUpgrade() },
        ]
      )
      return
    }
    
    if (onAddItem) {
      onAddItem()
    }
  }

  const handleSearch = () => {
    if (!subscription.canUseAISearchNow) {
      Alert.alert(
        "AI Search Not Available",
        "AI search is only available for Pro users. Upgrade to unlock this feature!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleUpgrade() },
        ]
      )
      return
    }
    
    if (onSearch) {
      onSearch()
    }
  }

  const handleUpgrade = () => {
    // This will be handled by the subscription status box
    // For now, just show an alert
    Alert.alert(
      "Upgrade to Pro",
      "Get unlimited groups, items, and AI search for $5.99/month!",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Learn More", onPress: () => {
          // Navigate to subscription management or show upgrade modal
        }},
      ]
    )
  }

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  if (subscription.loading) {
    return (
      <View style={themed($container)}>
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      {/* Header with Gradient Background */}
      <TouchableOpacity 
        style={themed($headerGradient)} 
        onPress={handleToggleCollapse}
        activeOpacity={0.8}
      >
        <CustomGradient preset="primary" style={themed($gradientContainer)}>
          <View style={themed($headerContent)}>
            <View style={themed($headerTextContainer)}>
              <Icon icon="lightning" size={20} color="#FFFFFF" />
              <Text style={themed($headerTitle)}>Quick Actions</Text>
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
          <Text style={themed($collapsedText)}>Actions hidden</Text>
        </View>
      ) : (
        <View style={themed($actionsSection)}>
          <View style={themed($actionsGrid)}>
            <TouchableOpacity 
              style={[
                themed($actionButton), 
                subscription.groupsUsed >= subscription.groupsLimit && themed($disabledButton)
              ]} 
              onPress={handleCreateGroup}
              disabled={subscription.groupsUsed >= subscription.groupsLimit}
              activeOpacity={0.8}
            >
              <View style={themed($actionIconContainer)}>
                <Icon 
                  icon="check" 
                  size={24} 
                  color={subscription.groupsUsed >= subscription.groupsLimit ? themed($disabledIconColor).color : themed($actionIconColor).color} 
                />
              </View>
              <Text style={[
                themed($actionText),
                subscription.groupsUsed >= subscription.groupsLimit && themed($disabledText)
              ]}>
                Create Group
              </Text>
              {subscription.groupsUsed >= subscription.groupsLimit && (
                <View style={themed($limitBadge)}>
                  <Text style={themed($limitBadgeText)}>Limit Reached</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                themed($actionButton), 
                subscription.itemsUsed >= subscription.itemsLimit && themed($disabledButton)
              ]} 
              onPress={handleAddItem}
              disabled={subscription.itemsUsed >= subscription.itemsLimit}
              activeOpacity={0.8}
            >
              <View style={themed($actionIconContainer)}>
                <Icon 
                  icon="check" 
                  size={24} 
                  color={subscription.itemsUsed >= subscription.itemsLimit ? themed($disabledIconColor).color : themed($actionIconColor).color} 
                />
              </View>
              <Text style={[
                themed($actionText),
                subscription.itemsUsed >= subscription.itemsLimit && themed($disabledText)
              ]}>
                Add Item
              </Text>
              {subscription.itemsUsed >= subscription.itemsLimit && (
                <View style={themed($limitBadge)}>
                  <Text style={themed($limitBadgeText)}>Limit Reached</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                themed($actionButton), 
                !subscription.canUseAISearchNow && themed($disabledButton)
              ]} 
              onPress={handleSearch}
              disabled={!subscription.canUseAISearchNow}
              activeOpacity={0.8}
            >
              <View style={themed($actionIconContainer)}>
                <Icon 
                  icon="lightning" 
                  size={24} 
                  color={!subscription.canUseAISearchNow ? themed($disabledIconColor).color : themed($actionIconColor).color} 
                />
              </View>
              <Text style={[
                themed($actionText),
                !subscription.canUseAISearchNow && themed($disabledText)
              ]}>
                AI Search
              </Text>
              {!subscription.canUseAISearchNow && (
                <View style={themed($limitBadge)}>
                  <Text style={themed($limitBadgeText)}>Pro Only</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={themed($actionButton)} 
              onPress={onViewGroups}
              activeOpacity={0.8}
            >
              <View style={themed($actionIconContainer)}>
                <Icon icon="view" size={24} color={themed($actionIconColor).color} />
              </View>
              <Text style={themed($actionText)}>View Groups</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

// Styles
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

const $headerTitle: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: "#FFFFFF",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
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

const $actionsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  padding: spacing.sm,
  alignItems: "center",
  justifyContent: "center",
  width: "47%",
  minHeight: 70,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border + "20",
  borderColor: colors.border,
  opacity: 0.7,
})

const $actionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $actionIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $disabledIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $actionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.text,
  textAlign: "center",
})

const $disabledText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $limitBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error + "20",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 4,
  marginTop: spacing.xs,
})

const $limitBadgeText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 10,
  color: colors.error,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  padding: spacing.lg,
}) 