import Config from "@/config"
import { retryWithBackoff } from "@/utils/networkUtils"

import { supabase } from "./supabase"

/**
 * Service for handling Supabase Storage operations
 */
export class StorageService {
  /**
   * Upload an image to Supabase Storage
   * @param filePath - The path where the file should be stored (e.g., "items/test/image.jpg")
   * @param file - The file to upload (Blob, File, or FormData)
   * @param options - Upload options
   * @returns Promise with upload result
   */
  static async uploadImage(
    filePath: string,
    file: Blob | File | FormData,
    options?: {
      contentType?: string
      upsert?: boolean
    },
  ) {
    try {
      console.log("[StorageService] Starting upload for path:", filePath)
      console.log("[StorageService] File type:", typeof file)
      console.log("[StorageService] File size:", file instanceof Blob ? file.size : "FormData")

      // Try with authenticated client first
      const uploadResult = await supabase.storage.from("items").upload(filePath, file, {
        upsert: options?.upsert ?? true,
        contentType: options?.contentType || "image/jpeg",
      })

      console.log("[StorageService] Upload result:", uploadResult)

      if (uploadResult.error) {
        console.error("[StorageService] Upload error:", uploadResult.error)
        throw new Error(uploadResult.error.message)
      }

      return uploadResult
    } catch (error) {
      console.error("[StorageService] Upload exception:", error)
      throw error
    }
  }

  /**
   * Upload a profile avatar to the profile-avatars bucket
   * @param userId - The user ID to use as the filename
   * @param file - The image file to upload
   * @param options - Upload options
   * @returns Promise with upload result and public URL
   */
  static async uploadProfileAvatar(
    userId: string,
    file: Blob | File,
    options?: {
      contentType?: string
    },
  ) {
    return retryWithBackoff(async () => {
      console.log(`[StorageService] Starting profile avatar upload for user: ${userId}`)
      
      // Determine file extension from content type
      const contentType = options?.contentType || "image/jpeg"
      const extension = contentType.includes("png") ? "png" : "jpeg"
      const fileName = `${userId}.${extension}`
      
      // Delete existing avatar if it exists (to ensure only one image per user)
      await this.deleteProfileAvatar(userId)
      
      // Use the same direct fetch approach as AddScreen (which works)
      const supabaseUrl = Config.SUPABASE_URL
      const bucket = "profile-avatars"
      const filePath = fileName
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
      const anonKey = Config.SUPABASE_KEY

      console.log("[StorageService] Uploading to:", uploadUrl)

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${anonKey}`,
          "Content-Type": contentType,
        },
        body: file,
      })

      console.log("[StorageService] Upload response status:", uploadResponse.status)
      const result = await uploadResponse.text()
      console.log("[StorageService] Upload response:", result)

      if (uploadResponse.ok) {
        // Get the public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
        console.log("[StorageService] Public URL:", publicUrl)

        return {
          data: { path: filePath },
          publicUrl,
          fileName,
        }
      } else {
        throw new Error(`Upload failed: ${uploadResponse.status} - ${result}`)
      }
    }, 3, 1000) // 3 retries, 1 second base delay
  }

  /**
   * Get the public URL for a profile avatar
   * @param userId - The user ID
   * @param extension - File extension (jpeg, png, webp)
   * @returns The public URL
   */
  static getProfileAvatarUrl(userId: string, extension: string = "jpeg"): string {
    const fileName = `${userId}.${extension}`
    const supabaseUrl = Config.SUPABASE_URL
    const bucket = "profile-avatars"
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`
  }

  /**
   * Delete a profile avatar
   * @param userId - The user ID
   * @returns Promise with delete result
   */
  static async deleteProfileAvatar(userId: string) {
    try {
      // Try to delete with different extensions
      const extensions = ["jpeg", "jpg", "png", "webp"]
      const filesToDelete = extensions.map(ext => `${userId}.${ext}`)
      
      const { data, error } = await supabase.storage.from("profile-avatars").remove(filesToDelete)

      if (error) {
        console.log("[StorageService] Profile avatar delete error (may not exist):", error.message)
        // Don't throw error if file doesn't exist
        return data
      }

      console.log("[StorageService] Profile avatar deleted successfully")
      return data
    } catch (error) {
      console.error("[StorageService] Profile avatar delete exception:", error)
      // Don't throw error for delete operations
      return null
    }
  }

  /**
   * Get the public URL for a file
   * @param filePath - The path of the file in storage
   * @returns The public URL
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage.from("items").getPublicUrl(filePath)
    return data.publicUrl
  }

  /**
   * Delete a file from storage
   * @param filePath - The path of the file to delete
   * @returns Promise with delete result
   */
  static async deleteFile(filePath: string) {
    try {
      const { data, error } = await supabase.storage.from("items").remove([filePath])

      if (error) {
        console.error("[StorageService] Delete error:", error)
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("[StorageService] Delete exception:", error)
      throw error
    }
  }
}
