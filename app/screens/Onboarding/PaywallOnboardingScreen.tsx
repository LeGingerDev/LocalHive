import React, { useEffect, useRef, useState } from "react"
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useRevenueCat } from "@/hooks/useRevenueCat"
import { AnalyticsService } from "@/services/analyticsService"
import { revenueCatService } from "@/services/revenueCatService"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"
import { typography } from "@/theme/typography"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export const PaywallOnboardingScreen = () => {
  const navigation = useNavigation<any>()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [monthlyPrice, setMonthlyPrice] = useState("$5.99") // Default fallback
  const [yearlyPrice, setYearlyPrice] = useState("$59.99") // Default fallback

  const { subscriptionTiers, loading: revenueCatLoading } = useRevenueCat()

  // Check if user has already used their trial
  const checkTrialStatus = async () => {
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
          `🔍 [PaywallOnboarding] Trial status: ${hasTrialHistory ? "Used" : "Available"}`,
        )
      }
    } catch (error) {
      console.error("❌ [PaywallOnboarding] Error checking trial status:", error)
      // Default to assuming trial is available if we can't check
      setHasUsedTrial(false)
    }
  }

  // Get pricing from RevenueCat subscription tiers
  const updatePricingFromRevenueCat = () => {
    if (subscriptionTiers.length > 0) {
      // Find monthly subscription
      const monthlyTier = subscriptionTiers.find(
        (tier) => tier.id.includes("monthly") || tier.id.includes("$rc_monthly"),
      )
      
      // Find yearly subscription
      const yearlyTier = subscriptionTiers.find(
        (tier) => tier.id.includes("yearly") || tier.id.includes("$rc_yearly"),
      )

      if (monthlyTier) {
        setMonthlyPrice(monthlyTier.price)
        console.log(`💰 [PaywallOnboarding] Monthly price from RevenueCat: ${monthlyTier.price}`)
      }

      if (yearlyTier) {
        setYearlyPrice(yearlyTier.price)
        console.log(`💰 [PaywallOnboarding] Yearly price from RevenueCat: ${yearlyTier.price}`)
      }
    }
  }

  // Enhanced animation refs
  const contentFadeAnim = useRef(new Animated.Value(0)).current
  const titleSlideAnim = useRef(new Animated.Value(50)).current
  const featuresAnim = useRef(new Animated.Value(0)).current
  const priceAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current

  // Track screen view on mount and check trial status
  useEffect(() => {
    AnalyticsService.trackScreenView({ screenName: "PaywallOnboarding" })
    checkTrialStatus()

    // Start enhanced content animations
    const startContentAnimations = () => {
      // Animate content fade in
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start()

      // Animate title slide in with bounce
      setTimeout(() => {
        Animated.spring(titleSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start()
      }, 200)

      // Animate features with stagger
      setTimeout(() => {
        Animated.timing(featuresAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start()
      }, 400)

      // Animate price
      setTimeout(() => {
        Animated.timing(priceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      }, 600)

      // Animate buttons with enhanced effects
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(buttonScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start()
      }, 800)
    }

    // Start animations after a short delay
    setTimeout(() => {
      startContentAnimations()
    }, 300)
  }, [contentFadeAnim, titleSlideAnim, featuresAnim, priceAnim, buttonScaleAnim, buttonOpacityAnim])

  // Update pricing when RevenueCat data is available
  useEffect(() => {
    if (!revenueCatLoading && subscriptionTiers.length > 0) {
      updatePricingFromRevenueCat()
    }
  }, [revenueCatLoading, subscriptionTiers])

  const handleStartTrial = async () => {
    // Enhanced haptic feedback for primary action
    ReactNativeHapticFeedback.trigger("impactHeavy")

    // Enhanced button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    setIsPurchasing(true)

    try {
      // Track trial start attempt
      AnalyticsService.trackEvent({
        name: "paywall_trial_started",
        properties: {
          source: "onboarding_paywall",
          action: "start_trial",
        },
      })

      // Get RevenueCat offerings
      const offerings = await revenueCatService.getOfferings()

      if (!offerings) {
        throw new Error("No subscription offerings available")
      }

      // Find the trial package (usually the first one or one with "trial" in the name)
      const trialPackage =
        offerings.availablePackages.find(
          (pkg) => pkg.identifier.includes("trial") || pkg.identifier.includes("monthly"),
        ) || offerings.availablePackages[0]

      if (!trialPackage) {
        throw new Error("No trial package found")
      }

      console.log(`🛒 [PaywallOnboarding] Starting anonymous trial purchase`)

      // Purchase the trial package (anonymous purchase)
      const customerInfo = await revenueCatService.purchasePackage(trialPackage)

      if (customerInfo) {
        console.log(`✅ [PaywallOnboarding] Trial purchase successful`)

        // Track successful purchase
        AnalyticsService.trackEvent({
          name: "paywall_trial_purchased",
          properties: {
            source: "onboarding_paywall",
            productId: trialPackage.product.identifier,
            price: trialPackage.product.price,
            currency: trialPackage.product.currencyCode,
          },
        })

        // Navigate to signup with purchase success
        navigation.navigate("Landing", { hasPurchase: true })
      } else {
        throw new Error("Purchase failed - no customer info returned")
      }
    } catch (error) {
      console.error(`❌ [PaywallOnboarding] Trial purchase failed:`, error)

      // Track purchase failure
      AnalyticsService.trackEvent({
        name: "paywall_trial_failed",
        properties: {
          source: "onboarding_paywall",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })

      Alert.alert(
        "Purchase Failed",
        "Unable to start your trial. Please try again or contact support.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: () => handleStartTrial() },
        ],
      )
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleGoToLogin = () => {
    // Enhanced haptic feedback for secondary action
    ReactNativeHapticFeedback.trigger("impactMedium")

    // Track skip action
    AnalyticsService.trackEvent({
      name: "paywall_skipped",
      properties: {
        source: "onboarding_paywall",
        action: "go_to_login",
      },
    })

    // Navigate to login
    navigation.navigate("Landing")
  }

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Gradient Background - Same as Landing Screen */}
      <LinearGradient
        colors={["#7727c3", "#003161"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentFadeAnim,
            },
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                transform: [{ translateY: titleSlideAnim }],
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.title,
                {
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                },
              ]}
            >
              {hasUsedTrial ? "Upgrade to Pro" : "Start Your Free Trial"}
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: contentFadeAnim,
                },
              ]}
            >
              {hasUsedTrial
                ? "Unlock unlimited access to all premium features"
                : "Get 3 days of unlimited access to all premium features"}
            </Animated.Text>
          </Animated.View>

          {/* Enhanced Features */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                opacity: featuresAnim,
                transform: [
                  {
                    translateY: featuresAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIcon}>
                  <Icon icon="lightning" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureGlow} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Search</Text>
                <Text style={styles.featureDescription}>
                  Find anything instantly with natural language
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIcon}>
                  <Icon icon="view" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureGlow} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Unlimited Groups</Text>
                <Text style={styles.featureDescription}>Create as many groups as you need</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIcon}>
                  <Icon icon="check" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureGlow} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Unlimited Items</Text>
                <Text style={styles.featureDescription}>Catalog everything without limits</Text>
              </View>
            </View>
          </Animated.View>

          {/* Price Section */}
          <Animated.View
            style={[
              styles.priceContainer,
              {
                opacity: priceAnim,
                transform: [
                  {
                    scale: priceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {hasUsedTrial ? (
              <>
                <Text style={styles.price}>{monthlyPrice}</Text>
                <Text style={styles.pricePeriod}>per month</Text>
                <Text style={styles.priceAfter}>Cancel anytime</Text>
              </>
            ) : (
              <>
                <Text style={styles.price}>$0</Text>
                <Text style={styles.pricePeriod}>for 3 days</Text>
                <Text style={styles.priceAfter}>Then {monthlyPrice}/month</Text>
              </>
            )}
          </Animated.View>

          {/* Trust Indicators */}
          <View style={styles.trustContainer}>
            <Text style={styles.trustText}>
              {hasUsedTrial
                ? "Cancel anytime • No commitment • Instant access"
                : "Cancel anytime • No commitment • 3-day free trial"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Enhanced Action Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacityAnim,
            transform: [{ scale: buttonScaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryButton, isPurchasing && styles.primaryButtonDisabled]}
          onPress={handleStartTrial}
          disabled={isPurchasing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F8F9FC"]}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryButtonText}>
              {isPurchasing ? "Processing..." : hasUsedTrial ? "Subscribe Now" : "Start Free Trial"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoToLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
        </TouchableOpacity>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  featureDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: typography.primary.normal,
    fontSize: 14,
    lineHeight: 20,
  },

  featureGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 32,
    bottom: -4,
    left: -4,
    position: "absolute",
    right: -4,
    top: -4,
    zIndex: -1,
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  featureIconContainer: {
    marginRight: spacing.md,
    position: "relative",
  },
  featureItem: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
    maxWidth: 350,
    width: "100%",
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  price: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 56,
    lineHeight: 64,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  priceAfter: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: typography.primary.normal,
    fontSize: 16,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  pricePeriod: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: typography.primary.medium,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  primaryButton: {
    borderRadius: 16,
    elevation: 8,
    overflow: "hidden",
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    color: colors.palette.primary400,
    fontFamily: typography.primary.bold,
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.medium,
    fontSize: 16,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: typography.primary.normal,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  title: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 36,
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  trustContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  trustText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: typography.primary.normal,
    fontSize: 14,
    textAlign: "center",
  },
})
