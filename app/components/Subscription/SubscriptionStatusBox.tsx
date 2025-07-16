import React, { FC } from "react"
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { useSubscription } from "@/hooks/useSubscription"
import { SubscriptionService } from "@/services/subscriptionService"

interface SubscriptionStatusBoxProps {
  userId: string | null
  onUpgradePress?: () => void
  onManagePress?: () => void
}

export const SubscriptionStatusBox: FC<SubscriptionStatusBoxProps> = ({
  userId,
  onUpgradePress,
  onManagePress,
}) => {
  const { themed } = useAppTheme()
  const subscription = useSubscription(userId)

  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress()
    } else {
      Alert.alert(
        "Upgrade to Pro",
        "Get unlimited groups, items, and AI search for $5.99/month!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleUpgrade() },
        ]
      )
    }
  }

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

  const handleActivateTrial = async () => {
    if (!userId) return

    try {
      const { success, error } = await subscription.activateTrial()
      if (error) {
        Alert.alert("Error", "Failed to activate trial. Please try again.")
      } else {
        Alert.alert("Trial Activated", "Enjoy 3 days of unlimited access!")
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.")
    }
  }

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
    if (subscription.isPro) return "⭐"
    if (subscription.isTrial) return "⏰"
    return "📋"
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
    <View style={themed($container)}>
      {/* Header */}
      <View style={themed($header)}>
        <View style={themed($statusBadge)}>
          <Text style={themed($statusIcon)}>{getStatusIcon()}</Text>
          <Text style={[themed($statusText), getStatusColor()]}>{getStatusText()}</Text>
        </View>
        
        {subscription.isTrial && subscription.subscriptionInfo?.trial_ends_at && (
          <Text style={themed($trialCountdown)}>
            ⏰ {formatTimeRemaining(subscription.subscriptionInfo.trial_ends_at)} left
          </Text>
        )}
      </View>

      {/* Usage Progress */}
      <View style={themed($usageSection)}>
        <View style={themed($usageRow)}>
          <Text style={themed($usageLabel)}>Groups</Text>
          <Text style={themed($usageCount)}>
            {subscription.isPro || subscription.isTrial 
              ? subscription.groupsUsed.toString()
              : `${subscription.groupsUsed}/${subscription.groupsLimit}`
            }
          </Text>
          {subscription.groupsUsed >= subscription.groupsLimit && (
            <Text style={themed($maxCapacityText)}>Max capacity</Text>
          )}
        </View>

        <View style={themed($usageRow)}>
          <Text style={themed($usageLabel)}>Items</Text>
          <Text style={themed($usageCount)}>
            {subscription.isPro || subscription.isTrial 
              ? subscription.itemsUsed.toString()
              : `${subscription.itemsUsed}/${subscription.itemsLimit}`
            }
          </Text>
          {subscription.itemsUsed >= subscription.itemsLimit && (
            <Text style={themed($maxCapacityText)}>Max capacity</Text>
          )}
        </View>

        <View style={themed($aiSection)}>
          <Text style={themed($aiLabel)}>AI Search</Text>
          <Text style={[
            themed($aiStatus),
            subscription.canUseAISearchNow ? themed($aiStatusAvailable) : themed($aiStatusUnavailable)
          ]}>
            {subscription.canUseAISearchNow ? "Available" : "Pro Members Only"}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={themed($actionsSection)}>
        {subscription.isFree && !isAtLimit && (
          <TouchableOpacity style={themed($trialButton)} onPress={handleActivateTrial}>
            <Text style={themed($trialButtonText)}>🎯 Start Free Trial</Text>
          </TouchableOpacity>
        )}

        {(subscription.isFree || subscription.isTrial) && (
          <TouchableOpacity style={themed($upgradeButton)} onPress={handleUpgradePress}>
            <Text style={themed($upgradeButtonText)}>⭐ Upgrade to Pro</Text>
          </TouchableOpacity>
        )}

        {subscription.isPro && (
          <TouchableOpacity style={themed($manageButton)} onPress={onManagePress}>
            <Text style={themed($manageButtonText)}>⚙️ Manage Subscription</Text>
          </TouchableOpacity>
        )}

        {subscription.groupsUsed >= subscription.groupsLimit && subscription.itemsUsed >= subscription.itemsLimit && (
          <View style={themed($limitWarning)}>
            <Text style={themed($limitWarningText)}>
              ⚠️ You've reached your limit. Upgrade to Pro for unlimited access!
            </Text>
          </View>
        )}
      </View>
    </View>
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

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $statusBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $statusIcon: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
})

const $statusText: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $proColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.success,
})

const $trialColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.palette.accent500,
})

const $freeColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $trialCountdown: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.palette.accent500,
})

const $usageSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $usageRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $usageLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
  width: 60,
})

const $usageCount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  width: 50,
  textAlign: "right",
  marginRight: spacing.sm,
})

const $maxCapacityContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  alignItems: "center",
})

const $maxCapacityText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.error,
  fontStyle: "italic",
})

const $aiSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.md,
})

const $aiLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
  width: 60,
})

const $aiStatus: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  width: 120,
  textAlign: "right",
  marginRight: spacing.sm,
})

const $aiStatusAvailable: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.success,
})

const $aiStatusUnavailable: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $trialButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cta,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  alignItems: "center",
})

const $trialButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.background,
})

const $upgradeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.gradientOrange[0],
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  alignItems: "center",
})

const $upgradeButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.background,
})

const $manageButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  alignItems: "center",
})

const $manageButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
})

const $limitWarning: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error + "20",
  borderWidth: 1,
  borderColor: colors.error,
  padding: spacing.sm,
  borderRadius: 8,
})

const $limitWarningText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.error,
  textAlign: "center",
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
}) 