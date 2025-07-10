import React, { ReactNode } from "react";
import { FC, memo, useCallback, useMemo } from "react"
import { StyleProp, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"
import { CatalogCard } from "./CatalogCard"

// #region Types & Interfaces
export interface CatalogCardData {
  id: string
  title: string
  itemCount: number
}

export interface CatalogsSectionProps {
  style?: StyleProp<ViewStyle>
  data?: CatalogCardData[] | null
  isLoading?: boolean
  error?: string | null
  onPress?: () => void
  onRetry?: () => void
  testID?: string
}
// #endregion

// #region Component
export const CatalogsSection: FC<CatalogsSectionProps> = memo((props) => {
  const {
    style,
    data = [],
    isLoading = false,
    error = null,
    onPress,
    onRetry,
    testID = "catalogsSectionComponent"
  } = props

  const { themed } = useAppTheme()

  const _containerStyles = useMemo(() => [
    themed($container),
    style
  ], [themed, style])

  const _handleRetry = useCallback((): void => {
    if (onRetry) {
      onRetry()
    }
  }, [onRetry])

  const _renderLoadingState = (): React.ReactNode => (
    <View style={_containerStyles} testID={`${testID}_loading`}>
      <ActivityIndicator 
        size="small" 
        color={themed($activityIndicatorColor).color}
        style={themed($loadingIndicator)}
      />
      <Text 
        style={themed($loadingText)} 
        text="Loading..."
        testID={`${testID}_loadingText`}
      />
    </View>
  )

  const _renderErrorState = (): React.ReactNode => (
    <View style={_containerStyles} testID={`${testID}_error`}>
      <Text 
        style={themed($errorText)} 
        text={error ?? "Something went wrong"}
        testID={`${testID}_errorText`}
      />
      {onRetry && (
        <Text 
          style={themed($retryButton)} 
          text="Retry"
          onPress={_handleRetry}
          testID={`${testID}_retryButton`}
        />
      )}
    </View>
  )

  const _renderContent = (): React.ReactNode => (
    <View style={_containerStyles} testID={testID}>
      <Text style={themed($title)} text="Catalogs" testID={`${testID}_title`} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {data && data.length > 0 ? (
          data.map((catalog) => (
            <CatalogCard key={catalog.id} data={catalog} />
          ))
        ) : (
          <Text style={themed($emptyText)} text="No catalogs available" testID={`${testID}_emptyText`} />
        )}
      </View>
    </View>
  )

  if (isLoading) return _renderLoadingState()
  if (error) return _renderErrorState()
  return _renderContent()
})

CatalogsSection.displayName = "CatalogsSection"
// #region Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  backgroundColor: colors.background,
  borderRadius: 8,
  marginBottom: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $loadingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $retryButton: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.tint,
  textAlign: "center",
  textDecorationLine: "underline",
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  fontStyle: "italic",
})

const $activityIndicator: ThemedStyle<ViewStyle> = () => ({})
const $activityIndicatorColor: ThemedStyle<{ color: string }> = ({ colors }) => ({ color: colors.tint })
// #endregion