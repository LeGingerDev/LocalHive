import React, { FC, useState, useEffect, useCallback } from "react"
import {
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  ImageStyle,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { useItemCategories } from "@/hooks/useItemCategories"
import { useSubscription } from "@/hooks/useSubscription"
import { AppStackParamList } from "@/navigators/AppNavigator"
import { navigate } from "@/navigators/navigationUtilities"
import { cameraService } from "@/services/cameraService"
import { HapticService } from "@/services/hapticService"
import { ItemService, ItemWithProfile } from "@/services/supabase/itemService"
import { supabase } from "@/services/supabase/supabase"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

const windowHeight = Dimensions.get("window").height
const estimatedContentHeight = 450
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0)

// #region Types & Interfaces
interface EditItemScreenRouteParams {
  item: ItemWithProfile
  returnScreen?: string
  returnParams?: any
}

interface EditData {
  id?: string
  name?: string
}

interface EditError {
  message: string
  code?: string
}
// #endregion

// #region Screen Component
/**
 * EditItemScreen - A screen for editing existing items
 *
 * Features:
 * - Pre-populated form with existing item data
 * - Same layout as AddScreen for consistency
 * - Image picker without modal conflicts
 * - Form validation and error handling
 * - Navigation back to previous screen on save
 */
export const EditItemScreen: FC<NativeStackScreenProps<AppStackParamList, "EditItem">> = ({
  route,
  navigation,
}) => {
  // #region Private State Variables
  const [_isLoading, setIsLoading] = useState<boolean>(false)
  const [_data, setData] = useState<EditData | null>(null)
  const [_error, setError] = useState<EditError | null>(null)
  const [_isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const { themed, theme } = useAppTheme()
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const { categories, loading: categoriesLoading, error: categoriesError } = useItemCategories()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)

  // Get item from route params
  const item = route.params?.item as ItemWithProfile
  const returnScreen = route.params?.returnScreen as string | undefined
  const returnParams = route.params?.returnParams as any

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(item?.group_id || null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(item?.category || null)
  const [title, setTitle] = useState<string>(item?.title || "")
  const [location, setLocation] = useState<string>(item?.location || "")
  const [notes, setNotes] = useState<string>(item?.details || "")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [photoUri, setPhotoUri] = useState<string | null>(item?.image_urls?.[0] || null)

  // Suggestion sections state
  const [showPhotoSection, setShowPhotoSection] = useState<boolean>(!!item?.image_urls?.length)
  const [showLocationSection, setShowLocationSection] = useState<boolean>(!!item?.location)
  const [showNotesSection, setShowNotesSection] = useState<boolean>(!!item?.details)

  // Category validation
  useEffect(() => {
    // If we have categories and a selected category, validate it
    if (categories.length > 0 && selectedCategory) {
      const isValidCategory = categories.some((cat) => cat.value === selectedCategory)
      if (!isValidCategory) {
        console.warn("[EditItemScreen] Invalid category found:", selectedCategory)
        // Reset to null if invalid
        setSelectedCategory(null)
      }
    }
  }, [categories, selectedCategory])

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )

  // #endregion

  // #region Data Fetching Functions
  const _fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      // No additional data fetching needed for edit mode
      setIsLoading(false)
      setIsRefreshing(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError({ message: errorMessage })
      console.error("[EditItemScreen] Error fetching data:", error)
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
    if (!user?.id || !item) {
      setError({ message: "User not authenticated or item not found" })
      return
    }

    if (!selectedGroupId || !title.trim() || !selectedCategory) {
      setError({ message: "Please fill in all required fields (Title, Category, and Group)" })
      return
    }

    HapticService.medium()
    // Show confirmation alert
    setAlertTitle("Save Changes")
    setAlertMessage(`Are you sure you want to save changes to "${title.trim()}"?`)
    setAlertConfirmStyle("default")
    setAlertVisible(true)
  }, [user?.id, item, selectedGroupId, title, selectedCategory, location, notes, photoUri])

  const handleConfirmSave = async () => {
    if (!item) return

    setIsSubmitting(true)
    try {
      // Prepare update data
      const updateData = {
        title: title.trim(),
        category: selectedCategory!,
        location: location.trim() || undefined,
        details: notes.trim() || undefined,
        image_urls: photoUri ? [photoUri] : [],
      }

      console.log("[EditItemScreen] Updating item with data:", updateData)

      const { data: updatedItem, error } = await ItemService.updateItem(item.id, updateData)

      if (error) {
        console.error("[EditItemScreen] Error updating item:", error)
        setAlertTitle("Error")
        setAlertMessage("Failed to update item. Please try again.")
        setAlertConfirmStyle("destructive")
        setAlertVisible(true)
        return
      }

      if (updatedItem) {
        console.log("[EditItemScreen] Item updated successfully:", updatedItem)
        HapticService.success()

        // Navigate back to previous screen
        navigation.goBack()
      }
    } catch (error) {
      console.error("[EditItemScreen] Exception while updating item:", error)
      setAlertTitle("Error")
      setAlertMessage("An unexpected error occurred. Please try again.")
      setAlertConfirmStyle("destructive")
      setAlertVisible(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearForm = () => {
    setTitle(item?.title || "")
    setSelectedCategory(item?.category || null)
    setLocation(item?.location || "")
    setNotes(item?.details || "")
    setPhotoUri(item?.image_urls?.[0] || null)
    setShowLocationSection(!!item?.location)
    setShowNotesSection(!!item?.details)
    setShowPhotoSection(!!item?.image_urls?.length)
  }

  const handleTakePhoto = async () => {
    HapticService.light()
    try {
      const result = await cameraService.takePhoto({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result && result.uri) {
        console.log("Camera image dimensions:", result.width, result.height)
        // Compress the image to quality 0.6
        const compressed = await cameraService.compressImage(result.uri, 0.6, 1024, 1024)
        console.log("Compressed camera image dimensions:", compressed.width, compressed.height)
        setPhotoUri(compressed.compressedUri)
      }
    } catch (error) {
      setAlertTitle("Camera Error")
      setAlertMessage(error instanceof Error ? error.message : "Could not open camera.")
      setAlertConfirmStyle("destructive")
      setAlertVisible(true)
    }
  }

  const handlePickFromGallery = async () => {
    HapticService.light()
    try {
      const result = await cameraService.pickFromGallery({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result && result.uri) {
        console.log("Gallery image dimensions:", result.width, result.height)
        // Compress the image to quality 0.6
        const compressed = await cameraService.compressImage(result.uri, 0.6, 1024, 1024)
        console.log("Compressed gallery image dimensions:", compressed.width, compressed.height)
        setPhotoUri(compressed.compressedUri)
      }
    } catch (error) {
      setAlertTitle("Gallery Error")
      setAlertMessage(error instanceof Error ? error.message : "Could not open gallery.")
      setAlertConfirmStyle("destructive")
      setAlertVisible(true)
    }
  }

  // #endregion

  // #region Render Methods
  const _renderLoadingState = (): React.JSX.Element => (
    <View style={themed($loadingContainer)}>
      <ActivityIndicator size="large" color={theme.colors.tint} />
      <Text style={themed($loadingText)} text="Loading..." />
    </View>
  )

  const _renderErrorState = (): React.JSX.Element => (
    <View style={themed($errorContainer)}>
      <Text style={themed($errorTitle)} text="Error" />
      <Text style={themed($errorMessage)} text={_error?.message || "An error occurred"} />
      <Button text="Retry" onPress={_handleRetry} style={themed($retryButton)} />
    </View>
  )

  const _renderContent = (): React.JSX.Element => (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={themed($root)}>
      <Header
        title="Edit Item"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightAction={{
          text: "Save",
          onPress: _handleSave,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          ...themed($formContentWithTopMargin),
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl * 4,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Group selection - Read only since we can't change groups */}
        <Text style={themed($label)} text="Group" />
        <CustomDropdown
          options={groups.map((g) => ({ label: g.name, value: g.id }))}
          value={selectedGroupId}
          onChange={() => {}} // No-op since it's read-only
          placeholder="Select group..."
          style={themed($pickerContainer)}
          disabled={true}
        />

        {/* Title */}
        <Text style={themed($label)} text="Title *" />
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="Enter item title"
          style={themed($input)}
          containerStyle={themed($inputContainerFlat)}
        />

        {/* Category */}
        <Text style={themed($label)} text="Category *" />
        <CustomDropdown
          options={categories.map((cat) => ({ label: cat.label, value: cat.value }))}
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
          placeholder="Select category"
          style={themed($pickerContainer)}
        />

        {/* Photo Section - Injected when Add Photo is clicked */}
        {showPhotoSection && (
          <>
            <Text style={themed($label)} text="Photo" />
            <View style={[themed($photoBox), { width: "100%", alignSelf: "stretch" }]}>
              {photoUri ? (
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: 8,
                    overflow: "hidden",
                    borderWidth: 3,
                    borderColor: "#fff",
                    marginBottom: 12,
                  }}
                >
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <>
                  <Icon icon="menu" size={32} style={themed($photoIcon)} />
                  <Text
                    style={themed($photoText)}
                    text="Add a photo to help others find this item"
                  />
                </>
              )}
              <View
                style={[
                  themed($photoButtonRow),
                  {
                    width: "100%",
                    alignSelf: "stretch",
                    flexDirection: "row",
                    gap: spacing.xs,
                  },
                ]}
              >
                <Button
                  text="Take Photo"
                  style={[themed($photoButton), { flex: 1 }]}
                  onPress={handleTakePhoto}
                  disabled={isSubmitting}
                />
                <Button
                  text="Gallery"
                  style={[themed($photoButton), { flex: 1 }]}
                  onPress={handlePickFromGallery}
                  disabled={isSubmitting}
                />
              </View>
            </View>
          </>
        )}

        {/* Location Section - Injected when Add Location is clicked */}
        {showLocationSection && (
          <>
            <Text style={themed($label)} text="Location" />
            <TextField
              placeholder="e.g. Main Street Market, Downtown Mall, ..."
              style={themed($input)}
              containerStyle={themed($inputContainerFlat)}
              value={location}
              onChangeText={setLocation}
              editable={!isSubmitting}
            />
          </>
        )}

        {/* Notes Section - Injected when Add Notes is clicked */}
        {showNotesSection && (
          <>
            <Text style={themed($label)} text="Notes" />
            <TextField
              placeholder="Any helpful details... opening hours, specific location within store, tips, etc."
              style={themed($input)}
              containerStyle={themed($inputContainerFlat)}
              multiline
              value={notes}
              onChangeText={setNotes}
              editable={!isSubmitting}
            />
            <Text
              style={themed($notesHint)}
              text="The more details you add, the more helpful it is for your group and AI recognition"
            />
          </>
        )}

        {/* Suggestions Section */}
        <Text style={themed($label)} text="Add More Details" />
        <View style={themed($suggestionsContainer)}>
          <View style={themed($suggestionsRow)}>
            {!showPhotoSection && (
              <TouchableOpacity
                style={[
                  themed($suggestionButton),
                  showPhotoSection && themed($suggestionButtonActive),
                ]}
                onPress={() => setShowPhotoSection(true)}
                disabled={isSubmitting}
              >
                <Text style={themed($suggestionButtonText)} text="Add Photo" />
              </TouchableOpacity>
            )}
            {!showLocationSection && (
              <TouchableOpacity
                style={[
                  themed($suggestionButton),
                  showLocationSection && themed($suggestionButtonActive),
                ]}
                onPress={() => setShowLocationSection(true)}
                disabled={isSubmitting}
              >
                <Text style={themed($suggestionButtonText)} text="Add Location" />
              </TouchableOpacity>
            )}
          </View>
          <View style={themed($suggestionsRow)}>
            {!showNotesSection && (
              <TouchableOpacity
                style={[
                  themed($suggestionButton),
                  showNotesSection && themed($suggestionButtonActive),
                ]}
                onPress={() => setShowNotesSection(true)}
                disabled={isSubmitting}
              >
                <Text style={themed($suggestionButtonText)} text="Add Notes" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save button moved to header */}

      {/* Confirmation Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={() => setAlertVisible(false)}
        confirmStyle={alertConfirmStyle}
      />
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
const $suggestionsContainer = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.xs,
})
const $suggestionsRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})
const $suggestionButton = ({ colors, spacing }: any): ViewStyle => ({
  flex: 1,
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  minHeight: 48,
  justifyContent: "center",
  alignItems: "center",
})
const $suggestionButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textAlign: "center",
})
const $photoButtonRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
})
const $photoButton = ({ spacing }: any): ViewStyle => ({
  flex: 1,
})
const $photoButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 14,
})
const $photoBox = ({ colors, spacing }: any): ViewStyle => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  alignItems: "center",
  padding: spacing.md,
  marginBottom: spacing.sm,
  backgroundColor: colors.cardColor,
})
const $photoText = ({ colors, spacing }: any): TextStyle => ({
  color: colors.textDim,
  fontSize: 13,
  marginBottom: spacing.sm,
  textAlign: "center",
})
const $photoIcon = ({ colors }: any): any => ({
  tintColor: colors.textDim,
  marginBottom: 8,
})
const $notesHint = ({ colors, spacing }: any): TextStyle => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.sm,
})
const $suggestionButtonActive = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})
const $buttonRow = ({ spacing }: any): ViewStyle => ({
  marginTop: spacing.xs,
  marginBottom: spacing.xl,
  paddingHorizontal: spacing.lg,
})
const $loadingContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.xl,
})
const $loadingText = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginTop: spacing.md,
})
const $errorContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.xl,
})
const $errorTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.error,
  marginBottom: spacing.sm,
})
const $errorMessage = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.lg,
})
const $retryButton = ({ colors, typography }: any): TextStyle => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  borderRadius: 8,
})
// #endregion
