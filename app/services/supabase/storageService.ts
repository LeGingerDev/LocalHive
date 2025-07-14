import { supabase } from "./supabase"
import Config from "@/config"

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
    }
  ) {
    try {
      console.log("[StorageService] Starting upload for path:", filePath)
      console.log("[StorageService] File type:", typeof file)
      console.log("[StorageService] File size:", file instanceof Blob ? file.size : "FormData")

      // Try with authenticated client first
      const uploadResult = await supabase.storage
        .from("items")
        .upload(filePath, file, {
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