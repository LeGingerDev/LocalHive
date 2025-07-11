import { useState } from 'react'
import { ShareService } from '@/services/supabase/shareService'

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false)

  const sharePersonalCode = async (code: string, userName?: string) => {
    setIsSharing(true)
    try {
      const success = await ShareService.sharePersonalCode(code, userName)
      return success
    } catch (error) {
      console.error('Error sharing personal code:', error)
      return false
    } finally {
      setIsSharing(false)
    }
  }

  const shareGroupInvitation = async (groupName: string, groupCode?: string) => {
    setIsSharing(true)
    try {
      const success = await ShareService.shareGroupInvitation(groupName, groupCode)
      return success
    } catch (error) {
      console.error('Error sharing group invitation:', error)
      return false
    } finally {
      setIsSharing(false)
    }
  }

  const shareText = async (text: string, title?: string) => {
    setIsSharing(true)
    try {
      const success = await ShareService.shareText(text, title)
      return success
    } catch (error) {
      console.error('Error sharing text:', error)
      return false
    } finally {
      setIsSharing(false)
    }
  }

  const shareUrl = async (url: string, title?: string, message?: string) => {
    setIsSharing(true)
    try {
      const success = await ShareService.shareUrl(url, title, message)
      return success
    } catch (error) {
      console.error('Error sharing URL:', error)
      return false
    } finally {
      setIsSharing(false)
    }
  }

  const checkSharingAvailability = async () => {
    try {
      return await ShareService.isSharingAvailable()
    } catch (error) {
      console.error('Error checking sharing availability:', error)
      return false
    }
  }

  return {
    isSharing,
    sharePersonalCode,
    shareGroupInvitation,
    shareText,
    shareUrl,
    checkSharingAvailability,
  }
} 