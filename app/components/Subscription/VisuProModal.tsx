import React, { useState, useEffect } from "react"
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
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { Icon } from "@/components/Icon"
import { useAuth } from "@/context/AuthContext"
import { useRevenueCat } from "@/hooks/useRevenueCat"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { restartApp } from "@/utils/appRestart"

export interface VisuProModalProps {
  visible: boolean
  onClose: () => void
  onStartTrial: () => void
  style?: StyleProp<ViewStyle>
}

export const VisuProModal: React.FC<VisuProModalProps> = ({
  visible,
  onClose,
  onStartTrial,
  style,
}) => {
  const { themed, theme } = useAppTheme()
  const { userProfile } = useAuth()
  const {
    isInitialized,
    subscriptionTiers,
    loading: isLoading,
    error,
    purchaseAndSync,
    setUserID,
    refreshCustomerInfo,
  } = useRevenueCat()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [hasUsedTrial, setHasUsedTrial] = useState(false)

  // Set user ID when modal opens and check trial status
  useEffect(() => {
    if (visible && userProfile?.id && isInitialized) {
      setUserID(userProfile.id)
      checkTrialStatus(userProfile.id)
    }
  }, [visible, userProfile?.id, isInitialized, setUserID])

  // Check if user has already used their trial
  const checkTrialStatus = async (userId: string) => {
    try {
      const { revenueCatService } = await import("@/services/revenueCatService")
      const customerInfo = await revenueCatService.getCustomerInfo()

      if (customerInfo) {
        // Check if user has any trial-related entitlements in their history
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        const hasTrialHistory = allEntitlements.some(
          (entitlement) =>
            entitlement.identifier.includes("trial") ||
            entitlement.identifier.includes("intro") ||
            entitlement.periodType === "intro",
        )

        setHasUsedTrial(hasTrialHistory)
        console.log(
          `🔍 [VisuProModal] Trial status for user ${userId}: ${hasTrialHistory ? "Used" : "Available"}`,
        )
      }
    } catch (error) {
      console.error("❌ [VisuProModal] Error checking trial status:", error)
      // Default to assuming trial is available if we can't check
      setHasUsedTrial(false)
    }
  }

  // Get the monthly subscription package for pricing
  const monthlyPackage = subscriptionTiers.find(
    (tier) => tier.id.includes("monthly") || tier.id.includes("$rc_monthly"),
  )

  const handlePurchase = async () => {
    if (!userProfile?.id) {
      Alert.alert("Error", "Please sign in to purchase a subscription")
      return
    }

    if (!isInitialized) {
      Alert.alert("Error", "Payment system is not ready. Please try again.")
      return
    }

    if (!monthlyPackage) {
      Alert.alert("Error", "Subscription package not found. Please try again later.")
      return
    }

    console.log(`🛒 [VisuProModal] Starting purchase for user: ${userProfile.id}`)
    setIsPurchasing(true)

    try {
      // Get the actual package from RevenueCat offerings
      const { revenueCatService } = await import("@/services/revenueCatService")
      console.log(`🔍 [VisuProModal] Getting RevenueCat offerings...`)
      const offerings = await revenueCatService.getOfferings()

      if (!offerings) {
        throw new Error("No subscription offerings available")
      }

      console.log(
        `📦 [VisuProModal] Available packages:`,
        offerings.availablePackages.map((pkg) => ({
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          price: pkg.product.price,
        })),
      )

      // Find the monthly package
      const packageToPurchase = offerings.availablePackages.find(
        (pkg) => pkg.identifier.includes("monthly") || pkg.identifier.includes("$rc_monthly"),
      )

      if (!packageToPurchase) {
        console.error(`❌ [VisuProModal] Monthly package not found in offerings`)
        throw new Error("Monthly subscription package not found")
      }

      console.log(`🎯 [VisuProModal] Found package to purchase:`, {
        identifier: packageToPurchase.identifier,
        productId: packageToPurchase.product.identifier,
        price: packageToPurchase.product.price,
      })

      // Make the actual purchase using the service directly
      console.log(`💳 [VisuProModal] Making purchase...`)
      const customerInfo = await revenueCatService.purchaseAndSync(
        userProfile.id,
        packageToPurchase,
      )

      if (!customerInfo) {
        throw new Error("Purchase completed but no customer info returned")
      }

      console.log(`✅ [VisuProModal] Purchase successful! Customer info:`, {
        userId: customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allEntitlements: Object.keys(customerInfo.entitlements.all),
      })

      // Force a manual sync to ensure Supabase is updated
      console.log(`🔄 [VisuProModal] Forcing manual sync...`)
      await revenueCatService.syncSubscriptionWithSupabase(userProfile.id)

      // Refresh the subscription data in the hook
      console.log(`🔄 [VisuProModal] Refreshing subscription data...`)
      await refreshCustomerInfo()

      // Also refresh the subscription status in the parent component
      // This will be handled by the onStartTrial callback which should trigger a refresh

      // Show success message
      Alert.alert(
        "Success!",
        "Your subscription has been activated. Welcome to Visu Pro! The app will restart to apply your new subscription.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log(`🎉 [VisuProModal] Purchase completed, restarting app...`)
              onClose()
              // Restart the app after a short delay to ensure the alert is dismissed
              restartApp(500)
            },
          },
        ],
      )

      // Don't call onStartTrial since we're restarting the app
      // onStartTrial()
    } catch (err) {
      console.error("❌ [VisuProModal] Purchase error:", err)

      let errorMessage = "Something went wrong. Please try again."
      if (err instanceof Error) {
        errorMessage = err.message
        // Handle specific RevenueCat errors
        if (err.message.includes("cancelled") || err.message.includes("canceled")) {
          errorMessage = "Purchase was cancelled"
        } else if (err.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (err.message.includes("already purchased")) {
          errorMessage = "You already have an active subscription."
        }
      }

      Alert.alert("Purchase Failed", errorMessage)
    } finally {
      setIsPurchasing(false)
    }
  }

  const features = [
    {
      title: "AI-Powered Smart Search",
      description: "Ask in natural language, get perfect results",
    },
    {
      title: "Unlimited Searches",
      description: "No limits on AI-powered queries",
    },
    {
      title: "Smart Recommendations",
      description: "Get personalized suggestions based on your location",
    },
    {
      title: "Early Access to New Features",
      description: "Be the first to try new capabilities",
    },
  ]

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
            {/* Header with dynamic pricing */}
            <View style={themed($headerContainer)}>
              <Text style={themed($price)}>{monthlyPackage ? monthlyPackage.price : "$5.99"}</Text>
              <Text style={themed($pricePeriod)}>/month</Text>
            </View>
            <Text style={themed($cancelText)}>Cancel anytime</Text>

            {/* Features list */}
            <View style={themed($featuresContainer)}>
              {features.map((feature, index) => (
                <View key={index} style={themed($featureItem)}>
                  <View style={themed($featureIcon)}>
                    <Icon icon="check" size={16} color="white" />
                  </View>
                  <View style={themed($featureTextContainer)}>
                    <Text style={themed($featureTitle)}>{feature.title}</Text>
                    <Text style={themed($featureDescription)}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* CTA Button */}
          <View style={themed($buttonContainer)}>
            <TouchableOpacity
              style={themed($gradientButton)}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoading}
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={themed($gradientStyle)}
              >
                <Text style={themed($buttonText)}>
                  {isPurchasing || isLoading
                    ? "Processing..."
                    : hasUsedTrial
                      ? "Subscribe Now"
                      : "Start 3-Day Free Trial"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {error && <Text style={themed($errorText)}>{error}</Text>}
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
  maxHeight: "80%",
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
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "center",
  marginBottom: spacing.xxs,
})

const $price: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 32,
  color: colors.text,
  lineHeight: 38,
})

const $pricePeriod: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 18,
  color: colors.textDim,
  marginLeft: spacing.xxs,
})

const $cancelText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $featuresContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $featureItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.lg,
})

const $featureIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.success,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.md,
  marginTop: 2,
})

const $featureTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $featureTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $featureDescription: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  paddingTop: 0,
})

const $gradientButton: ThemedStyle<ViewStyle> = () => ({
  borderRadius: 12,
  overflow: "hidden",
})

const $gradientStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: "white",
  textAlign: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  textAlign: "center",
  marginTop: spacing.sm,
})

export default VisuProModal
