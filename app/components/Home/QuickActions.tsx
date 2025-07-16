import React, { FC } from "react"
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { useSubscription } from "@/hooks/useSubscription"

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

  if (subscription.loading) {
    return (
      <View style={themed($container)}>
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      <Text style={themed($title)}>Quick Actions</Text>
      
      <View style={themed($actionsGrid)}>
        <TouchableOpacity 
          style={[
            themed($actionButton), 
            subscription.groupsUsed >= subscription.groupsLimit && themed($disabledButton)
          ]} 
          onPress={handleCreateGroup}
          disabled={subscription.groupsUsed >= subscription.groupsLimit}
        >
          <Text style={themed($actionIcon)}>📂</Text>
          <Text style={themed($actionText)}>Create Group</Text>
          {subscription.groupsUsed >= subscription.groupsLimit && (
            <Text style={themed($limitText)}>Limit Reached</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            themed($actionButton), 
            subscription.itemsUsed >= subscription.itemsLimit && themed($disabledButton)
          ]} 
          onPress={handleAddItem}
          disabled={subscription.itemsUsed >= subscription.itemsLimit}
        >
          <Text style={themed($actionIcon)}>📄</Text>
          <Text style={themed($actionText)}>Add Item</Text>
          {subscription.itemsUsed >= subscription.itemsLimit && (
            <Text style={themed($limitText)}>Limit Reached</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            themed($actionButton), 
            !subscription.canUseAISearchNow && themed($disabledButton)
          ]} 
          onPress={handleSearch}
          disabled={!subscription.canUseAISearchNow}
        >
          <Text style={themed($actionIcon)}>🔎</Text>
          <Text style={themed($actionText)}>AI Search</Text>
          {!subscription.canUseAISearchNow && (
            <Text style={themed($limitText)}>Pro Only</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={themed($actionButton)} 
          onPress={onViewGroups}
        >
          <Text style={themed($actionIcon)}>👤</Text>
          <Text style={themed($actionText)}>View Groups</Text>
        </TouchableOpacity>
      </View>

      {/* Usage Summary */}
      <View style={themed($usageSummary)}>
        <Text style={themed($usageTitle)}>Your Usage</Text>
        <View style={themed($usageRow)}>
          <Text style={themed($usageLabel)}>Groups:</Text>
          <Text style={themed($usageCount)}>
            {subscription.groupsUsed}/{subscription.groupsLimit}
          </Text>
        </View>
        <View style={themed($usageRow)}>
          <Text style={themed($usageLabel)}>Items:</Text>
          <Text style={themed($usageCount)}>
            {subscription.itemsUsed}/{subscription.itemsLimit}
          </Text>
        </View>
      </View>
    </View>
  )
}

// Styles
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

const $title: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})

const $actionsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  marginBottom: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  width: "48%",
  minHeight: 80,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border + "40",
  borderColor: colors.border,
  opacity: 0.6,
})

const $actionIcon: ThemedStyle<TextStyle> = () => ({
  fontSize: 24,
  marginBottom: spacing.xs,
})

const $actionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.text,
  textAlign: "center",
})

const $limitText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 10,
  color: colors.error,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $usageSummary: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 8,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $usageTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $usageRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $usageLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
})

const $usageCount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.text,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
}) 