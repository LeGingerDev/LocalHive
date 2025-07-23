import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

import { useAuth } from "@/context/AuthContext"
import { useRevenueCat } from "@/hooks/useRevenueCat"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const RevenueCatTestComponent: React.FC = () => {
  const { themed, theme } = useAppTheme()
  const { userProfile } = useAuth()
  const { 
    isInitialized, 
    hasActiveSubscription, 
    customerInfo, 
    subscriptionTiers, 
    isLoading, 
    error,
    setUserID,
    refreshCustomerInfo 
  } = useRevenueCat()

  const handleSetUserID = async () => {
    if (userProfile?.id) {
      try {
        await setUserID(userProfile.id)
        console.log("✅ User ID set successfully")
      } catch (err) {
        console.error("❌ Failed to set user ID:", err)
      }
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshCustomerInfo()
      console.log("✅ Customer info refreshed")
    } catch (err) {
      console.error("❌ Failed to refresh customer info:", err)
    }
  }

  return (
    <View style={themed($container)}>
      <Text style={themed($title)}>RevenueCat Test</Text>
      
      <View style={themed($statusContainer)}>
        <Text style={themed($statusText)}>
          Initialized: {isInitialized ? "✅" : "❌"}
        </Text>
        <Text style={themed($statusText)}>
          Loading: {isLoading ? "🔄" : "✅"}
        </Text>
        <Text style={themed($statusText)}>
          Has Subscription: {hasActiveSubscription ? "✅" : "❌"}
        </Text>
        <Text style={themed($statusText)}>
          User ID: {userProfile?.id ? "✅" : "❌"}
        </Text>
      </View>

      {error && (
        <Text style={themed($errorText)}>Error: {error}</Text>
      )}

      {customerInfo && (
        <View style={themed($infoContainer)}>
          <Text style={themed($infoTitle)}>Customer Info:</Text>
          <Text style={themed($infoText)}>
            Original App User ID: {customerInfo.originalAppUserId}
          </Text>
          <Text style={themed($infoText)}>
            Active Entitlements: {Object.keys(customerInfo.entitlements.active).length}
          </Text>
        </View>
      )}

      {subscriptionTiers.length > 0 && (
        <View style={themed($tiersContainer)}>
          <Text style={themed($infoTitle)}>Available Tiers:</Text>
          {subscriptionTiers.map((tier, index) => (
            <Text key={index} style={themed($infoText)}>
              {tier.name} - {tier.price} ({tier.id})
            </Text>
          ))}
        </View>
      )}

      <View style={themed($buttonContainer)}>
        <TouchableOpacity style={themed($button)} onPress={handleSetUserID}>
          <Text style={themed($buttonText)}>Set User ID</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={themed($button)} onPress={handleRefresh}>
          <Text style={themed($buttonText)}>Refresh Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const $container: ThemedStyle<any> = ({ colors, spacing }) => ({
  padding: spacing.lg,
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  margin: spacing.md,
})

const $title: ThemedStyle<any> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})

const $statusContainer: ThemedStyle<any> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $statusText: ThemedStyle<any> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $errorText: ThemedStyle<any> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  marginBottom: spacing.md,
})

const $infoContainer: ThemedStyle<any> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $infoTitle: ThemedStyle<any> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $infoText: ThemedStyle<any> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginBottom: spacing.xxs,
})

const $tiersContainer: ThemedStyle<any> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $buttonContainer: ThemedStyle<any> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $button: ThemedStyle<any> = ({ colors, spacing }) => ({
  backgroundColor: colors.gradientOrange[0],
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  flex: 1,
})

const $buttonText: ThemedStyle<any> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.background,
  textAlign: "center",
})

export default RevenueCatTestComponent 