import { useEffect, useState } from 'react'
import { NotificationService, type NotificationData } from '@/services/notificationService'

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check notification status on mount
  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    try {
      const enabled = await NotificationService.areEnabled()
      setIsEnabled(enabled)
    } catch (error) {
      console.error('Error checking notification status:', error)
      setIsEnabled(false)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const granted = await NotificationService.requestPermissions()
      setIsEnabled(granted)
      return granted
    } catch (error) {
      console.error('Error requesting notification permissions:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendNotification = async (notification: NotificationData): Promise<string | null> => {
    if (!isEnabled) {
      console.log('Notifications not enabled')
      return null
    }
    return NotificationService.sendLocalNotification(notification)
  }

  const sendGroupInviteNotification = async (groupName: string, inviterName: string): Promise<string | null> => {
    return NotificationService.sendGroupInviteNotification(groupName, inviterName)
  }

  const sendNewItemNotification = async (itemName: string, groupName: string): Promise<string | null> => {
    return NotificationService.sendNewItemNotification(itemName, groupName)
  }

  const sendReminderNotification = async (message: string): Promise<string | null> => {
    return NotificationService.sendReminderNotification(message)
  }

  return {
    isEnabled,
    isLoading,
    requestPermissions,
    sendNotification,
    sendGroupInviteNotification,
    sendNewItemNotification,
    sendReminderNotification,
    checkNotificationStatus,
  }
} 