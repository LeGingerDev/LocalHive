import React, { useState, useEffect, useRef } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Icon } from "@/components/Icon"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { cameraService } from "@/services/cameraService"
import { HapticService } from "@/services/hapticService"
import { ItemService, ItemWithProfile } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface EditItemModalProps {
  visible: boolean
  item: ItemWithProfile | null
  onClose: () => void
  onSuccess: (updatedItem: ItemWithProfile) => void
}

export const EditItemModal = ({ visible, item, onClose, onSuccess }: EditItemModalProps) => {
  const { themed, theme } = useAppTheme()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showErrorAlert, setShowErrorAlert] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    notes: "",
  })

  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showLocationSection, setShowLocationSection] = useState(false)
  const [showNotesSection, setShowNotesSection] = useState(false)
  const [showPhotoSection, setShowPhotoSection] = useState(false)

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        category: item.category || "",
        location: item.location || "",
        notes: item.details || "",
      })
      setImageUrls(item.image_urls || [])
      setShowLocationSection(!!item.location)
      setShowNotesSection(!!item.details)
      setShowPhotoSection(!!item.image_urls?.length)
    }
  }, [item])

  // Helper function to check if form is valid
  const isFormValid = (): boolean => {
    return !!formData.title.trim() && !!formData.category
  }

  const handleSaveItem = async () => {
    if (!isFormValid() || !item) {
      return
    }
    setLoading(true)
    try {
      const updateData = {
        title: formData.title.trim(),
        category: formData.category,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        media_urls: imageUrls,
      }

      console.log("[EditItemModal] Saving item with data:", updateData)

      const { data: updatedItem, error } = await ItemService.updateItem(item.id, updateData)

      if (error) {
        console.error("Error updating item:", error)
        setErrorMessage("Failed to update item. Please try again.")
        setShowErrorAlert(true)
        return
      }

      if (updatedItem) {
        console.log("[EditItemModal] Item updated successfully:", updatedItem)
        HapticService.success()
        onSuccess(updatedItem)
        onClose()
      } else {
        setErrorMessage("Failed to update item. Please try again.")
        setShowErrorAlert(true)
      }
    } catch (e) {
      console.error("Error in handleSaveItem:", e)
      setErrorMessage("An unexpected error occurred. Please try again.")
      setShowErrorAlert(true)
    } finally {
      setLoading(false)
    }
  }

  const handleTakePhoto = async () => {
    try {
      const result = await cameraService.takePhoto({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result && result.uri) {
        setImageUrls([result.uri]) // Only allow 1 image
        HapticService.success()
      }
    } catch (error) {
      console.error("Error taking photo:", error)
    }
  }

  const handlePickFromGallery = async () => {
    try {
      const result = await cameraService.pickFromGallery({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result && result.uri) {
        setImageUrls([result.uri]) // Only allow 1 image
        HapticService.success()
      }
    } catch (error) {
      console.error("Error picking from gallery:", error)
    }
  }

  const itemCategories = [
    { value: "food", label: "Food" },
    { value: "drinks", label: "Drinks" },
    { value: "household", label: "Household" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "health", label: "Health" },
    { value: "beauty", label: "Beauty" },
    { value: "books", label: "Books" },
    { value: "sports", label: "Sports" },
    { value: "toys", label: "Toys" },
    { value: "automotive", label: "Automotive" },
    { value: "garden", label: "Garden" },
    { value: "office", label: "Office" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ]

  if (!item) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={themed($root)}>
        <KeyboardAvoidingView
          style={themed($root)}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={themed($header)}>
            <TouchableOpacity style={themed($closeButton)} onPress={onClose} activeOpacity={0.7}>
              <Icon icon="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={themed($headerTitle)} text="Edit Item" />
            <TouchableOpacity
              style={themed($saveButton)}
              onPress={handleSaveItem}
              disabled={!isFormValid() || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Text style={themed($saveButtonText)} text="Save" />
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={themed($formContent)} showsVerticalScrollIndicator={false}>
            <Text style={themed($label)} text="Title" />
            <TextField
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter item title"
              style={themed($input)}
              containerStyle={themed($inputContainerFlat)}
            />

            <Text style={themed($label)} text="Category" />
            <CustomDropdown
              options={itemCategories}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              placeholder="Select category"
              style={themed($pickerContainer)}
            />

            {/* Location Section - Injected when Add Location is clicked */}
            {showLocationSection && (
              <>
                <Text style={themed($label)} text="Location" />
                <TextField
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="e.g. Main Street Market, Downtown Mall, ..."
                  style={themed($input)}
                  containerStyle={themed($inputContainerFlat)}
                />
              </>
            )}

            {/* Notes Section - Injected when Add Notes is clicked */}
            {showNotesSection && (
              <>
                <Text style={themed($label)} text="Notes" />
                <TextField
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Any helpful details... opening hours, specific location within store, tips, etc."
                  multiline
                  numberOfLines={4}
                  style={themed($input)}
                  containerStyle={themed($inputContainerFlat)}
                />
              </>
            )}

            {/* Photo Section - Injected when Add Photo is clicked */}
            {showPhotoSection && (
              <>
                <Text style={themed($label)} text="Add Photo" />
                <View style={themed($photoBox)}>
                  {imageUrls.length > 0 ? (
                    <View style={themed($imageContainer)}>
                      <Image
                        source={{ uri: imageUrls[0] }}
                        style={themed($currentImage)}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={themed($removeImageButton)}
                        onPress={() => setImageUrls([])}
                        activeOpacity={0.8}
                      >
                        <Icon icon="x" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
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
                  <View style={themed($photoButtonRow)}>
                    <TouchableOpacity
                      style={themed($photoButton)}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Text style={themed($photoButtonText)} text="Take Photo" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={themed($photoButton)}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <Text style={themed($photoButtonText)} text="Gallery" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Suggestions Section */}
            <Text style={themed($label)} text="Add More Details" />
            <View style={themed($suggestionsContainer)}>
              <View style={themed($suggestionsRow)}>
                {!showPhotoSection && imageUrls.length === 0 && (
                  <TouchableOpacity
                    style={themed($suggestionButton)}
                    onPress={() => setShowPhotoSection(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Photo" />
                  </TouchableOpacity>
                )}
                {!showLocationSection && !formData.location && (
                  <TouchableOpacity
                    style={themed($suggestionButton)}
                    onPress={() => setShowLocationSection(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Location" />
                  </TouchableOpacity>
                )}
                {!showNotesSection && !formData.notes && (
                  <TouchableOpacity
                    style={themed($suggestionButton)}
                    onPress={() => setShowNotesSection(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={themed($suggestionButtonText)} text="Add Notes" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Error Alert */}
        <CustomAlert
          visible={showErrorAlert}
          title="Error"
          message={errorMessage}
          confirmText="OK"
          onConfirm={() => setShowErrorAlert(false)}
        />
      </View>
    </Modal>
  )
}

const $root = ({ colors }: any): ViewStyle => ({ flex: 1, backgroundColor: colors.background })

const $header = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
})

const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  ...typography.heading,
  color: colors.text,
  textAlign: "center",
})

const $saveButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
  borderRadius: 8,
  backgroundColor: "transparent",
})

const $saveButtonText = ({ typography, colors }: any): TextStyle => ({
  ...typography.button,
  color: colors.tint,
  fontWeight: "600",
})

const $formContent = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
})

const $label = ({ typography, colors }: any): TextStyle => ({
  ...typography.formLabel,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $input = ({ typography, colors }: any): TextStyle => ({
  ...typography.formInput,
  color: colors.text,
})

const $inputContainerFlat = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.sm,
  backgroundColor: "transparent",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
})

const $pickerContainer = ({ spacing, colors }: any): ViewStyle => ({
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 8,
  backgroundColor: colors.background,
})

const $sectionHeader = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.sm,
})

const $sectionTitle = ({ typography, colors }: any): TextStyle => ({
  ...typography.formLabel,
  color: colors.text,
})

const $sectionSubtitle = ({ typography, colors }: any): TextStyle => ({
  ...typography.formHelper,
  color: colors.textDim,
})

const $toggleButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
})

const $imageContainer = ({ spacing }: any): ViewStyle => ({
  position: "relative",
  width: 120,
  height: 120,
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: spacing.sm,
})

const $currentImage = (): any => ({
  width: "100%",
  height: "100%",
})

const $removeImageButton = (): ViewStyle => ({
  position: "absolute",
  top: 4,
  right: 4,
  backgroundColor: "rgba(0,0,0,0.6)",
  borderRadius: 12,
  width: 24,
  height: 24,
  alignItems: "center",
  justifyContent: "center",
})

const $photoButtonRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $photoButton = ({ colors, spacing }: any): ViewStyle => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 8,
  backgroundColor: colors.background,
})

const $photoButtonText = ({ typography, colors }: any): TextStyle => ({
  ...typography.formLabel,
  color: colors.text,
})

const $photoBox = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 120,
  marginBottom: spacing.sm,
})

const $photoIcon = ({ colors }: any): any => ({
  tintColor: colors.textDim,
  marginBottom: spacing.xs,
})

const $photoText = ({ colors, spacing }: any): TextStyle => ({
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.sm,
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
