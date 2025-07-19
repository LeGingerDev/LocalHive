import React, { FC, useState, useCallback, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle, Animated } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { useSubscription } from "@/hooks/useSubscription"
import { useGroups } from "@/hooks/useGroups"
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
  const { groups, loading: groupsLoading } = useGroups()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Animation refs for pulsating effect
  const pulseAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  // Pulsating animation effect
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    // Start the pulsating animation
    startPulseAnimation()

    return () => {
      pulseAnim.stopAnimation()
    }
  }, [pulseAnim])

  // Scale animation for button press
  const handleButtonPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const handleButtonPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const handleCreateGroup = () => {
    console.log(`🔍 [QuickActions] handleCreateGroup called`)
    console.log(`📊 [QuickActions] Subscription info:`, {
      groupsUsed: subscription.groupsUsed,
      groupsLimit: subscription.groupsLimit,
      canCreateGroupNow: subscription.canCreateGroupNow,
      subscriptionStatus: subscription.subscriptionStatus,
      loading: subscription.loading
    })

    // Only show alert if actually at the limit (groupsUsed >= groupsLimit)
    if (subscription.groupsUsed >= subscription.groupsLimit) {
      console.log(`❌ [QuickActions] Group limit reached - showing alert`)
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
    
    console.log(`✅ [QuickActions] Can create group - calling onCreateGroup`)
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

  if (subscription.loading || groupsLoading) {
    return (
      <View style={themed($container)}>
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    )
  }

  // Check if user has no groups
  const hasNoGroups = groups.length === 0

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
          {hasNoGroups ? (
            // Show "Create your first group!" when user has no groups
            <View style={themed($firstGroupContainer)}>
              <Text style={themed($firstGroupText)}>Create your first group!</Text>
              <Animated.View
                style={[
                  themed($firstGroupButton),
                  {
                    transform: [
                      { scale: Animated.multiply(pulseAnim, scaleAnim) }
                    ]
                  }
                ]}
              >
                <TouchableOpacity 
                  onPress={handleCreateGroup}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={1}
                  testID="create-first-group-button"
                >
                  <View style={themed($firstGroupButtonContent)}>
                    <Icon icon="check" size={32} color="#FFFFFF" />
                    <Text style={themed($firstGroupButtonText)}>Create Group</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            // Show regular action grid when user has groups
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
                  <Icon 
                    icon="view" 
                    size={24} 
                    color={themed($actionIconColor).color} 
                  />
                </View>
                <Text style={themed($actionText)}>View Groups</Text>
              </TouchableOpacity>
            </View>
          )}
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
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  overflow: "hidden",
})

const $headerGradient: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $gradientContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $headerTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $arrowIcon: ThemedStyle<{ transform: [{ rotate: string }] }> = () => ({
  transform: [{ rotate: "90deg" }],
})

const $headerTitle: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
})

const $collapsedContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
  alignItems: "center",
})

const $collapsedText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})

const $actionsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  justifyContent: "space-between",
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 8,
  padding: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  width: "48%",
  minHeight: 80,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.palette.neutral300,
  opacity: 0.6,
})

const $actionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $actionIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $disabledIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.palette.neutral500,
})

const $actionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.text,
  textAlign: "center",
})

const $disabledText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral500,
})

const $limitBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.errorBackground,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 4,
  marginTop: spacing.xs,
})

const $limitBadgeText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 10,
  color: colors.error,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  padding: spacing.lg,
})

const $firstGroupContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  padding: spacing.lg,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
})

const $firstGroupText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.md,
  textAlign: "center",
})

const $firstGroupButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: colors.tint,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
})

const $firstGroupButtonContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $firstGroupButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
}) 