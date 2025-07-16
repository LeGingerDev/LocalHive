import { useState, useCallback } from "react"

import { cameraService, ImageResult, CompressedImageResult } from "../services/cameraService"

export interface UseCameraReturn {
  // State
  isTakingPhoto: boolean
  isPickingFromGallery: boolean
  isCompressing: boolean
  lastImage: ImageResult | null
  lastCompressedImage: CompressedImageResult | null
  error: string | null

  // Actions
  takePhoto: (options?: any) => Promise<ImageResult | null>
  pickFromGallery: (options?: any) => Promise<ImageResult | null>
  compressImage: (
    imageUri: string,
    quality?: number,
    maxWidth?: number,
    maxHeight?: number,
  ) => Promise<CompressedImageResult | null>
  clearError: () => void
  clearLastImage: () => void
}

export function useCamera(): UseCameraReturn {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const [isPickingFromGallery, setIsPickingFromGallery] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [lastImage, setLastImage] = useState<ImageResult | null>(null)
  const [lastCompressedImage, setLastCompressedImage] = useState<CompressedImageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const takePhoto = useCallback(async (options?: any): Promise<ImageResult | null> => {
    setIsTakingPhoto(true)
    setError(null)

    try {
      const result = await cameraService.takePhoto(options)
      if (result) {
        setLastImage(result)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to take photo"
      setError(errorMessage)
      return null
    } finally {
      setIsTakingPhoto(false)
    }
  }, [])

  const pickFromGallery = useCallback(async (options?: any): Promise<ImageResult | null> => {
    setIsPickingFromGallery(true)
    setError(null)

    try {
      const result = await cameraService.pickFromGallery(options)
      if (result) {
        setLastImage(result)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to pick image from gallery"
      setError(errorMessage)
      return null
    } finally {
      setIsPickingFromGallery(false)
    }
  }, [])

  const compressImage = useCallback(
    async (
      imageUri: string,
      quality: number = 0.7,
      maxWidth: number = 1024,
      maxHeight: number = 1024,
    ): Promise<CompressedImageResult | null> => {
      setIsCompressing(true)
      setError(null)

      try {
        const result = await cameraService.compressImage(imageUri, quality, maxWidth, maxHeight)
        if (result) {
          setLastCompressedImage(result)
        }
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to compress image"
        setError(errorMessage)
        return null
      } finally {
        setIsCompressing(false)
      }
    },
    [],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearLastImage = useCallback(() => {
    setLastImage(null)
    setLastCompressedImage(null)
  }, [])

  return {
    // State
    isTakingPhoto,
    isPickingFromGallery,
    isCompressing,
    lastImage,
    lastCompressedImage,
    error,

    // Actions
    takePhoto,
    pickFromGallery,
    compressImage,
    clearError,
    clearLastImage,
  }
}
