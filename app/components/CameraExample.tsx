import React from "react"
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from "react-native"

import { Button } from "./Button"
import { Text as AppText } from "./Text"
import { useCamera } from "../hooks/useCamera"
import { colors } from "../theme/colors"
import { spacing } from "../theme/spacing"

export const CameraExample: React.FC = () => {
  const {
    isTakingPhoto,
    isPickingFromGallery,
    isCompressing,
    lastImage,
    lastCompressedImage,
    error,
    takePhoto,
    pickFromGallery,
    compressImage,
    clearError,
    clearLastImage,
  } = useCamera()

  const handleTakePhoto = async () => {
    const result = await takePhoto({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result) {
      Alert.alert("Success", "Photo taken successfully!")
    }
  }

  const handlePickFromGallery = async () => {
    const result = await pickFromGallery({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result) {
      Alert.alert("Success", "Image picked from gallery!")
    }
  }

  const handleCompressImage = async () => {
    if (!lastImage) {
      Alert.alert("No Image", "Please take a photo or pick from gallery first")
      return
    }

    const result = await compressImage(lastImage.uri, 0.5, 800, 600)

    if (result) {
      Alert.alert(
        "Compression Complete",
        `Original: ${Math.round(result.originalSize / 1024)}KB\nCompressed: ${Math.round(result.compressedSize / 1024)}KB\nRatio: ${(result.compressionRatio * 100).toFixed(1)}%`,
      )
    }
  }

  const handleClearImage = () => {
    clearLastImage()
    Alert.alert("Cleared", "Image data cleared")
  }

  return (
    <View style={styles.container}>
      <AppText preset="heading" text="Camera Example" style={styles.title} />

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <AppText preset="formLabel" text="Error:" style={styles.errorLabel} />
          <AppText preset="default" text={error} style={styles.errorText} />
          <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
            <AppText preset="default" text="Clear Error" style={styles.clearErrorText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Image Display */}
      {lastImage && (
        <View style={styles.imageContainer}>
          <AppText preset="formLabel" text="Selected Image:" style={styles.imageLabel} />
          <Image source={{ uri: lastImage.uri }} style={styles.image} />
          <AppText
            preset="default"
            text={`Size: ${lastImage.width}x${lastImage.height}`}
            style={styles.imageInfo}
          />
          {lastImage.size && (
            <AppText
              preset="default"
              text={`File Size: ${Math.round(lastImage.size / 1024)}KB`}
              style={styles.imageInfo}
            />
          )}
        </View>
      )}

      {/* Compressed Image Display */}
      {lastCompressedImage && (
        <View style={styles.imageContainer}>
          <AppText preset="formLabel" text="Compressed Image:" style={styles.imageLabel} />
          <Image source={{ uri: lastCompressedImage.compressedUri }} style={styles.image} />
          <AppText
            preset="default"
            text={`Size: ${lastCompressedImage.width}x${lastCompressedImage.height}`}
            style={styles.imageInfo}
          />
          <AppText
            preset="default"
            text={`Compressed Size: ${Math.round(lastCompressedImage.compressedSize / 1024)}KB`}
            style={styles.imageInfo}
          />
          <AppText
            preset="default"
            text={`Compression: ${(lastCompressedImage.compressionRatio * 100).toFixed(1)}%`}
            style={styles.imageInfo}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          text={isTakingPhoto ? "Taking Photo..." : "Take Photo"}
          onPress={handleTakePhoto}
          disabled={isTakingPhoto}
          style={styles.button}
        />

        <Button
          text={isPickingFromGallery ? "Picking..." : "Pick from Gallery"}
          onPress={handlePickFromGallery}
          disabled={isPickingFromGallery}
          style={styles.button}
        />

        <Button
          text={isCompressing ? "Compressing..." : "Compress Image"}
          onPress={handleCompressImage}
          disabled={isCompressing || !lastImage}
          style={styles.button}
        />

        <Button
          text="Clear Image"
          onPress={handleClearImage}
          disabled={!lastImage && !lastCompressedImage}
          style={[styles.button, styles.clearButton]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  clearButton: {
    backgroundColor: colors.error,
  },
  clearErrorButton: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
  },
  clearErrorText: {
    color: colors.text,
    textDecorationLine: "underline",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.error,
    borderRadius: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  errorLabel: {
    color: colors.text,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.text,
    marginTop: spacing.xs,
  },
  image: {
    borderRadius: spacing.xs,
    height: 200,
    marginBottom: spacing.xs,
    width: "100%",
  },
  imageContainer: {
    marginBottom: spacing.lg,
  },
  imageInfo: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  imageLabel: {
    marginBottom: spacing.xs,
  },
  title: {
    marginBottom: spacing.lg,
    textAlign: "center",
  },
})
