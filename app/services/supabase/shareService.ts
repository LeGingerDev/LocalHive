import * as Sharing from "expo-sharing"

export interface ShareOptions {
  title?: string
  message?: string
  url?: string
  mimeType?: string
}

export class ShareService {
  /**
   * Share text content (like personal codes)
   */
  static async shareText(text: string, title?: string): Promise<boolean> {
    try {
      // For text sharing, we need to create a temporary file
      const { writeAsStringAsync, documentDirectory } = await import('expo-file-system')
      
      if (!documentDirectory) {
        console.error("Document directory not available")
        return false
      }

      const fileUri = `${documentDirectory}/share_text.txt`
      await writeAsStringAsync(fileUri, text, { encoding: 'utf8' })
      
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        console.error("Sharing not available on this device")
        return false
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: title || "Share Code",
      })

      return true
    } catch (error) {
      console.error("Error sharing text:", error)
      return false
    }
  }

  /**
   * Share a personal code with a formatted message
   */
  static async sharePersonalCode(code: string, userName?: string): Promise<boolean> {
    const message = `Hey! Use my personal code to add me to groups in Visu: ${code}${userName ? `\n\n- ${userName}` : ""}`

    return this.shareText(message, "Share Personal Code")
  }

  /**
   * Share a group invitation
   */
  static async shareGroupInvitation(groupName: string, groupCode?: string): Promise<boolean> {
    let message = `Join my group "${groupName}" on Visu!`

    if (groupCode) {
      message += `\n\nGroup Code: ${groupCode}`
    }

    return this.shareText(message, "Share Group Invitation")
  }

  /**
   * Share a URL
   */
  static async shareUrl(url: string, title?: string, message?: string): Promise<boolean> {
    try {
      const shareMessage = message ? `${message}\n\n${url}` : url

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        console.error("Sharing not available on this device")
        return false
      }

      await Sharing.shareAsync(url, {
        dialogTitle: title || "Share Link",
      })

      return true
    } catch (error) {
      console.error("Error sharing URL:", error)
      return false
    }
  }

  /**
   * Check if sharing is available on the device
   */
  static async isSharingAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync()
    } catch (error) {
      console.error("Error checking sharing availability:", error)
      return false
    }
  }
}
