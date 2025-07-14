import React, { FC, useState, useEffect, useCallback, useRef } from "react"
import { ViewStyle, TextStyle, ActivityIndicator, View, ImageStyle, ScrollView, Image, Dimensions } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { useItemCategories } from "@/hooks/useItemCategories"
import type { BottomTabScreenProps, BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { ItemService } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { useNavigation } from "@react-navigation/native"

const windowHeight = Dimensions.get("window").height
const estimatedContentHeight = 450 // Match GroupsScreen
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0)

// #region Types & Interfaces
// Extend AddScreen route params to include optional 'refresh' flag
interface AddScreenRouteParams {
  groupId?: string
  refresh?: boolean
}

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
export const AddScreen: FC<BottomTabScreenProps<"Add">> = ({ route, navigation }) => {
  // #region Private State Variables
  const groupIdFromParams = route.params?.groupId as string | undefined
  const [_isLoading, setIsLoading] = useState<boolean>(true)
  const [_data, setData] = useState<AddData | null>(null)
  const [_error, setError] = useState<AddError | null>(null)
  const [_isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const { themed, theme } = useAppTheme()
  const { groups, loading: groupsLoading, error: groupsError, refresh } = useGroups()
  const { categories, loading: categoriesLoading, error: categoriesError } = useItemCategories()
  const { user } = useAuth()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupIdFromParams ?? null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )

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
  // Remove any duplicate navigation declarations throughout the file. Only use the navigation prop from the component signature.
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

    // Show confirmation alert
    setAlertTitle("Save Item")
    setAlertMessage(`Are you sure you want to save "${title.trim()}" to your group?`)
    setAlertConfirmStyle("default")
    setAlertVisible(true)
  }, [user?.id, selectedGroupId, title, selectedCategory, location, notes])

  const _handleConfirmSave = useCallback(async (): Promise<void> => {
    try {
      setIsSubmitting(true)
      setError(null)
      setAlertVisible(false)

      const { data, error: createError } = await ItemService.createItem({
        group_id: selectedGroupId!,
        user_id: user!.id,
        title: title.trim(),
        category: selectedCategory!,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (createError) {
        throw new Error(createError.message)
      }

      if (data) {
        console.log("Item created successfully:", data)
        
        // Clear the form
        setTitle("")
        setLocation("")
        setNotes("")
        setSelectedCategory(null)

        // Show success modal
        setAlertTitle("Success!")
        setAlertMessage(`"${title.trim()}" has been added to your group successfully!`)
        setAlertConfirmStyle("success")
        setAlertVisible(true)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save item"
      setError({ message: errorMessage })
      console.error("[AddScreen] Error saving item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.id, selectedGroupId, title, selectedCategory, location, notes])

  // Helper function to check if form is valid
  const isFormValid = useCallback((): boolean => {
    return !!(selectedGroupId && title.trim() && selectedCategory)
  }, [selectedGroupId, title, selectedCategory])

  // Dynamic gradient button style with opacity
  const getGradientButtonStyle = useCallback((): ViewStyle => {
    return {
      ...themed($gradientButton),
      opacity: isFormValid() ? 1 : 0.5,
    }
  }, [themed, isFormValid])
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

  // Auto-refresh groups when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user && !groupsLoading) {
        refresh()
      }
    })

    return unsubscribe
  }, [navigation, user, groupsLoading, refresh])
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
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={themed($root)}>
      <Header title="Add Item" />
      <ScrollView
        contentContainerStyle={{
          ...themed($formContentWithTopMargin),
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl * 4,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add to group - Only show header and dropdown when groups exist */}
        {!groupsLoading && groups.length === 0 ? (
          <View style={themed($emptyStateContainer)}>
            <View style={themed($emptyState)}>
              <Image
                source={require("../../../assets/Visu/Visu_Shocked.png")}
                style={{ width: 160, height: 160, resizeMode: "contain", marginBottom: spacing.lg }}
                accessibilityLabel="No groups illustration"
              />
              <Text style={themed($emptyStateTitle)} text="No Groups Yet" />
              <Text style={themed($emptyStateText)} text="Create or join a group first before adding an item" />
              <CustomGradient preset="primary" style={{ borderRadius: 8, marginTop: spacing.md }}>
                <Button
                  text="Go to Groups"
                  style={{ backgroundColor: "transparent", borderRadius: 8 }}
                  textStyle={{ color: "#fff", fontFamily: theme.typography.primary.medium, fontSize: 16, textAlign: "center" }}
                  onPress={() => navigation.navigate("Groups")}
                  preset="reversed"
                />
              </CustomGradient>
            </View>
          </View>
        ) : groupsLoading ? (
          <ActivityIndicator size="small" color={theme.colors.tint} style={{ marginBottom: 16 }} />
        ) : (
          <>
            <Text style={themed($label)} text="Add to group" />
            <CustomDropdown
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              placeholder="Select group..."
              style={themed($pickerContainer)}
            />
          </>
        )}

        {/* Only show the rest of the form if there are groups AND a group is selected */}
        {!groupsLoading && groups.length > 0 && selectedGroupId && (
          <>
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
          </>
        )}

        {/* Action Buttons - Only show if there are groups AND a group is selected */}
        {!groupsLoading && groups.length > 0 && selectedGroupId && (
          <View style={themed($buttonRow)}>
            <CustomGradient preset="primary" style={getGradientButtonStyle()}>
              <Button
                text={isSubmitting ? "Saving..." : "Save"}
                textStyle={themed($gradientButtonTextWhite)}
                style={themed($gradientButtonInner)}
                onPress={_handleSave}
                preset="reversed"
                disabled={isSubmitting || !isFormValid()}
              />
            </CustomGradient>
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText={alertConfirmStyle === "success" ? "OK" : "Save"}
        cancelText={alertConfirmStyle === "success" ? undefined : "Cancel"}
        confirmStyle={alertConfirmStyle}
        onConfirm={alertConfirmStyle === "success" ? () => setAlertVisible(false) : _handleConfirmSave}
        onCancel={alertConfirmStyle === "success" ? undefined : () => setAlertVisible(false)}
      />
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
  marginBottom: spacing.xs,
  paddingHorizontal: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
})
const $pickerContainer = ({ spacing, colors }: any): ViewStyle => ({
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border || colors.textDim,
  borderRadius: 12,
  backgroundColor: colors.input || colors.cardColor,
  overflow: "hidden",
  height: 56,
  justifyContent: "center",
})
const $formContentWithTopMargin = ({ spacing }: any): ViewStyle => ({
  flexGrow: 1,
  justifyContent: "flex-start",
  padding: spacing.lg,
  gap: 4,
  paddingBottom: spacing.xl * 2,
})
const $buttonRow = ({ spacing }: any): ViewStyle => ({ 
  marginTop: spacing.md,
  marginBottom: spacing.xl,
})
const $gradientButton = (): ViewStyle => ({ borderRadius: 16, overflow: "hidden", marginBottom: 8 })
const $gradientButtonInner = (): ViewStyle => ({
  backgroundColor: "transparent",
  borderRadius: 16,
  minHeight: 48,
})
const $gradientButtonTextWhite = ({ typography }: any): TextStyle => ({
  color: "#fff",
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})
// Keep or adapt the following for AddScreen-specific needs
const $categoryHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.sm,
})
const $locationLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  fontSize: 12,
  marginLeft: spacing.sm,
  textDecorationLine: "underline",
  marginBottom: spacing.sm,
})
const $photoBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  alignItems: "center",
  padding: spacing.md,
  marginBottom: spacing.sm,
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
  marginBottom: spacing.sm,
})
// #endregion

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

const $createFirstGroupButton = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  marginTop: spacing.md,
})
const $createFirstGroupButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})
