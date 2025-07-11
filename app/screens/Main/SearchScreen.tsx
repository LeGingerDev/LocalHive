import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
// import { useNavigation } from "@react-navigation/native"

// #region Types & Interfaces
interface SearchScreenProps extends BottomTabScreenProps<"Search"> {}

interface SearchData {
  // TODO: Define your data structure here
  id?: string
  name?: string
}

interface SearchError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
/**
 * SearchScreen - A defensive screen with proper error handling and loading states
 *
 * Features:
 * - Loading state support
 * - Error state handling
 * - Pull-to-refresh functionality
 * - Null safety checks
 * - Follows SOLID principles
 *
 * Note: This screen should be wrapped in an error boundary at the app level
 * for comprehensive error handling.
 */
export const SearchScreen: FC<SearchScreenProps> = () => {
  // #region Private State Variables
  const [_isLoading, setIsLoading] = useState<boolean>(true)
  const [_data, setData] = useState<SearchData | null>(null)
  const [_error, setError] = useState<SearchError | null>(null)
  const [_isRefreshing, setIsRefreshing] = useState<boolean>(false)
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  // const navigation = useNavigation<AppStackNavigationProp<"Search">>()
  // #endregion

  // #region Data Fetching Functions
  const _fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      // TODO: Replace with your actual API call
      // const response = await YourApiService.getData()

      // TEMPORARY: Simulate API call for development/testing
      // REMOVE THIS SECTION when implementing real API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // TEMPORARY: Mock data for development/testing
      // REMOVE THIS SECTION when implementing real API calls
      const mockData: SearchData = {
        id: "1",
        name: "search data",
      }

      setData(mockData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError({ message: errorMessage })
      console.error("[SearchScreen] Error fetching data:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const _handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    await _fetchData()
  }, [_fetchData])

  const _handleRetry = useCallback((): void => {
    setIsLoading(true)
    setError(null)
    _fetchData()
  }, [_fetchData])
  // #endregion

  // #region Lifecycle Effects
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (isMounted) {
        await _fetchData()
      }
    }

    loadData()

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [_fetchData])
  // #endregion

  // #region Render Helpers
  const _renderLoadingState = (): React.JSX.Element => (
    <Screen style={themed($loadingContainer)} preset="fixed">
      <ActivityIndicator size="large" color={themed($activityIndicator).color} />
      <Text style={themed($loadingText)} text="Loading..." />
    </Screen>
  )

  const _renderErrorState = (): React.JSX.Element => (
    <Screen style={themed($errorContainer)} preset="fixed">
      <Text style={themed($errorTitle)} text="Oops! Something went wrong" />
      <Text style={themed($errorMessage)} text={_error?.message ?? "Unknown error"} />
      <Text style={themed($retryButton)} text="Tap to retry" onPress={_handleRetry} />
    </Screen>
  )

  const _renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="scroll">
      <Text style={themed($title)} text="Search" />
      {_data && (
        <>
          <Text style={themed($dataText)} text={`ID: ${_data.id ?? "N/A"}`} />
          <Text style={themed($dataText)} text={`Name: ${_data.name ?? "N/A"}`} />
        </>
      )}

      {/* TODO: Add your actual content here */}
    </Screen>
  )
  // #endregion

  // #region Main Render
  if (_isLoading && !_data) {
    return _renderLoadingState()
  }

  if (_error && !_data) {
    return _renderErrorState()
  }

  return _renderContent()
  // #endregion
}
// #endregion

// #region Styles
const $root: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.md,
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
// #endregion
