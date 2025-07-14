import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface NotificationData {
  title: string
  body: string
  data?: Record<string, any>
  sound?: boolean
  priority?: 'default' | 'normal' | 'high'
}

export interface ScheduledNotification extends NotificationData {
  trigger: Notifications.NotificationTriggerInput
}

/**
 * Service for handling push and local notifications
 */
export class NotificationService {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted')
        return false
      }

      // Get push token for remote notifications
      if (Platform.OS !== 'web') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        })
        console.log('Push token:', token.data)
      }

      return true
    } catch (error) {
      console.error('Error requesting notification permissions:', error)
      return false
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      console.error('Error checking notification permissions:', error)
      return false
    }
  }

  /**
   * Send a local notification immediately
   */
  static async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const isEnabled = await this.areEnabled()
      if (!isEnabled) {
        console.log('Notifications not enabled')
        return null
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
        },
        trigger: null, // null means send immediately
      })

      return notificationId
    } catch (error) {
      console.error('Error sending local notification:', error)
      return null
    }
  }

  /**
   * Schedule a notification for later
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const isEnabled = await this.areEnabled()
      if (!isEnabled) {
        console.log('Notifications not enabled')
        return null
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
        },
        trigger: notification.trigger,
      })

      return notificationId
    } catch (error) {
      console.error('Error scheduling notification:', error)
      return null
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId)
      return true
    } catch (error) {
      console.error('Error canceling notification:', error)
      return false
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      return true
    } catch (error) {
      console.error('Error canceling all notifications:', error)
      return false
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync()
    } catch (error) {
      console.error('Error getting scheduled notifications:', error)
      return []
    }
  }

  /**
   * Set up notification listeners
   */
  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    const notificationListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived || (() => {})
    )

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse || (() => {})
    )

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }

  /**
   * Send app-specific notifications
   */
  static async sendGroupInviteNotification(groupName: string, inviterName: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: 'Group Invitation',
      body: `${inviterName} invited you to join "${groupName}"`,
      data: { type: 'group_invite', groupName, inviterName },
    })
  }

  static async sendNewItemNotification(itemName: string, groupName: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: 'New Item Added',
      body: `A new item "${itemName}" was added to "${groupName}"`,
      data: { type: 'new_item', itemName, groupName },
    })
  }

  static async sendReminderNotification(message: string): Promise<string | null> {
    return this.sendLocalNotification({
      title: 'Reminder',
      body: message,
      data: { type: 'reminder' },
    })
  }
} 