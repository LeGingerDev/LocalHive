import { cameraService, ImageResult } from "@/services/cameraService"
import { StorageService } from "@/services/supabase/storageService"
import { supabase } from "@/services/supabase/supabase"
import { checkNetworkConnectivity } from "@/utils/networkUtils"

export interface ProfileAvatarUploadResult {
  success: boolean
  publicUrl?: string
  error?: string
}

export class ProfileAvatarService {
  private static _instance: ProfileAvatarService

  private constructor() {}

  public static getInstance(): ProfileAvatarService {
    if (!ProfileAvatarService._instance) {
      ProfileAvatarService._instance = new ProfileAvatarService()
    }
    return ProfileAvatarService._instance
  }



  /**
   * Take a photo and upload it as profile avatar
   * @param userId - The user ID
   * @returns Promise with upload result
   */
  async takeAndUploadPhoto(userId: string): Promise<ProfileAvatarUploadResult> {
    try {
      console.log("[ProfileAvatarService] Taking photo for user:", userId)
      
      // Take photo
      const photoResult = await cameraService.takePhoto({
        mediaTypes: "Images" as any,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
      })

      if (!photoResult) {
        return { success: false, error: "No photo was taken" }
      }

      // Process and upload the photo
      return await this.processAndUploadImage(userId, photoResult)
    } catch (error) {
      console.error("[ProfileAvatarService] Take photo error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to take photo" }
    }
  }

  /**
   * Pick an image from gallery and upload it as profile avatar
   * @param userId - The user ID
   * @returns Promise with upload result
   */
  async pickAndUploadFromGallery(userId: string): Promise<ProfileAvatarUploadResult> {
    try {
      console.log("[ProfileAvatarService] Picking image from gallery for user:", userId)
      
      // Pick image from gallery
      const imageResult = await cameraService.pickFromGallery({
        mediaTypes: "Images" as any,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
      })

      if (!imageResult) {
        return { success: false, error: "No image was selected" }
      }

      // Process and upload the image
      return await this.processAndUploadImage(userId, imageResult)
    } catch (error) {
      console.error("[ProfileAvatarService] Pick from gallery error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to pick image" }
    }
  }

  /**
   * Process and upload an image as profile avatar
   * @param userId - The user ID
   * @param imageResult - The image result from camera/gallery
   * @returns Promise with upload result
   */
  private async processAndUploadImage(
    userId: string,
    imageResult: ImageResult,
  ): Promise<ProfileAvatarUploadResult> {
    try {
      console.log("[ProfileAvatarService] Processing image for user:", userId)
      
      // Check network connectivity before proceeding
      const hasNetwork = await checkNetworkConnectivity()
      if (!hasNetwork) {
        return { 
          success: false, 
          error: "No internet connection. Please check your network and try again." 
        }
      }
      
      // Compress and resize the image
      const compressedImage = await cameraService.compressImage(
        imageResult.uri,
        0.7, // quality
        200, // maxWidth - reasonable size for avatars
        200, // maxHeight
      )

      console.log("[ProfileAvatarService] Image compressed:", {
        originalSize: compressedImage.originalSize,
        compressedSize: compressedImage.compressedSize,
        compressionRatio: compressedImage.compressionRatio,
      })

      // Convert to blob for upload with better error handling
      let blob: Blob
      try {
        console.log("[ProfileAvatarService] Converting image to blob...")
        const response = await fetch(compressedImage.uri)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        blob = await response.blob()
        console.log("[ProfileAvatarService] Blob created successfully, size:", blob.size)
      } catch (fetchError) {
        console.error("[ProfileAvatarService] Fetch error:", fetchError)
        
        // Fallback: try to use the original image if compression failed
        console.log("[ProfileAvatarService] Trying fallback with original image...")
        try {
          const fallbackResponse = await fetch(imageResult.uri)
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
          }
          blob = await fallbackResponse.blob()
          console.log("[ProfileAvatarService] Fallback blob created, size:", blob.size)
        } catch (fallbackError) {
          console.error("[ProfileAvatarService] Fallback fetch also failed:", fallbackError)
          return { 
            success: false, 
            error: "Failed to process image. Please check your network connection and try again." 
          }
        }
      }

      // Upload to storage
      console.log("[ProfileAvatarService] Starting upload to storage...")
      const uploadResult = await StorageService.uploadProfileAvatar(userId, blob, {
        contentType: "image/jpeg",
      })

      console.log("[ProfileAvatarService] Upload successful:", uploadResult.publicUrl)

      // Update user profile in database
      await this.updateUserProfileAvatar(userId, uploadResult.publicUrl)

      return {
        success: true,
        publicUrl: uploadResult.publicUrl,
      }
    } catch (error) {
      console.error("[ProfileAvatarService] Process and upload error:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload image"
      if (error instanceof Error) {
        if (error.message.includes("Network request failed")) {
          errorMessage = "Network connection failed. Please check your internet connection and try again."
        } else if (error.message.includes("fetch")) {
          errorMessage = "Failed to process image. Please try again."
        } else if (error.message.includes("storage")) {
          errorMessage = "Storage service error. Please try again later."
        } else if (error.message.includes("bucket")) {
          errorMessage = "Storage configuration error. Please contact support."
        } else if (error.message.includes("permission")) {
          errorMessage = "Permission denied. Please check your account settings."
        } else {
          errorMessage = error.message
        }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Update user profile with new avatar URL
   * @param userId - The user ID
   * @param avatarUrl - The new avatar URL
   */
  private async updateUserProfileAvatar(userId: string, avatarUrl: string | null) {
    try {
      console.log("[ProfileAvatarService] Updating user profile avatar:", {
        userId,
        avatarUrl,
      })
      
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId)

      if (error) {
        console.error("[ProfileAvatarService] Database update error:", error)
        throw new Error(error.message)
      }

      console.log("[ProfileAvatarService] User profile updated successfully")
      
      // Verify the update by fetching the profile
      const { data: verifyProfile, error: verifyError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single()
        
      if (verifyError) {
        console.error("[ProfileAvatarService] Verification error:", verifyError)
      } else {
        console.log("[ProfileAvatarService] Verification - profile avatar_url:", verifyProfile?.avatar_url)
      }
    } catch (error) {
      console.error("[ProfileAvatarService] Update profile error:", error)
      throw error
    }
  }

  /**
   * Get profile avatar URL for a user
   * @param userId - The user ID
   * @returns The avatar URL or null if not found
   */
  async getProfileAvatarUrl(userId: string): Promise<string | null> {
    try {
      // Try to get from database first
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single()

      if (error) {
        console.log("[ProfileAvatarService] No profile found for user:", userId)
        return null
      }

      return profile?.avatar_url || null
    } catch (error) {
      console.error("[ProfileAvatarService] Get avatar URL error:", error)
      return null
    }
  }

  /**
   * Delete profile avatar for a user
   * @param userId - The user ID
   * @returns Promise with delete result
   */
  async deleteProfileAvatar(userId: string): Promise<ProfileAvatarUploadResult> {
    try {
      console.log("[ProfileAvatarService] Deleting profile avatar for user:", userId)
      
      // Delete from storage
      await StorageService.deleteProfileAvatar(userId)
      
      // Update database to remove avatar URL
      await this.updateUserProfileAvatar(userId, null)

      return { success: true }
    } catch (error) {
      console.error("[ProfileAvatarService] Delete avatar error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete avatar" }
    }
  }
}

// Export singleton instance
export const profileAvatarService = ProfileAvatarService.getInstance() 