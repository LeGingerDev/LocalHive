import React, { FC, useState } from "react"
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { profileAvatarService } from "@/services/profileAvatarService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
export interface AvatarUploadModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean

  /**
   * The user ID for the avatar upload
   */
  userId: string

  /**
   * Callback when modal is closed
   */
  onClose: () => void

  /**
   * Callback when avatar is successfully uploaded
   */
  onAvatarUploaded?: (avatarUrl: string) => Promise<void>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
// #endregion

// #region Component
/**
 * AvatarUploadModal - A modal for uploading profile avatars
 *
 * Features:
 * - Choose between camera and gallery
 * - Loading states during upload
 * - Error handling
 * - Success callbacks
 */
export const AvatarUploadModal: FC<AvatarUploadModalProps> = (props) => {
  const { visible, userId, onClose, onAvatarUploaded, testID = "avatarUploadModal" } = props

  const { themed } = useAppTheme()
  const [isUploading, setIsUploading] = useState(false)

  const handleTakePhoto = async () => {
    if (isUploading) return

    setIsUploading(true)
    try {
      const result = await profileAvatarService.takeAndUploadPhoto(userId)

      if (result.success && result.publicUrl) {
        // Wait for the callback to complete before closing
        if (onAvatarUploaded) {
          await onAvatarUploaded(result.publicUrl)
        }
        onClose()
      } else {
        Alert.alert("Upload Failed", result.error || "Failed to upload photo")
      }
    } catch (error) {
      console.error("[AvatarUploadModal] Take photo error:", error)
      Alert.alert("Error", "Failed to take photo")
    } finally {
      setIsUploading(false)
    }
  }

  const handlePickFromGallery = async () => {
    if (isUploading) return

    setIsUploading(true)
    try {
      const result = await profileAvatarService.pickAndUploadFromGallery(userId)

      if (result.success && result.publicUrl) {
        // Wait for the callback to complete before closing
        if (onAvatarUploaded) {
          await onAvatarUploaded(result.publicUrl)
        }
        onClose()
      } else {
        Alert.alert("Upload Failed", result.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("[AvatarUploadModal] Pick from gallery error:", error)
      Alert.alert("Error", "Failed to pick image from gallery")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      testID={testID}
    >
      <View style={themed($overlay)}>
        <View style={themed($modalContainer)}>
          {/* Header */}
          <View style={themed($header)}>
            <Text style={themed($title)} text="Update Profile Photo" />
            <TouchableOpacity
              style={themed($closeButton)}
              onPress={handleClose}
              disabled={isUploading}
              testID={`${testID}_closeButton`}
            >
              <Ionicons name="close" size={24} color={themed($closeButtonIcon).color} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={themed($content)}>
            {isUploading ? (
              <View style={themed($loadingContainer)}>
                <ActivityIndicator size="large" color={themed($loadingColor).color} />
                <Text style={themed($loadingText)} text="Uploading..." />
              </View>
            ) : (
              <>
                <Text
                  style={themed($description)}
                  text="Choose how you'd like to update your profile photo"
                />

                <View style={themed($optionsContainer)}>
                  {/* Take Photo Option */}
                  <TouchableOpacity
                    style={themed($optionButton)}
                    onPress={handleTakePhoto}
                    activeOpacity={0.7}
                    testID={`${testID}_takePhotoButton`}
                  >
                    <View style={themed($optionIconContainer)}>
                      <Ionicons name="camera" size={32} color={themed($optionIconColor).color} />
                    </View>
                    <Text style={themed($optionText)} text="Take Photo" />
                  </TouchableOpacity>

                  {/* Pick from Gallery Option */}
                  <TouchableOpacity
                    style={themed($optionButton)}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.7}
                    testID={`${testID}_galleryButton`}
                  >
                    <View style={themed($optionIconContainer)}>
                      <Ionicons name="images" size={32} color={themed($optionIconColor).color} />
                    </View>
                    <Text style={themed($optionText)} text="Choose from Gallery" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Footer */}
          {!isUploading && (
            <View style={themed($footer)}>
              <Button text="Cancel" onPress={handleClose} testID={`${testID}_cancelButton`} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

// Set display name for debugging
AvatarUploadModal.displayName = "AvatarUploadModal"
// #endregion

// #region Styles
const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  margin: spacing.lg,
  maxWidth: 400,
  width: "100%",
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0, 0, 0, 0.1)",
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $closeButtonIcon: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $optionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $optionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
})

const $optionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $optionIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $optionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $loadingColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  marginTop: spacing.md,
})

const $footer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  borderTopWidth: 1,
  borderTopColor: "rgba(0, 0, 0, 0.1)",
})
// #endregion
