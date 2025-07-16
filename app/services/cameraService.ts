import { Camera, CameraType } from "expo-camera"
import * as ImageManipulator from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

export interface ImageResult {
  uri: string
  width: number
  height: number
  type: string
  size?: number
}

export interface CompressedImageResult extends ImageResult {
  compressedUri: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export class CameraService {
  private static _instance: CameraService

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService._instance) {
      CameraService._instance = new CameraService()
    }
    return CameraService._instance
  }

  /**
   * Request camera permissions
   * @returns Promise<boolean> - Whether permission was granted
   */
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync()
    return status === "granted"
  }

  /**
   * Request media library permissions
   * @returns Promise<boolean> - Whether permission was granted
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    return status === "granted"
  }

  /**
   * Check if camera permission is granted
   * @returns Promise<boolean>
   */
  async hasCameraPermission(): Promise<boolean> {
    const { status } = await Camera.getCameraPermissionsAsync()
    return status === "granted"
  }

  /**
   * Check if media library permission is granted
   * @returns Promise<boolean>
   */
  async hasMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync()
    return status === "granted"
  }

  /**
   * Open camera to take a photo
   * @param options - Image picker options
   * @returns Promise<ImageResult | null>
   */
  async takePhoto(options: ImagePicker.ImagePickerOptions = {}): Promise<ImageResult | null> {
    const hasPermission = await this.requestCameraPermission()
    if (!hasPermission) {
      throw new Error("Camera permission not granted")
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      ...options,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type || "image",
        size: asset.fileSize,
      }
    }

    return null
  }

  /**
   * Open gallery to pick an image
   * @param options - Image picker options
   * @returns Promise<ImageResult | null>
   */
  async pickFromGallery(options: ImagePicker.ImagePickerOptions = {}): Promise<ImageResult | null> {
    const hasPermission = await this.requestMediaLibraryPermission()
    if (!hasPermission) {
      throw new Error("Media library permission not granted")
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      ...options,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type || "image",
        size: asset.fileSize,
      }
    }

    return null
  }

  /**
   * Compress an image to reduce file size
   * @param imageUri - URI of the image to compress
   * @param quality - Compression quality (0-1, default 0.7)
   * @param maxWidth - Maximum width (default 1024)
   * @param maxHeight - Maximum height (default 1024)
   * @returns Promise<CompressedImageResult>
   */
  async compressImage(
    imageUri: string,
    quality: number = 0.7,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
  ): Promise<CompressedImageResult> {
    const originalSize = await this.getFileSize(imageUri)

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    )

    const compressedSize = await this.getFileSize(result.uri)

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      type: "image/jpeg",
      compressedUri: result.uri,
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize,
    }
  }

  /**
   * Get file size in bytes
   * @param uri - File URI
   * @returns Promise<number>
   */
  private async getFileSize(uri: string): Promise<number> {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      return blob.size
    } catch (error) {
      console.warn("Could not determine file size:", error)
      return 0
    }
  }

  /**
   * Convert image to base64 string
   * @param imageUri - URI of the image
   * @returns Promise<string>
   */
  async imageToBase64(imageUri: string): Promise<string> {
    const response = await fetch(imageUri)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 string
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Get camera types available on the device
   * @returns Promise<CameraType[]>
   */
  async getAvailableCameraTypes(): Promise<CameraType[]> {
    // For now, return both types as they're commonly available
    // In a real implementation, you might want to check device capabilities
    // or use a different approach to determine available cameras
    return ["back", "front"] as CameraType[]
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance()
