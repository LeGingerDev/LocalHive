import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, ScrollView, View, Text, Image, Dimensions } from "react-native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

const windowHeight = Dimensions.get("window").height;
const estimatedContentHeight = 250;
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0);

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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockData: SearchData = { id: "1", name: "search data" }
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
    const loadData = async () => { if (isMounted) { await fetchData() } }
    loadData()
    return () => { isMounted = false }
  }, [fetchData])
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
      <Text style={themed($retryButton)} onPress={handleRetry}>{"Tap to retry"}</Text>
    </Screen>
  )

  const renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top"]}>
      <Header title="Search" />
      <View style={themed($emptyStateContainer)}>
        <View style={themed($emptyState)}>
          <Image
            source={require("../../../assets/Visu/Visu_Searching.png")}
            style={{ width: 160, height: 160, resizeMode: "contain", marginBottom: spacing.lg }}
            accessibilityLabel="Search not ready illustration"
          />
          <Text style={themed($emptyStateTitle)}>Search isn't ready yet</Text>
          <Text style={themed($emptyStateText)}>This feature is coming soon!</Text>
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
// #endregion
