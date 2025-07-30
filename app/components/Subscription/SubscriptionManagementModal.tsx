import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
  TextStyle,
  Alert,
  Linking,
} from "react-native"

import { Icon } from "@/components/Icon"
import { useRevenueCat } from "@/hooks/useRevenueCat"
import { useSubscription } from "@/hooks/useSubscription"
import { revenueCatService } from "@/services/revenueCatService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface SubscriptionManagementModalProps {
  visible: boolean
  onClose: () => void
  userId: string | null
  style?: StyleProp<ViewStyle>
}

export const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  visible,
  onClose,
  userId,
  style,
}) => {
  const { themed, theme } = useAppTheme()
  const subscription = useSubscription(userId)
  const {
    subscriptionTiers,
    canManageSubscription,
    openSubscriptionManagement,
    getSubscriptionManagementURL,
  } = useRevenueCat()

  // ADDED: Refresh subscription status
  const handleRefreshSubscription = async () => {
    try {
      console.log("🔄 [SubscriptionManagementModal] Manually refreshing subscription status...")
      await revenueCatService.refreshSubscriptionStatus()
      Alert.alert(
        "Subscription Refreshed",
        "Your subscription status has been updated. The app will restart to reflect any changes.",
        [{ text: "OK" }],
      )
    } catch (error) {
      console.error("Failed to refresh subscription:", error)
      Alert.alert("Error", "Failed to refresh subscription status. Please try again.", [
        { text: "OK" },
      ])
    }
  }

  // Get the monthly subscription package for pricing
  const monthlyPackage = subscriptionTiers.find(
    (tier) => tier.id.includes("monthly") || tier.id.includes("$rc_monthly"),
  )

  const handleManageSubscription = async () => {
    try {
      // Check if user has an active subscription to manage
      if (!canManageSubscription) {
        Alert.alert(
          "No Active Subscription",
          "You don't have an active subscription to manage. If you recently cancelled, changes may take a few minutes to reflect.",
          [{ text: "OK" }],
        )
        return
      }

      // Open platform subscription management
      await openSubscriptionManagement()
    } catch (error) {
      console.error("Failed to open subscription management:", error)
      Alert.alert(
        "Error",
        "Unable to open subscription management. Please visit your device's subscription settings manually.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              const url = getSubscriptionManagementURL()
              if (url) {
                Linking.openURL(url)
              }
            },
          },
        ],
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
      return "Expired"
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days} days, ${hours} hours`
    } else {
      return `${hours} hours`
    }
  }

  const getSubscriptionStatusText = () => {
    if (!subscription.subscriptionInfo) return "Loading..."

    switch (subscription.subscriptionInfo.subscription_status) {
      case "pro":
        return "Pro Subscription"
      case "trial":
        return "Trial Period"
      case "expired":
        return "Subscription Expired"
      case "free":
      default:
        return "Free Plan"
    }
  }

  const getSubscriptionStatusColor = () => {
    if (!subscription.subscriptionInfo) return theme.colors.textDim

    switch (subscription.subscriptionInfo.subscription_status) {
      case "pro":
        return theme.colors.success
      case "trial":
        return theme.colors.cta
      case "expired":
        return theme.colors.error
      case "free":
      default:
        return theme.colors.textDim
    }
  }

  if (subscription.loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={themed($overlay)}>
          <View style={[themed($modalContainer), style]}>
            <Text style={themed($loadingText)}>Loading subscription details...</Text>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={themed($overlay)}>
        <View style={[themed($modalContainer), style]}>
          {/* Close button */}
          <TouchableOpacity style={themed($closeButton)} onPress={onClose}>
            <Icon icon="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={themed($contentContainer)}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={themed($headerContainer)}>
              <View style={themed($statusBadge)}>
                <Icon icon="lightning" size={24} color={getSubscriptionStatusColor()} />
                <Text style={[themed($statusText), { color: getSubscriptionStatusColor() }]}>
                  {getSubscriptionStatusText()}
                </Text>
              </View>
              <Text style={themed($subtitle)}>Manage your subscription and billing</Text>
            </View>

            {/* Current Plan Details */}
            <View style={themed($sectionContainer)}>
              <Text style={themed($sectionTitle)}>Current Plan</Text>
              <View style={themed($planDetails)}>
                <View style={themed($planRow)}>
                  <Text style={themed($planLabel)}>Plan:</Text>
                  <Text style={themed($planValue)}>
                    {subscription.subscriptionInfo?.subscription_status === "pro"
                      ? "Visu Pro"
                      : "Free Plan"}
                  </Text>
                </View>
                {subscription.subscriptionInfo?.subscription_status === "pro" && (
                  <View style={themed($planRow)}>
                    <Text style={themed($planLabel)}>Price:</Text>
                    <Text style={themed($planValue)}>
                      {monthlyPackage ? monthlyPackage.price : "$5.99"}/month
                    </Text>
                  </View>
                )}
                {subscription.subscriptionInfo?.subscription_expires_at && (
                  <View style={themed($planRow)}>
                    <Text style={themed($planLabel)}>Next Billing:</Text>
                    <Text style={themed($planValue)}>
                      {formatDate(subscription.subscriptionInfo.subscription_expires_at)}
                    </Text>
                  </View>
                )}
                {subscription.subscriptionInfo?.subscription_expires_at && (
                  <View style={themed($planRow)}>
                    <Text style={themed($planLabel)}>Time Remaining:</Text>
                    <Text style={themed($planValue)}>
                      {getTimeRemaining(subscription.subscriptionInfo.subscription_expires_at)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Usage Summary */}
            <View style={themed($sectionContainer)}>
              <Text style={themed($sectionTitle)}>Usage Summary</Text>
              <View style={themed($usageContainer)}>
                <View style={themed($usageRow)}>
                  <Text style={themed($usageLabel)}>Groups Created:</Text>
                  <Text style={themed($usageValue)}>{subscription.groupsUsed}</Text>
                </View>
                <View style={themed($usageRow)}>
                  <Text style={themed($usageLabel)}>Items Created:</Text>
                  <Text style={themed($usageValue)}>{subscription.itemsUsed}</Text>
                </View>
                <View style={themed($usageRow)}>
                  <Text style={themed($usageLabel)}>AI Search:</Text>
                  <Text style={themed($usageValue)}>
                    {subscription.canUseAISearchNow ? "Available" : "Unavailable"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pro Features */}
            <View style={themed($sectionContainer)}>
              <Text style={themed($sectionTitle)}>Pro Features</Text>
              <View style={themed($featuresContainer)}>
                <View style={themed($featureItem)}>
                  <Icon
                    icon="check"
                    size={16}
                    color={
                      subscription.subscriptionInfo?.subscription_status === "pro"
                        ? theme.colors.success
                        : theme.colors.textDim
                    }
                  />
                  <Text
                    style={[
                      themed($featureText),
                      {
                        color:
                          subscription.subscriptionInfo?.subscription_status === "pro"
                            ? theme.colors.text
                            : theme.colors.textDim,
                      },
                    ]}
                  >
                    Unlimited Groups
                  </Text>
                </View>
                <View style={themed($featureItem)}>
                  <Icon
                    icon="check"
                    size={16}
                    color={
                      subscription.subscriptionInfo?.subscription_status === "pro"
                        ? theme.colors.success
                        : theme.colors.textDim
                    }
                  />
                  <Text
                    style={[
                      themed($featureText),
                      {
                        color:
                          subscription.subscriptionInfo?.subscription_status === "pro"
                            ? theme.colors.text
                            : theme.colors.textDim,
                      },
                    ]}
                  >
                    Unlimited Items
                  </Text>
                </View>
                <View style={themed($featureItem)}>
                  <Icon
                    icon="check"
                    size={16}
                    color={
                      subscription.subscriptionInfo?.subscription_status === "pro"
                        ? theme.colors.success
                        : theme.colors.textDim
                    }
                  />
                  <Text
                    style={[
                      themed($featureText),
                      {
                        color:
                          subscription.subscriptionInfo?.subscription_status === "pro"
                            ? theme.colors.text
                            : theme.colors.textDim,
                      },
                    ]}
                  >
                    AI-Powered Search
                  </Text>
                </View>
                <View style={themed($featureItem)}>
                  <Icon
                    icon="check"
                    size={16}
                    color={
                      subscription.subscriptionInfo?.subscription_status === "pro"
                        ? theme.colors.success
                        : theme.colors.textDim
                    }
                  />
                  <Text
                    style={[
                      themed($featureText),
                      {
                        color:
                          subscription.subscriptionInfo?.subscription_status === "pro"
                            ? theme.colors.text
                            : theme.colors.textDim,
                      },
                    ]}
                  >
                    Priority Support
                  </Text>
                </View>
              </View>
            </View>

            {/* Subscription Management Info */}
            <View style={themed($sectionContainer)}>
              <Text style={themed($sectionTitle)}>Subscription Management</Text>
              <View style={themed($infoContainer)}>
                <Text style={themed($infoText)}>
                  To cancel or modify your subscription, you'll need to manage it through your
                  device's subscription settings. This ensures proper billing adjustments and
                  immediate cancellation.
                </Text>
                <Text style={themed($infoText)}>
                  Changes may take a few minutes to reflect in the app.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={themed($buttonContainer)}>
            {subscription.subscriptionInfo?.subscription_status === "pro" && (
              <TouchableOpacity style={themed($manageButton)} onPress={handleManageSubscription}>
                <Text style={themed($manageButtonText)}>Manage Subscription</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={themed($refreshButton)} onPress={handleRefreshSubscription}>
              <Text style={themed($refreshButtonText)}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 20,
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 20,
  width: "100%",
  maxWidth: 400,
  maxHeight: "85%",
  position: "relative",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 10,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.md,
  right: spacing.md,
  zIndex: 1,
  padding: spacing.xs,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  paddingTop: spacing.xl + spacing.lg,
  paddingBottom: spacing.xl + spacing.lg, // Add extra bottom padding for buffer
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xl,
})

const $statusBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $statusText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

const $sectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.md,
})

const $planDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0,0,0,0.05)",
  borderRadius: 12,
  padding: spacing.md,
})

const $planRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $planLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.textDim,
})

const $planValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: colors.text,
})

const $usageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0,0,0,0.05)",
  borderRadius: 12,
  padding: spacing.md,
})

const $usageRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $usageLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.textDim,
})

const $usageValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: colors.text,
})

const $featuresContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0,0,0,0.05)",
  borderRadius: 12,
  padding: spacing.md,
})

const $featureItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.sm,
  gap: spacing.sm,
})

const $featureText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.text,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  paddingTop: 0,
  gap: spacing.md,
})

const $manageButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
})

const $manageButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
  textAlign: "center",
})

const $refreshButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
})

const $refreshButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
  textAlign: "center",
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  padding: 40,
})

const $infoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0,0,0,0.05)",
  borderRadius: 12,
  padding: spacing.md,
  marginTop: spacing.md,
})

const $infoText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.sm,
})

export default SubscriptionManagementModal
