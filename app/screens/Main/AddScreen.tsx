import React, { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, View, ImageStyle, ScrollView } from "react-native"

import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { useItemCategories } from "@/hooks/useItemCategories"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import type { BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { ItemService } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
// import { useNavigation } from "@react-navigation/native"

// #region Types & Interfaces
interface AddScreenProps extends BottomTabScreenProps<"Add"> {}

interface AddData {
  // TODO: Define your data structure here
  id?: string
  name?: string
}

interface AddError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
/**
 * AddScreen - A defensive screen with proper error handling and loading states
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
export const AddScreen: FC<AddScreenProps> = ({ route }) => {
  // #region Private State Variables
  const groupIdFromParams = route.params?.groupId as string | undefined
  const [_isLoading, setIsLoading] = useState<boolean>(true)
  const [_data, setData] = useState<AddData | null>(null)
  const [_error, setError] = useState<AddError | null>(null)
  const [_isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const { themed, theme } = useAppTheme()
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const { categories, loading: categoriesLoading, error: categoriesError } = useItemCategories()
  const { user } = useAuth()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupIdFromParams ?? null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)

  // Select group from params if provided, else first group by default when loaded
  useEffect(() => {
    if (!groupsLoading && groups.length > 0) {
      if (groupIdFromParams && groups.some((g) => g.id === groupIdFromParams)) {
        setSelectedGroupId(groupIdFromParams)
      } else if (!selectedGroupId) {
        setSelectedGroupId(groups[0].id)
      }
    }
  }, [groupsLoading, groups, groupIdFromParams, selectedGroupId])
  // #endregion

  // #region Hooks & Context
  // const navigation = useNavigation<AppStackNavigationProp<"Add">>()
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
      const mockData: AddData = {
        id: "1",
        name: "add data",
      }

      setData(mockData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError({ message: errorMessage })
      console.error("[AddScreen] Error fetching data:", error)
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

  const _handleSave = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError({ message: "User not authenticated" })
      return
    }

    if (!selectedGroupId || !title.trim() || !selectedCategory) {
      setError({ message: "Please fill in all required fields (Title, Category, and Group)" })
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { data, error: createError } = await ItemService.createItem({
        group_id: selectedGroupId,
        user_id: user.id,
        title: title.trim(),
        category: selectedCategory,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (createError) {
        throw new Error(createError.message)
      }

      if (data) {
        console.log("Item created successfully:", data)
        setShowSuccess(true)
        // Clear the form
        setTitle("")
        setLocation("")
        setNotes("")
        setSelectedCategory(null)

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save item"
      setError({ message: errorMessage })
      console.error("[AddScreen] Error saving item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.id, selectedGroupId, title, selectedCategory, location, notes])
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
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      style={themed($root)}
      contentContainerStyle={{ paddingBottom: spacing.xl * 3 + spacing.md }}
    >
      <HeaderSection themed={themed} onCancel={() => {}} />
      <ScrollView
        contentContainerStyle={themed($formContentWithTopMargin)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add to group */}
        <Text style={themed($label)} text="Add to group" />
        {groupsLoading ? (
          <ActivityIndicator size="small" color={theme.colors.tint} style={{ marginBottom: 16 }} />
        ) : (
          <CustomDropdown
            options={groups.map((g) => ({ label: g.name, value: g.id }))}
            value={selectedGroupId}
            onChange={setSelectedGroupId}
            placeholder={groups.length === 0 ? "No groups found" : "Select group..."}
            style={themed($pickerContainer)}
          />
        )}
        {/* Title */}
        <Text style={themed($label)} text="Title *" />
        <TextField
          placeholder="e.g. Fresh German Bread, Paracetamol, Dr"
          style={themed($input)}
          containerStyle={themed($inputContainerFlat)}
          value={title}
          onChangeText={setTitle}
        />
        {/* Category */}
        <Text style={themed($label)} text="Category *" />
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={theme.colors.tint} style={{ marginBottom: 16 }} />
        ) : (
          <CustomDropdown
            options={categories.map((cat) => ({ label: cat.label, value: cat.value }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Select a category..."
            style={themed($pickerContainer)}
          />
        )}
        <Text
          style={themed($categoryHint)}
          text="AI will suggest the best category based on your title"
        />
        {/* Location */}
        <Text style={themed($label)} text="Location" />
        <TextField
          placeholder="e.g. Kaufland Hauptstraße, ..."
          style={themed($input)}
          containerStyle={themed($inputContainerFlat)}
          value={location}
          onChangeText={setLocation}
        />
        <Text style={themed($locationLink)} text="Use current location" onPress={() => {}} />
        {/* Photo Picker */}
        <Text style={themed($label)} text="Photo" />
        <View style={themed($photoBox)}>
          <Icon icon="menu" size={32} style={themed($photoIcon)} />
          <Text style={themed($photoText)} text="Add a photo to help others find this item" />
          <View style={themed($photoButtonRow)}>
            <Button text="Take Photo" style={themed($photoButton)} onPress={() => {}} />
            <Button text="Gallery" style={themed($photoButton)} onPress={() => {}} />
          </View>
        </View>
        {/* Notes */}
        <Text style={themed($label)} text="Notes" />
        <TextField
          placeholder="Any helpful details... opening hours, specific location within store, tips, etc."
          style={themed($input)}
          containerStyle={themed($inputContainerFlat)}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <Text
          style={themed($notesHint)}
          text="The more details you add, the more helpful it is for your group"
        />
        {/* Quick Suggestions */}
        <Text style={themed($quickSuggestionsLabel)} text="Quick suggestions" />
        <View style={themed($quickSuggestionsRow)}>
          <QuickSuggestion themed={themed} icon="menu" label="Add address" />
          <QuickSuggestion themed={themed} icon="clock" label="Opening hours" />
          <QuickSuggestion themed={themed} icon="check" label="Price range" />
          <QuickSuggestion themed={themed} icon="phone" label="Phone number" />
          <QuickSuggestion themed={themed} icon="view" label="Website" />
        </View>
        {/* Success Message */}
        {showSuccess && (
          <View style={themed($successMessage)}>
            <Text style={themed($successText)} text="Item created successfully! 🎉" />
          </View>
        )}

        {/* Action Buttons */}
        <View style={themed($buttonRow)}>
          <CustomGradient preset="primary" style={themed($gradientButton)}>
            <Button
              text={isSubmitting ? "Saving..." : "Save"}
              textStyle={themed($gradientButtonTextWhite)}
              style={themed($gradientButtonInner)}
              onPress={_handleSave}
              preset="reversed"
              disabled={isSubmitting || !selectedGroupId || !title.trim() || !selectedCategory}
            />
          </CustomGradient>
          <Button
            text="Cancel"
            style={themed($cancelButtonRed)}
            textStyle={themed($cancelButtonTextRed)}
            onPress={() => {}}
            preset="default"
          />
        </View>
      </ScrollView>
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
const $root = ({ colors }: any): ViewStyle => ({ flex: 1, backgroundColor: colors.background })
const $label = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: colors.text,
  marginBottom: spacing.xs,
})
const $input = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: colors.text,
  paddingVertical: 10,
})
const $inputContainerFlat = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.sm,
  paddingHorizontal: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
})
const $pickerContainer = ({ spacing, colors }: any): ViewStyle => ({
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.border || colors.textDim,
  borderRadius: 12,
  backgroundColor: colors.input || colors.cardColor,
  overflow: "hidden",
  height: 56,
  justifyContent: "center",
})
const $headerRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.sm,
})
const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  flex: 1,
  textAlign: "center",
})
const $headerSpacer = (): ViewStyle => ({ width: 40 })
const $backButtonPlain = ({ spacing }: any): ViewStyle => ({
  marginRight: spacing.sm,
  paddingHorizontal: 12,
  paddingVertical: 12,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  minWidth: 48,
  minHeight: 48,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
})
const $formContentWithTopMargin = ({ spacing }: any): ViewStyle => ({
  flexGrow: 1,
  justifyContent: "flex-start",
  padding: spacing.lg,
  paddingTop: spacing.sm,
  gap: 6,
  paddingBottom: spacing.xl * 2,
})
const $buttonRow = ({ spacing }: any): ViewStyle => ({ marginTop: spacing.lg })
const $gradientButton = (): ViewStyle => ({ borderRadius: 16, overflow: "hidden", marginBottom: 8 })
const $gradientButtonInner = (): ViewStyle => ({
  backgroundColor: "transparent",
  borderRadius: 16,
  minHeight: 48,
})
const $gradientButtonTextWhite = ({ typography }: any): TextStyle => ({
  color: "#fff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
})
const $cancelButtonRed = ({ spacing, colors }: any): ViewStyle => ({
  backgroundColor: colors.error || "#d32f2f",
  borderRadius: 16,
  minHeight: 48,
  marginTop: spacing.xs,
})
const $cancelButtonTextRed = ({ typography, colors }: any): TextStyle => ({
  color: "#fff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
})
// Keep or adapt the following for AddScreen-specific needs
const $categoryHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.md,
})
const $locationLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  fontSize: 12,
  marginLeft: spacing.sm,
  textDecorationLine: "underline",
  marginBottom: spacing.md,
})
const $photoBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  alignItems: "center",
  padding: spacing.lg,
  marginBottom: spacing.md,
  backgroundColor: colors.cardColor,
})
const $photoIcon: ThemedStyle<ImageStyle> = ({ colors }) => ({
  tintColor: colors.textDim,
  marginBottom: 8,
})
const $photoText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  marginBottom: spacing.sm,
  textAlign: "center",
})
const $photoButtonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
})
const $photoButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginHorizontal: spacing.xs,
})
const $notesHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.md,
})
const $quickSuggestionsLabel: ThemedStyle<TextStyle> = ({ typography, colors, spacing }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: colors.textDim,
  marginBottom: spacing.xs,
})
const $quickSuggestionsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: spacing.lg,
})
const $quickSuggestion: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.cardColor,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  marginRight: spacing.xs,
  marginBottom: spacing.xs,
})
const $quickSuggestionIcon: ThemedStyle<ImageStyle> = ({ colors }) => ({
  tintColor: colors.textDim,
  marginRight: 4,
})
const $quickSuggestionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
})
// #endregion

// Move subcomponents above AddScreen and pass themed as a prop from within AddScreen
const HeaderSection = ({ themed, onCancel }: { themed: any; onCancel: () => void }) => (
  <View style={themed($headerRow)}>
    <Button
      LeftAccessory={() => <Icon icon="back" size={22} />}
      style={themed($backButtonPlain)}
      onPress={onCancel}
      preset="default"
    />
    <Text style={themed($headerTitle)} text="Add New Item" />
    <View style={themed($headerSpacer)} />
  </View>
)

const QuickSuggestion = ({ themed, icon, label }: { themed: any; icon: string; label: string }) => (
  <View style={themed($quickSuggestion)}>
    <Icon icon={icon as any} size={20} style={themed($quickSuggestionIcon)} />
    <Text style={themed($quickSuggestionText)} text={label} />
  </View>
)

// Add these styles at the bottom
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

const $successMessage: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.success,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.md,
  alignItems: "center",
})

const $successText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 16,
})
// #endregion
