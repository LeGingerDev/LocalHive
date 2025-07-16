import { Share } from "react-native"
import * as Sharing from "expo-sharing"

/**
 * Service for handling content sharing functionality
 */
export class SharingService {
  /**
   * Check if sharing is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync()
    } catch (error) {
      console.error("Error checking sharing availability:", error)
      return false
    }
  }

  /**
   * Share text content using React Native's Share API
   */
  static async shareText(text: string, title?: string): Promise<boolean> {
    try {
      const result = await Share.share({
        message: text,
        title: title || "Share",
      })

      return result.action !== Share.dismissedAction
    } catch (error) {
      console.error("Error sharing text:", error)
      return false
    }
  }

  /**
   * Share a URL using React Native's Share API
   */
  static async shareUrl(url: string, title?: string): Promise<boolean> {
    try {
      const result = await Share.share({
        message: url,
        title: title || "Share Link",
      })

      return result.action !== Share.dismissedAction
    } catch (error) {
      console.error("Error sharing URL:", error)
      return false
    }
  }

  /**
   * Share a file from a local URI using expo-sharing
   */
  static async shareFile(fileUri: string, mimeType: string, title?: string): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable()
      if (!isAvailable) {
        console.log("Sharing not available on this device")
        return false
      }

      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: title || "Share File",
      })
      return true
    } catch (error) {
      console.error("Error sharing file:", error)
      return false
    }
  }

  /**
   * Share app-specific content (like personal codes, group invites, etc.)
   */
  static async shareAppContent(
    content: string,
    type: "personal_code" | "group_invite" | "item",
  ): Promise<boolean> {
    try {
      let title = "Share"
      let message = content

      switch (type) {
        case "personal_code":
          title = "Share Personal Code"
          message = `Add me to your group with this code: ${content}`
          break
        case "group_invite":
          title = "Share Group Invite"
          message = `Join my group: ${content}`
          break
        case "item":
          title = "Share Item"
          message = `Check out this item: ${content}`
          break
      }

      const result = await Share.share({
        message,
        title,
      })

      return result.action !== Share.dismissedAction
    } catch (error) {
      console.error("Error sharing app content:", error)
      return false
    }
  }
}
