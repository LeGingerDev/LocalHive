import { FC, useState, useEffect, useCallback, useRef } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, ScrollView, View, TouchableOpacity } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import {
  QuickActions,
  WelcomeMessage,
  RecentActivitySection,
  type RecentActivitySectionRef,
  ShoppingListsSection,
} from "@/components/Home"
import { Screen } from "@/components/Screen"
import { SearchModal } from "@/components/SearchModal"
import { SubscriptionStatusBox } from "@/components/Subscription"
import SubscriptionManagementModal from "@/components/Subscription/SubscriptionManagementModal"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useGroups } from "@/hooks/useGroups"
import { useSubscription } from "@/hooks/useSubscription"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { navigate } from "@/navigators/navigationUtilities"
import { HapticService } from "@/services/hapticService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
interface HomeScreenProps extends BottomTabScreenProps<"Home"> {}

interface HomeError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  // #region Private State Variables
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<HomeError | null>(null)
  const [isManageModalVisible, setIsManageModalVisible] = useState<boolean>(false)
  const [isSearchModalVisible, setIsSearchModalVisible] = useState<boolean>(false)
  const [searchAIMode, setSearchAIMode] = useState<boolean>(false)
  const lastRefreshTimeRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  const { trackScreenView } = useAnalytics()
  const { user, userProfile } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const { refresh: refreshGroups } = useGroups()

  // Ref for RecentActivitySection to refresh data
  const recentActivityRef = useRef<RecentActivitySectionRef | null>(null)
  // #endregion

  // #region Data Fetching Functions
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Mock data removed since it's not used
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
    HapticService.selection()
    navigate("CreateGroup")
  }, [])

  const handleAddItem = useCallback(() => {
    HapticService.selection()
    navigation.navigate("Add")
  }, [navigation])

  const handleCreateList = useCallback(() => {
    HapticService.selection()
    navigation.navigate("CreateList" as any)
  }, [navigation])

  const handleSearch = useCallback((enableAI?: boolean) => {
    HapticService.selection()
    setIsSearchModalVisible(true)
    // Store the AI mode preference to pass to the modal
    setSearchAIMode(enableAI || false)
  }, [])

  const handleHeaderSearch = useCallback(() => {
    HapticService.selection()
    setIsSearchModalVisible(true)
    // Header search uses regular search (non-AI mode)
    setSearchAIMode(false)
  }, [])

  const handleViewGroups = useCallback(() => {
    HapticService.selection()
    navigation.navigate("Groups")
  }, [navigation])

  const handleShowAllItems = useCallback(() => {
    HapticService.selection()
    navigation.navigate("ShowAllItems")
  }, [navigation])

  const handleManagePress = useCallback(() => {
    HapticService.light()
    setIsManageModalVisible(true)
  }, [])

  const handleCloseManageModal = useCallback(() => {
    HapticService.light()
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

  // Memoized refresh function to prevent unnecessary re-renders
  const refreshAllData = useCallback(async () => {
    if (!user?.id || isRefreshingRef.current) {
      console.log("[HomeScreen] Refresh skipped - no user or already refreshing")
      return
    }

    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current

    // Prevent refreshing more than once every 2 seconds
    if (timeSinceLastRefresh < 2000) {
      console.log(`[HomeScreen] Refresh throttled - last refresh was ${timeSinceLastRefresh}ms ago`)
      return
    }

    isRefreshingRef.current = true
    lastRefreshTimeRef.current = now

    try {
      console.log("[HomeScreen] Screen focused - refreshing all data")

      // Refresh subscription data (clears cache and reloads)
      subscription.refresh()

      // Refresh groups data
      refreshGroups()

      // Refresh recent activity data
      if (recentActivityRef.current) {
        recentActivityRef.current.refresh()
      }

      console.log("[HomeScreen] All data refresh completed")
    } catch (error) {
      console.error("[HomeScreen] Error during refresh:", error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [user?.id, subscription.refresh, refreshGroups])

  // Enhanced refresh functionality when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAllData()
    }, [refreshAllData]),
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
      <Header
        title="Home"
        rightActions={[
          {
            text: "Search",
            onPress: handleHeaderSearch,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={themed($scrollContent)}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <WelcomeMessage userProfile={userProfile} />

        {/* Subscription Status */}
        <SubscriptionStatusBox userId={user?.id || null} onManagePress={handleManagePress} />

        {/* Quick Actions */}
        <QuickActions
          userId={user?.id || null}
          onCreateGroup={handleCreateGroup}
          onAddItem={handleAddItem}
          onCreateList={handleCreateList}
          onSearch={handleSearch}
          onViewGroups={handleViewGroups}
          onShowAllItems={handleShowAllItems}
        />

        {/* Shopping Lists Section */}
        <ShoppingListsSection
          onListPress={(list) => {
            navigation.navigate("ListDetail" as any, { 
              listId: list.id,
              listName: list.name 
            })
          }}
          onCreateList={handleCreateList}
          limit={3}
        />

        {/* Recent Activity Section */}
        <RecentActivitySection limit={5} ref={recentActivityRef} />

        {/* Tips Section */}
        <View style={themed($tipsSection)}>
          <Text style={themed($sectionTitle)}>💡 Tips</Text>
          <View style={themed($tipsContent)}>
            <Text style={themed($tipText)}>• Create groups to organize your items</Text>
            <Text style={themed($tipText)}>• Use AI search to quickly find what you need</Text>
            {!subscription.isPro && (
              <Text style={themed($tipText)}>• Upgrade to Pro for unlimited access</Text>
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
      {/* Search Modal */}
      <SearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        enableAI={searchAIMode}
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
const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
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

// Collapsible section styles
const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $sectionHeaderContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $sectionHeaderLeft: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $sectionHeaderTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.bold,
  fontSize: 16,
})

const $sectionHeaderRight: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
})

const $collapsedSectionSummary: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 12,
})

const $inviteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $inviteButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})

const $caretButton: ThemedStyle<ViewStyle> = () => ({
  padding: 4,
})

const $caretButtonIcon: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.text,
})
// #endregion
