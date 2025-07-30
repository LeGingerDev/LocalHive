import React, { FC, useState, useCallback } from "react"
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle } from "react-native"

import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Icon } from "@/components/Icon"
import VisuProModal from "@/components/Subscription/VisuProModal"
import { useSubscription } from "@/hooks/useSubscription"
import { revenueCatService } from "@/services/revenueCatService"
import { SubscriptionService } from "@/services/subscriptionService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { restartApp } from "@/utils/appRestart"

interface SubscriptionStatusBoxProps {
  userId: string | null
  onManagePress?: () => void
}

export const SubscriptionStatusBox: FC<SubscriptionStatusBoxProps> = ({
  userId,
  onManagePress,
}) => {
  const { themed } = useAppTheme()
  const subscription = useSubscription(userId)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false)

  const handleUpgradePress = () => {
    // Always show the VisuPro modal
    setIsUpgradeModalVisible(true)
  }

  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalVisible(false)
  }

  const handleStartTrial = () => {
    console.log("🔄 [SubscriptionStatusBox] Refreshing subscription data after purchase")
    // Refresh the subscription data to reflect the new purchase
    subscription.refresh()
    setIsUpgradeModalVisible(false)
  }

  // Debug handlers removed

  const handleUpgrade = async () => {
    if (!userId) return

    try {
      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { success, error } = await subscription.upgradeToPro(expiresAt.toISOString())
      if (error) {
        Alert.alert("Error", "Failed to upgrade. Please try again.")
      } else {
        Alert.alert("Success", "Welcome to Pro! You now have unlimited access.")
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.")
    }
  }

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  const getStatusColor = () => {
    if (subscription.isPro) return themed($proColor)
    if (subscription.isTrial) return themed($trialColor)
    return themed($freeColor)
  }

  const getStatusText = () => {
    if (subscription.isPro) return "Pro"
    if (subscription.isTrial) return "Trial"
    return "Free"
  }

  const getStatusIcon = () => {
    if (subscription.isPro) return "lightning"
    if (subscription.isTrial) return "bell"
    return "check"
  }

  const isAtLimit = subscription.groupsPercentage >= 100 || subscription.itemsPercentage >= 100

  if (subscription.loading) {
    return (
      <View style={themed($container)}>
        <Text style={themed($loadingText)}>Loading subscription...</Text>
      </View>
    )
  }

  return (
    <>
      <View style={themed($container)}>
        {/* Header with Gradient Background */}
        <TouchableOpacity
          style={themed($headerGradient)}
          onPress={handleToggleCollapse}
          activeOpacity={0.8}
        >
          <CustomGradient preset="primary" style={themed($gradientContainer)}>
            <View style={themed($headerContent)}>
              <View style={themed($statusBadge)}>
                <Text style={themed($statusText)}>{getStatusText()}</Text>
                <Text style={themed($statusSubtext)}>
                  {subscription.isPro
                    ? " - Unlimited Access"
                    : subscription.isTrial
                      ? " - Trial Active"
                      : " - Basic Plan"}
                </Text>
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
            <Text style={themed($collapsedText)}>Subscription details hidden</Text>
          </View>
        ) : (
          <>
            {/* Usage Progress */}
            <View style={themed($usageSection)}>
              <Text style={themed($usageTitle)}>Your Usage</Text>

              <View style={themed($usageGrid)}>
                <View style={themed($usageCard)}>
                  <View style={themed($usageCardHeader)}>
                    <Icon icon="view" size={20} color={themed($usageIconColor).color} />
                    <Text style={themed($usageCardLabel)}>Groups</Text>
                  </View>
                  <Text style={themed($usageCardCount)}>
                    {subscription.isPro || subscription.isTrial
                      ? subscription.groupsUsed.toString()
                      : `${subscription.groupsUsed}/${subscription.groupsLimit}`}
                  </Text>
                  {subscription.groupsUsed >= subscription.groupsLimit && (
                    <View style={themed($limitBadge)}>
                      <Text style={themed($limitBadgeText)}>Limit Reached</Text>
                    </View>
                  )}
                </View>

                <View style={themed($usageCard)}>
                  <View style={themed($usageCardHeader)}>
                    <Icon icon="check" size={20} color={themed($usageIconColor).color} />
                    <Text style={themed($usageCardLabel)}>Items</Text>
                  </View>
                  <Text style={themed($usageCardCount)}>
                    {subscription.isPro || subscription.isTrial
                      ? subscription.itemsUsed.toString()
                      : `${subscription.itemsUsed}/${subscription.itemsLimit}`}
                  </Text>
                  {subscription.itemsUsed >= subscription.itemsLimit && (
                    <View style={themed($limitBadge)}>
                      <Text style={themed($limitBadgeText)}>Limit Reached</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={themed($aiSection)}>
                <View style={themed($aiHeader)}>
                  <Icon icon="lightning" size={20} color={themed($aiIconColor).color} />
                  <Text style={themed($aiLabel)}>AI Search</Text>
                </View>
                <View
                  style={[
                    themed($aiStatusContainer),
                    subscription.canUseAISearchNow
                      ? themed($aiStatusAvailable)
                      : themed($aiStatusUnavailable),
                  ]}
                >
                  <Text style={themed($aiStatus)}>
                    {subscription.canUseAISearchNow ? "Available" : "Pro Members Only"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={themed($actionsSection)}>
              {(subscription.isFree || subscription.isTrial || subscription.isExpired) && (
                <TouchableOpacity
                  style={themed($upgradeButton)}
                  onPress={handleUpgradePress}
                  activeOpacity={0.8}
                >
                  <Icon icon="lightning" size={18} color={themed($upgradeButtonIconColor).color} />
                  <Text style={themed($upgradeButtonText)}>
                    {subscription.isExpired ? "Renew Pro" : "Upgrade to Pro"}
                  </Text>
                </TouchableOpacity>
              )}

              {subscription.isPro && (
                <TouchableOpacity
                  style={themed($manageButton)}
                  onPress={onManagePress}
                  activeOpacity={0.8}
                >
                  <Icon icon="settings" size={18} color={themed($manageButtonIconColor).color} />
                  <Text style={themed($manageButtonText)}>Manage Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {/* VisuPro Modal */}
      <VisuProModal
        visible={isUpgradeModalVisible}
        onClose={handleCloseUpgradeModal}
        onStartTrial={handleStartTrial}
      />
    </>
  )
}

const formatTimeRemaining = (endDate: string) => {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) {
    return "Expired"
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// Styles
const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 16,
  padding: 0, // Remove padding to allow gradient header
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6,
  overflow: "hidden", // For rounded corners
})

const $headerGradient: ThemedStyle<ViewStyle> = () => ({
  // TouchableOpacity wrapper for the gradient
})

const $gradientContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $statusBadge: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: colors.background + "20",
  alignItems: "center",
  justifyContent: "center",
})

const $iconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.background,
})

const $statusTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statusText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: "#FFFFFF", // Always white regardless of theme
  textTransform: "uppercase",
  letterSpacing: 1,
})

const $statusSubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: "#FFFFFF", // Always white regardless of theme
})

const $arrowIcon: ThemedStyle<{ transform: [{ rotate: string }] }> = () => ({
  transform: [{ rotate: "90deg" }], // Rotate caretLeft to point down
})

const $trialCountdownContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  backgroundColor: colors.background + "20",
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 8,
})

const $trialCountdownColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: "#FFFFFF", // Always white regardless of theme
})

const $trialCountdown: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: "#FFFFFF", // Always white regardless of theme
})

const $proColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.success,
})

const $trialColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.cta,
})

const $freeColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $usageSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.lg,
  backgroundColor: colors.background,
  paddingBottom: spacing.sm, // Further reduce bottom padding
})

const $usageTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.md,
})

const $usageGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginBottom: spacing.lg,
})

const $usageCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
})

const $usageCardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $usageIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $usageCardLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.textDim,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $usageCardCount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: colors.text,
})

const $limitBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error + "20",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 4,
  marginTop: spacing.xs,
  alignSelf: "flex-start",
})

const $limitBadgeText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 10,
  color: colors.error,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $aiSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.border,
})

const $aiHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $aiIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $aiLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
})

const $aiStatusContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.success + "20",
})

const $aiStatus: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.success,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $aiStatusAvailable: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.success + "20",
})

const $aiStatusUnavailable: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.error + "20",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.sm,
  padding: spacing.lg,
  paddingTop: spacing.sm, // Further reduce top padding
  backgroundColor: colors.background,
})

const $upgradeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.gradientOrange[0],
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 12,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  gap: spacing.xs,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})

const $upgradeButtonIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.palette.neutral100, // Always white regardless of theme
})

const $upgradeButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: colors.palette.neutral100, // Always white regardless of theme
})

const $manageButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 12,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  gap: spacing.xs,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})

const $manageButtonIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.text,
})

const $manageButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: colors.text,
})

const $limitWarning: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error + "20",
  borderWidth: 1,
  borderColor: colors.error,
  padding: spacing.sm,
  borderRadius: 12,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  gap: spacing.xs,
})

const $limitWarningIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.error,
})

const $limitWarningText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.error,
  textAlign: "center",
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

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

// Debug button styles removed
