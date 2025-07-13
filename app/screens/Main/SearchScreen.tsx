import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, ScrollView } from "react-native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
interface SearchScreenProps extends BottomTabScreenProps<"Search"> {}

interface SearchData {
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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [data, setData] = useState<SearchData | null>(null)
  const [error, setError] = useState<SearchError | null>(null)
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  // #endregion

  // #region Data Fetching Functions
  const fetchData = useCallback(async (): Promise<void> => {
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
    }
  }, [])

  const handleRetry = useCallback((): void => {
    setIsLoading(true)
    setError(null)
    fetchData()
  }, [fetchData])
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

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [fetchData])
  // #endregion

  // #region Render Helpers
  const renderLoadingState = (): React.JSX.Element => (
    <Screen style={themed($loadingContainer)} preset="fixed">
      <ActivityIndicator size="large" color={themed($activityIndicator).color} />
      <Text style={themed($loadingText)} text="Loading..." />
    </Screen>
  )

  const renderErrorState = (): React.JSX.Element => (
    <Screen style={themed($errorContainer)} preset="fixed">
      <Text style={themed($errorTitle)} text="Oops! Something went wrong" />
      <Text style={themed($errorMessage)} text={error?.message ?? "Unknown error"} />
      <Text style={themed($retryButton)} text="Tap to retry" onPress={handleRetry} />
    </Screen>
  )

  const renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header title="Search" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}
      >
        {data && (
          <>
            <Text style={themed($dataText)} text={`ID: ${data.id ?? "N/A"}`} />
            <Text style={themed($dataText)} text={`Name: ${data.name ?? "N/A"}`} />
          </>
        )}
        {/* TODO: Add your actual content here */}
      </ScrollView>
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
const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
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
// #endregion
