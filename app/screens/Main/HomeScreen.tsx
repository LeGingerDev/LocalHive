import React, { FC, useState, useEffect, useCallback } from "react"
import {
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useAuth } from "@/context/AuthContext"
import { useSubscription } from "@/hooks/useSubscription"
import { SubscriptionService } from "@/services/subscriptionService"

const windowHeight = Dimensions.get("window").height
const estimatedContentHeight = 250
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0)

// #region Types & Interfaces
interface HomeScreenProps extends BottomTabScreenProps<"Home"> {}

interface HomeData {
  id?: string
  name?: string
}

interface HomeError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
export const HomeScreen: FC<HomeScreenProps> = () => {
  // #region Private State Variables
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState<HomeError | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { trackScreenView } = useAnalytics()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  // #endregion

  // #region Data Fetching Functions
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockData: HomeData = { id: "1", name: "home data" }
      setData(mockData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError({ message: errorMessage })
      console.error("[HomeScreen] Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRetry = useCallback((): void => {
    setIsLoading(true)
    setError(null)
    fetchData()
  }, [fetchData])

  // #region Debug Functions
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    setDebugLogs(prev => [logEntry, ...prev.slice(0, 19)]) // Keep last 20 logs
  }, [])

  const testSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🔍 Testing subscription status...")
    
    try {
      const { status, error } = await SubscriptionService.getSubscriptionStatus(user.id)
      if (error) {
        addDebugLog(`❌ Error getting status: ${error.message}`)
      } else {
        addDebugLog(`✅ Current status: ${status}`)
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, addDebugLog])

  const testSubscriptionInfo = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🔍 Testing subscription info...")
    
    try {
      const { info, error } = await SubscriptionService.getSubscriptionInfo(user.id)
      if (error) {
        addDebugLog(`❌ Error getting info: ${error.message}`)
      } else {
        addDebugLog(`✅ Status: ${info?.subscription_status}`)
        addDebugLog(`📊 Groups: ${info?.groups_count}/${info?.max_groups}`)
        addDebugLog(`📊 Items: ${info?.items_count}/${info?.max_items}`)
        addDebugLog(`🤖 AI Search: ${info?.ai_search_enabled ? '✅' : '❌'}`)
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, addDebugLog])

  const testActivateTrial = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🎯 Activating trial...")
    
    try {
      const { success, error } = await subscription.activateTrial()
      if (error) {
        addDebugLog(`❌ Trial activation failed: ${error}`)
      } else {
        addDebugLog(`✅ Trial activated successfully`)
        // Refresh subscription data
        subscription.refresh()
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])

  const testUpgradeToPro = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🚀 Upgrading to Pro...")
    
    try {
      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      const { success, error } = await subscription.upgradeToPro(expiresAt.toISOString())
      if (error) {
        addDebugLog(`❌ Pro upgrade failed: ${error}`)
      } else {
        addDebugLog(`✅ Pro upgrade successful`)
        // Refresh subscription data
        subscription.refresh()
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])

  const testDowngradeToFree = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("⬇️ Downgrading to Free...")
    
    try {
      const { success, error } = await SubscriptionService.updateSubscriptionStatus(user.id, "free")
      if (error) {
        addDebugLog(`❌ Downgrade failed: ${error.message}`)
      } else {
        addDebugLog(`✅ Downgraded to Free`)
        // Refresh subscription data
        subscription.refresh()
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])

  const testPermissions = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🔐 Testing permissions...")
    
    try {
      const [canCreateGroup, canCreateItem, canUseAI] = await Promise.all([
        subscription.canCreateGroup(),
        subscription.canCreateItem(),
        subscription.canUseAISearch(),
      ])
      
      addDebugLog(`📁 Can create group: ${canCreateGroup ? '✅' : '❌'}`)
      addDebugLog(`📝 Can create item: ${canCreateItem ? '✅' : '❌'}`)
      addDebugLog(`🤖 Can use AI search: ${canUseAI ? '✅' : '❌'}`)
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])

  const testApproachingLimits = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("⚠️ Testing approaching limits...")
    
    try {
      const { approaching, details } = await subscription.isApproachingLimits()
      if (approaching && details) {
        addDebugLog(`⚠️ Approaching limits detected!`)
        addDebugLog(`📁 Groups: ${details.groups.current}/${details.groups.max} (${details.groups.percentage.toFixed(1)}%)`)
        addDebugLog(`📝 Items: ${details.items.current}/${details.items.max} (${details.items.percentage.toFixed(1)}%)`)
      } else {
        addDebugLog(`✅ Not approaching limits`)
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])

  const clearLogs = useCallback(() => {
    setDebugLogs([])
    addDebugLog("🧹 Debug logs cleared")
  }, [addDebugLog])

  const initializeUserUsage = useCallback(async () => {
    if (!user?.id) {
      addDebugLog("❌ No user ID available")
      return
    }

    addDebugLog("🔄 Initializing user usage...")
    
    try {
      const { count, error } = await SubscriptionService.initializeAllUserUsage()
      if (error) {
        addDebugLog(`❌ Initialization failed: ${error.message}`)
      } else {
        addDebugLog(`✅ Initialized ${count} users`)
        // Refresh subscription data
        subscription.refresh()
      }
    } catch (err) {
      addDebugLog(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user?.id, subscription, addDebugLog])
  // #endregion

  // #region Lifecycle Effects
  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      if (isMounted) {
        await fetchData()
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [fetchData])

  // Track screen view when component mounts
  useEffect(() => {
    trackScreenView({ screenName: 'Home' })
  }, [trackScreenView])

  // Debug log when subscription data changes
  useEffect(() => {
    if (subscription.subscriptionInfo) {
      addDebugLog(`📱 Subscription loaded: ${subscription.subscriptionStatus}`)
      addDebugLog(`📊 Groups: ${subscription.groupsUsed}/${subscription.groupsLimit}`)
      addDebugLog(`📊 Items: ${subscription.itemsUsed}/${subscription.itemsLimit}`)
    }
  }, [subscription.subscriptionInfo, addDebugLog])

  // Debug log when component mounts
  useEffect(() => {
    addDebugLog("🏠 HomeScreen mounted - Debug interface ready!")
    console.log("🔧 Debug interface should be visible now")
  }, [addDebugLog])
  // #endregion

  // #region Render Helpers
  const renderLoadingState = (): React.JSX.Element => (
    <Screen style={themed($loadingContainer)} preset="fixed">
      <ActivityIndicator size="large" color={themed($activityIndicator).color} />
      <Text style={themed($loadingText)}>{"Loading..."}</Text>
    </Screen>
  )

  const renderErrorState = (): React.JSX.Element => (
    <Screen style={themed($errorContainer)} preset="fixed">
      <Text style={themed($errorTitle)}>{"Oops! Something went wrong"}</Text>
      <Text style={themed($errorMessage)}>{error?.message ?? "Unknown error"}</Text>
      <Text style={themed($retryButton)} onPress={handleRetry}>
        {"Tap to retry"}
      </Text>
    </Screen>
  )

  const renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={["top"]}>
      <Header title="Home" />
      <View style={themed($contentWrapper)}>
        {/* Subscription Debug Section */}
        <View style={themed($debugSection)}>
          <Text style={themed($debugTitle)}>🔧 Subscription System Debug</Text>
          
          {/* Current Status Display */}
          <View style={themed($statusContainer)}>
            <Text style={themed($statusTitle)}>Current Status:</Text>
            <Text style={themed($statusText)}>
              {subscription.loading ? "Loading..." : subscription.subscriptionStatus}
            </Text>
            <Text style={themed($statusText)}>
              Groups: {subscription.groupsUsed}/{subscription.groupsLimit} ({subscription.groupsPercentage.toFixed(1)}%)
            </Text>
            <Text style={themed($statusText)}>
              Items: {subscription.itemsUsed}/{subscription.itemsLimit} ({subscription.itemsPercentage.toFixed(1)}%)
            </Text>
            <Text style={themed($statusText)}>
              AI Search: {subscription.canUseAISearchNow ? "✅" : "❌"}
            </Text>
          </View>

          {/* Debug Buttons */}
          <View style={themed($buttonContainer)}>
            <Text style={themed($buttonSectionTitle)}>Test Functions:</Text>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testSubscriptionStatus}>
              <Text style={themed($debugButtonText)}>🔍 Test Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testSubscriptionInfo}>
              <Text style={themed($debugButtonText)}>📊 Test Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testPermissions}>
              <Text style={themed($debugButtonText)}>🔐 Test Permissions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testApproachingLimits}>
              <Text style={themed($debugButtonText)}>⚠️ Test Limits</Text>
            </TouchableOpacity>
          </View>

          <View style={themed($buttonContainer)}>
            <Text style={themed($buttonSectionTitle)}>Subscription Actions:</Text>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testActivateTrial}>
              <Text style={themed($debugButtonText)}>🎯 Activate Trial</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testUpgradeToPro}>
              <Text style={themed($debugButtonText)}>🚀 Upgrade to Pro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={testDowngradeToFree}>
              <Text style={themed($debugButtonText)}>⬇️ Downgrade to Free</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={subscription.refresh}>
              <Text style={themed($debugButtonText)}>🔄 Refresh Data</Text>
            </TouchableOpacity>
          </View>

          <View style={themed($buttonContainer)}>
            <Text style={themed($buttonSectionTitle)}>Database Actions:</Text>
            
            <TouchableOpacity style={themed($debugButton)} onPress={initializeUserUsage}>
              <Text style={themed($debugButtonText)}>🔄 Initialize All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={themed($debugButton)} onPress={clearLogs}>
              <Text style={themed($debugButtonText)}>🧹 Clear Logs</Text>
            </TouchableOpacity>
          </View>

          {/* Debug Logs */}
          <View style={themed($logsContainer)}>
            <Text style={themed($logsTitle)}>Debug Logs:</Text>
            <ScrollView style={themed($logsScroll)} nestedScrollEnabled>
              {debugLogs.length === 0 ? (
                <Text style={themed($noLogsText)}>No logs yet. Try some debug actions!</Text>
              ) : (
                debugLogs.map((log, index) => (
                  <Text key={index} style={themed($logEntry)}>
                    {log}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Screen>
  )
  // #endregion

  // #region Main Render
  if (isLoading && !data) {
    return renderLoadingState()
  }
  if (error && !data) {
    return renderErrorState()
  }
  return renderContent()
  // #endregion
}
// #endregion

// #region Styles
const $root: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.background,
})
const $loadingContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})
const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})
const $title: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: colors.text,
  marginBottom: spacing.md,
  textAlign: "center",
})
const $dataText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.sm,
})
const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  marginTop: spacing.md,
})
const $errorTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.error,
  marginBottom: spacing.sm,
  textAlign: "center",
})
const $errorMessage: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.lg,
  textAlign: "center",
})
const $retryButton: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
  textDecorationLine: "underline",
})
const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})
const $contentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: colors.background,
  paddingTop: verticalPadding,
  paddingBottom: verticalPadding,
})
const $placeholderText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: "white",
  fontSize: 22,
  fontWeight: "bold",
  textAlign: "center",
  marginTop: 8,
})
const $emptyStateContainer = (): ViewStyle => ({
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "center",
  paddingTop: verticalPadding,
  paddingBottom: verticalPadding,
})
const $emptyState = ({ spacing }: any): ViewStyle => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl * 2,
})
const $emptyStateTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})
const $emptyStateText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.md,
})

// Debug Interface Styles
const $contentWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.lg,
})

const $debugSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $debugTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  marginBottom: spacing.lg,
  textAlign: "center",
})

const $statusContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
})

const $statusTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
})

const $statusText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $buttonSectionTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
})

const $debugButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  padding: spacing.sm,
  borderRadius: 6,
  marginBottom: spacing.xs,
  alignItems: "center",
})

const $debugButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.background,
})

const $logsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  padding: spacing.md,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  maxHeight: 200,
})

const $logsTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
})

const $logsScroll: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $logEntry: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 2,
})

const $noLogsText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
})
// #endregion
