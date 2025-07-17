import React, { FC, useState, useEffect, useCallback } from "react"
import {
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  Alert,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { SubscriptionStatusBox } from "@/components/Subscription"
import SubscriptionManagementModal from "@/components/Subscription/SubscriptionManagementModal"
import { QuickActions, WelcomeMessage, RecentActivitySection } from "@/components/Home"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useAuth } from "@/context/AuthContext"
import { useSubscription } from "@/hooks/useSubscription"
import { navigate } from "@/navigators/navigationUtilities"

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
export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  // #region Private State Variables
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState<HomeError | null>(null)
  const [isManageModalVisible, setIsManageModalVisible] = useState<boolean>(false)
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

  // #region Navigation Handlers
  const handleCreateGroup = useCallback(() => {
    navigate("CreateGroup")
  }, [])

  const handleAddItem = useCallback(() => {
    navigation.navigate("Add")
  }, [navigation])

  const handleSearch = useCallback(() => {
    navigation.navigate("Search", { enableAI: true })
  }, [navigation])

  const handleViewGroups = useCallback(() => {
    navigation.navigate("Groups")
  }, [navigation])

  const handleManagePress = useCallback(() => {
    setIsManageModalVisible(true)
  }, [])

  const handleCloseManageModal = useCallback(() => {
    setIsManageModalVisible(false)
  }, [])
  // #endregion

  // #region Effects
  useEffect(() => {
    const loadData = async () => {
      await fetchData()
    }
    loadData()
  }, [fetchData])

  useEffect(() => {
    trackScreenView({ screenName: "Home" })
  }, [trackScreenView])

  // Refresh subscription data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log("[HomeScreen] Screen focused - refreshing subscription data")
        subscription.refresh()
      }
    }, [user?.id]) // Only depend on user?.id, not the subscription object
  )
  // #endregion

  // #region Render Functions
  const renderLoadingState = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top"]}>
      <Header title="Home" />
      <View style={themed($loadingContainer)}>
        <ActivityIndicator size="large" color={themed($activityIndicator).color} />
        <Text style={themed($loadingText)}>Loading...</Text>
      </View>
    </Screen>
  )

  const renderErrorState = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top"]}>
      <Header title="Home" />
      <View style={themed($errorContainer)}>
        <Text style={themed($errorTitle)}>Something went wrong</Text>
        <Text style={themed($errorMessage)}>{error?.message}</Text>
        <Text style={themed($retryButton)} onPress={handleRetry}>
          Try Again
        </Text>
      </View>
    </Screen>
  )

    const renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header title="Home" />
      
      <ScrollView 
        contentContainerStyle={themed($scrollContent)}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <WelcomeMessage userEmail={user?.email} />

        {/* Subscription Status */}
        <SubscriptionStatusBox 
          userId={user?.id || null}
          onManagePress={handleManagePress}
        />

        {/* Quick Actions */}
        <QuickActions 
          userId={user?.id || null}
          onCreateGroup={handleCreateGroup}
          onAddItem={handleAddItem}
          onSearch={handleSearch}
          onViewGroups={handleViewGroups}
        />

        {/* Recent Activity Section */}
        <RecentActivitySection limit={5} />

        {/* Tips Section */}
        <View style={themed($tipsSection)}>
          <Text style={themed($sectionTitle)}>💡 Tips</Text>
          <View style={themed($tipsContent)}>
            <Text style={themed($tipText)}>
              • Create groups to organize your items
            </Text>
            <Text style={themed($tipText)}>
              • Use AI search to quickly find what you need
            </Text>
            {!subscription.isPro && (
              <Text style={themed($tipText)}>
                • Upgrade to Pro for unlimited access
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        visible={isManageModalVisible}
        onClose={handleCloseManageModal}
        userId={user?.id || null}
      />
    </Screen>
  )
  // #endregion

  // #region Main Render
  if (isLoading) {
    return renderLoadingState()
  }
  if (error) {
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

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  justifyContent: "flex-start",
  paddingBottom: spacing.xl * 4, // Increased bottom padding for better access
})




const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})

const $tipsSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
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

const $tipsContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $tipText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
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
// #endregion
