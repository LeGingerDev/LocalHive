import React, { FC, useState, useEffect, useCallback, useRef } from "react"
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
import { useNavigation } from "@react-navigation/native"

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
import type { BottomTabScreenProps, BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { navigate } from "@/navigators/navigationUtilities"
import { cameraService } from "@/services/cameraService"
import { HapticService } from "@/services/hapticService"
import { ItemService } from "@/services/supabase/itemService"
import { reviewTrackingService } from "@/services/reviewTrackingService"
import { supabase } from "@/services/supabase/supabase"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

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
  const subscription = useSubscription(user?.id || null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupIdFromParams ?? null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  // Suggestion sections state
  const [showPhotoSection, setShowPhotoSection] = useState<boolean>(false)
  const [showLocationSection, setShowLocationSection] = useState<boolean>(false)
  const [showNotesSection, setShowNotesSection] = useState<boolean>(false)

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

  // Check subscription limits when screen loads
  useEffect(() => {
    if (
      user &&
      !subscription.loading &&
      subscription.subscriptionInfo &&
      !subscription.canCreateItemNow
    ) {
      setAlertTitle("Item Limit Reached")
      setAlertMessage("You've reached your item limit. Upgrade to Pro for unlimited items!")
      setAlertConfirmStyle("destructive")
      setAlertVisible(true)
    }
  }, [user, subscription.loading, subscription.subscriptionInfo, subscription.canCreateItemNow])

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

    HapticService.medium()
    // Show confirmation alert
    setAlertTitle("Save Item")
    setAlertMessage(`Are you sure you want to save "${title.trim()}" to your group?`)
    setAlertConfirmStyle("default")
    setAlertVisible(true)
  }, [user?.id, selectedGroupId, title, selectedCategory, location, notes])

  function sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-") // spaces to dashes
  }

  const _handleConfirmSave = useCallback(async (): Promise<void> => {
    try {
      setIsSubmitting(true)
      setError(null)
      setAlertVisible(false)

      // 1. Create the item (without image_urls)
      const { data: createdItem, error: createError } = await ItemService.createItem({
        group_id: selectedGroupId!,
        user_id: user!.id,
        title: title.trim(),
        category: selectedCategory!,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        media_urls: [],
      })

      if (createError || !createdItem) {
        throw new Error(createError?.message || "Failed to create item")
      }

      // 2. Trigger embedding generation asynchronously (don't wait for it)
      const triggerEmbedding = async () => {
        try {
          console.log("[AddScreen] Triggering embedding generation for item:", createdItem.id)
          const response = await fetch(
            `${Config.SUPABASE_URL}/functions/v1/generate-item-embedding`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${Config.SUPABASE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                item_id: createdItem.id,
                title: title.trim(),
                details: notes.trim() || undefined,
                category: selectedCategory!,
                location: location.trim() || undefined,
              }),
            },
          )

          if (response.ok) {
            console.log("[AddScreen] Embedding generation triggered successfully")
          } else {
            console.warn("[AddScreen] Embedding generation failed:", await response.text())
          }
        } catch (embeddingError) {
          console.warn("[AddScreen] Embedding generation error (non-blocking):", embeddingError)
        }
      }

      // Fire and forget - don't await this
      triggerEmbedding()

      let imageUrl: string | null = null
      if (photoUri) {
        // 3. Upload the image to Supabase Storage using direct fetch (same as working HomeScreen)
        const fileExt = photoUri.split(".").pop()?.split("?")[0] || "jpg"
        const fileName = sanitizeFileName(title.trim()) || "item"
        const filePath = `${createdItem.id}/${fileName}.${fileExt}`
        console.log("Uploading image (direct fetch):")
        console.log("photoUri:", photoUri)
        console.log("fileExt:", fileExt)
        console.log("fileName:", fileName)
        console.log("filePath:", filePath)

        const response = await fetch(photoUri)
        const blob = await response.blob()
        console.log("blob type:", blob.type, "blob size:", blob.size)

        try {
          // Use the same direct fetch method as HomeScreen (which works)
          const supabaseUrl = Config.SUPABASE_URL
          const bucket = "items"
          const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
          const anonKey = Config.SUPABASE_KEY

          console.log("Uploading to:", uploadUrl)

          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${anonKey}`,
              "Content-Type": blob.type || `image/${fileExt}`,
            },
            body: blob,
          })

          console.log("Upload response status:", uploadResponse.status)
          const result = await uploadResponse.text()
          console.log("Upload response:", result)

          if (uploadResponse.ok) {
            // Get the public URL using the same method as HomeScreen
            imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
            console.log("imageUrl:", imageUrl)
          } else {
            throw new Error(`Upload failed: ${uploadResponse.status} - ${result}`)
          }
        } catch (uploadError) {
          console.error("Upload exception:", uploadError)
          throw uploadError
        }
      }

      // 4. Update the item with the image URL
      if (imageUrl) {
        console.log("[AddScreen] Updating item with image URL:", imageUrl)
        const updateResult = await ItemService.updateItem(createdItem.id, {
          image_urls: [imageUrl],
        })
        console.log("[AddScreen] Update result:", updateResult)
        if (updateResult.error) {
          console.error("[AddScreen] Update error:", updateResult.error)
        }
      }

      // Clear the form
      setTitle("")
      setLocation("")
      setNotes("")
      setSelectedCategory(null)
      setPhotoUri(null)

      // Track item creation for review prompts
      await reviewTrackingService.trackItemCreated()

      // Show success modal
      setAlertTitle("Success!")
      setAlertMessage(`"${title.trim()}" has been added to your group successfully!`)
      setAlertConfirmStyle("success")
      setAlertVisible(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save item"
      setError({ message: errorMessage })
      console.error("[AddScreen] Error saving item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.id, selectedGroupId, title, selectedCategory, location, notes, photoUri])

  // Suggestion button handlers
  const handleAddPhoto = useCallback(() => {
    HapticService.light()
    setShowPhotoSection(true)
  }, [])

  const handleAddLocation = useCallback(() => {
    HapticService.light()
    setShowLocationSection(true)
  }, [])

  const handleAddNotes = useCallback(() => {
    HapticService.light()
    setShowNotesSection(true)
  }, [])

  // Clear form function
  const handleClearForm = useCallback(() => {
    HapticService.light()
    setTitle("")
    setSelectedCategory(null)
    setLocation("")
    setNotes("")
    setPhotoUri(null)
    setShowPhotoSection(false)
    setShowLocationSection(false)
    setShowNotesSection(false)
  }, [])

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
    const unsubscribe = navigation.addListener("focus", () => {
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

  // Handler for taking a photo
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

  // Handler for picking from gallery
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

  const _renderContent = (): React.JSX.Element => (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={themed($root)}>
      <Header
        title="Add Item"
        rightAction={{
          text: "Clear",
          onPress: handleClearForm,
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
              <Text
                style={themed($emptyStateText)}
                text="Create or join a group first before adding an item"
              />
              <CustomGradient preset="primary" style={{ borderRadius: 8, marginTop: spacing.md }}>
                <Button
                  text="Go to Groups"
                  style={{ backgroundColor: "transparent", borderRadius: 8 }}
                  textStyle={{
                    color: "#fff",
                    fontFamily: theme.typography.primary.medium,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                  onPress={() => navigation.navigate("Groups")}
                  preset="reversed"
                  disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              editable={!isSubmitting}
            />
            {/* Category */}
            <Text style={themed($label)} text="Category *" />
            {categoriesLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.tint}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <CustomDropdown
                options={categories.map((cat) => ({ label: cat.label, value: cat.value }))}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Select a category..."
                style={themed($pickerContainer)}
                disabled={isSubmitting}
              />
            )}

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
                    style={themed($suggestionButton)}
                    onPress={handleAddPhoto}
                    disabled={isSubmitting}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Photo" />
                  </TouchableOpacity>
                )}
                {!showLocationSection && (
                  <TouchableOpacity
                    style={themed($suggestionButton)}
                    onPress={handleAddLocation}
                    disabled={isSubmitting}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Location" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={themed($suggestionsRow)}>
                {!showNotesSection && (
                  <TouchableOpacity
                    style={themed($suggestionButton)}
                    onPress={handleAddNotes}
                    disabled={isSubmitting}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Notes" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
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

      {/* Upload Alert - Shows during submission */}
      <CustomAlert
        visible={isSubmitting}
        title="Saving Item"
        message="Please wait while we save your item and generate search embeddings. Don't leave this screen."
        confirmText="Please Wait..."
        onConfirm={() => {}} // No action needed, just prevents dismissal
        confirmStyle="default"
      />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText={
          alertConfirmStyle === "success"
            ? "OK"
            : alertTitle === "Item Limit Reached"
              ? "OK"
              : "Save"
        }
        cancelText={
          alertConfirmStyle === "success" || alertTitle === "Item Limit Reached"
            ? undefined
            : "Cancel"
        }
        confirmStyle={alertConfirmStyle}
        onConfirm={
          alertConfirmStyle === "success"
            ? () => {
                setAlertVisible(false)
                // Navigate back to the group if we came from a group
                if (groupIdFromParams) {
                  navigate("GroupDetail", { groupId: groupIdFromParams })
                }
              }
            : alertTitle === "Item Limit Reached"
              ? () => {
                  setAlertVisible(false)
                  navigation.goBack()
                }
              : _handleConfirmSave
        }
        onCancel={
          alertConfirmStyle === "success" || alertTitle === "Item Limit Reached"
            ? undefined
            : () => setAlertVisible(false)
        }
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
  marginTop: spacing.xs,
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
})
const $notesHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.sm,
})

// Suggestion section styles
const $suggestionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $suggestionsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $suggestionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
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

const $suggestionButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textAlign: "center",
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
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})
