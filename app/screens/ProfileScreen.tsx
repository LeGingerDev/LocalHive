import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator } from "react-native"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { ProfileBox } from "@/components/profiles"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
// import { useNavigation } from "@react-navigation/native"

// #region Types & Interfaces
interface ProfileScreenProps extends AppStackScreenProps<"Profile"> {}

// Keeping the defensive structure, but data is not used for this simple screen
interface ProfileData {
  id?: string
  name?: string
}

interface ProfileError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
/**
 * ProfileScreen - Defensive structure, simple UI
 */
export const ProfileScreen: FC<ProfileScreenProps> = () => {
  // #region Private State Variables
  const [_isLoading, setIsLoading] = useState<boolean>(false)
  const [_error, setError] = useState<ProfileError | null>(null)
  // #endregion

  // #region Hooks & Context
  const { themed } = useAppTheme()
  // const navigation = useNavigation<AppStackNavigationProp<"Profile">>()
  // #endregion

  // #region Render Helpers
  const _renderLoadingState = () => (
    <Screen style={themed($loadingContainer)} preset="fixed">
      <ActivityIndicator size="large" color={themed($activityIndicator).color} />
      <Text style={themed($loadingText)} text="Loading..." />
    </Screen>
  )

  const _renderErrorState = () => (
    <Screen style={themed($errorContainer)} preset="fixed">
      <Text style={themed($errorTitle)} text="Oops! Something went wrong" />
      <Text style={themed($errorMessage)} text={_error?.message ?? "Unknown error"} />
      {/* You could add a retry button here if needed */}
    </Screen>
  )

  const _renderContent = () => (
    <Screen style={themed($root)} preset="scroll">
      <ProfileBox />
    </Screen>
  )
  // #endregion

  // #region Main Render
  if (_isLoading) {
    return _renderLoadingState()
  }

  if (_error) {
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

const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})
// #endregion