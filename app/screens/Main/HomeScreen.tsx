import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, ScrollView, View, Text, Image, Dimensions } from "react-native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { supabase } from "@/services/supabase/supabase"
import { StorageService } from "@/services/supabase/storageService"
import { Button } from "@/components/Button"

const windowHeight = Dimensions.get("window").height;
const estimatedContentHeight = 250;
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0);

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
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
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
  // #endregion

  // #region Lifecycle Effects
  useEffect(() => {
    let isMounted = true
    const loadData = async () => { if (isMounted) { await fetchData() } }
    loadData()
    return () => { isMounted = false }
  }, [fetchData])

  useEffect(() => {
    fetch('https://xnnobyeytyycngybinqj.supabase.co')
      .then(res => console.log('Supabase reachable:', res.status))
      .catch(err => console.error('Supabase NOT reachable:', err));
  }, []);
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

  const handleUploadStaticImage = async () => {
    try {
      // Use a small static image from assets
      const staticImage = require("../../../assets/images/logo.png")
      // Get the URI for the static image
      const uri = Image.resolveAssetSource(staticImage).uri
      console.log("Static image URI:", uri)
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileName = `test-logo-${Date.now()}.png`
      const filePath = `test/${fileName}`
      console.log("Uploading static image to:", filePath)
      const uploadResult = await StorageService.uploadImage(filePath, blob, { upsert: true, contentType: "image/png" })
      console.log("Static image upload result:", uploadResult)
      alert("Upload success! File path: " + filePath)
    } catch (error) {
      console.error("Static image upload exception:", error)
      alert("Upload exception: " + error)
    }
  }

  const handleUploadGoogleLogo = async () => {
    try {
      // 1. Download the image as a blob
      const imageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
      console.log("Downloading Google logo from:", imageUrl)
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // 2. Prepare the upload URL and headers
      const supabaseUrl = "https://xnnobyeytyycngybinqj.supabase.co"
      const bucket = "items"
      const filePath = `test/googlelogo-${Date.now()}.png`
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhubm9ieWV5dHl5Y25neWJpbnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjEyMDQsImV4cCI6MjA2NzIzNzIwNH0.bBO9iuzsMU1xUq_EJAi6esjWb0Jm1Arj2mQfXXqIEKw"

      console.log("Uploading Google logo to:", filePath)
      console.log("Upload URL:", uploadUrl)

      // 3. Upload using fetch
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'image/png',
        },
        body: blob,
      })

      console.log("Upload response status:", uploadResponse.status)
      const result = await uploadResponse.text()
      console.log("Upload response:", result)

      if (uploadResponse.ok) {
        alert("Upload success! File path: " + filePath)
      } else {
        throw new Error(`Upload failed: ${uploadResponse.status} - ${result}`)
      }
    } catch (error) {
      console.error("Google logo upload exception:", error)
      alert("Upload exception: " + error)
    }
  }

  const renderContent = (): React.JSX.Element => (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top"]}>
      <Header title="Home" />
      <View style={themed($emptyStateContainer)}>
        <View style={themed($emptyState)}>
          <Image
            source={require("../../../assets/Visu/Visu_Searching.png")}
            style={{ width: 160, height: 160, resizeMode: "contain", marginBottom: spacing.lg }}
            accessibilityLabel="Home not ready illustration"
          />
                  <Text style={themed($emptyStateTitle)}>Home isn't ready yet</Text>
        <Text style={themed($emptyStateText)}>This feature is coming soon!</Text>
        <Button text="Test Upload Static Image" onPress={handleUploadStaticImage} style={{ marginTop: 24 }} />
        <Button text="Test Upload Google Logo" onPress={handleUploadGoogleLogo} style={{ marginTop: 12 }} />
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
// #endregion
