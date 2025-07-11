import * as Sharing from 'expo-sharing'

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
      if (!(await Sharing.isAvailableAsync())) {
        console.warn('Sharing is not available on this device')
        return false
      }

      await Sharing.shareAsync(text, {
        mimeType: 'text/plain',
        dialogTitle: title || 'Share Code',
      })
      
      return true
    } catch (error) {
      console.error('Error sharing text:', error)
      return false
    }
  }

  /**
   * Share a personal code with a formatted message
   */
  static async sharePersonalCode(code: string, userName?: string): Promise<boolean> {
    const message = `Hey! Use my personal code to add me to groups in LocalHive: ${code}${userName ? `\n\n- ${userName}` : ''}`
    
    return this.shareText(message, 'Share Personal Code')
  }

  /**
   * Share a group invitation
   */
  static async shareGroupInvitation(groupName: string, groupCode?: string): Promise<boolean> {
    let message = `Join my group "${groupName}" on LocalHive!`
    
    if (groupCode) {
      message += `\n\nGroup Code: ${groupCode}`
    }
    
    return this.shareText(message, 'Share Group Invitation')
  }

  /**
   * Share a URL
   */
  static async shareUrl(url: string, title?: string, message?: string): Promise<boolean> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        console.warn('Sharing is not available on this device')
        return false
      }

      await Sharing.shareAsync(url, {
        mimeType: 'text/plain',
        dialogTitle: title || 'Share Link',
      })
      
      return true
    } catch (error) {
      console.error('Error sharing URL:', error)
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
      console.error('Error checking sharing availability:', error)
      return false
    }
  }
} 