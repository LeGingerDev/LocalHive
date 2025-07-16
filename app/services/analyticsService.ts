import { getApp } from '@react-native-firebase/app'
import { getAnalytics, logEvent, setUserId, setUserProperty, setAnalyticsCollectionEnabled, getAppInstanceId, setSessionTimeoutDuration, logScreenView } from '@react-native-firebase/analytics'

/**
 * Analytics Service
 * 
 * Provides a clean interface for tracking analytics events throughout the app.
 * Wraps Firebase Analytics with custom event tracking.
 */

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

export interface ScreenViewEvent {
  screenName: string
  screenClass?: string
}

export class AnalyticsService {
  private static analyticsInstance: any = null
  private static isInitialized = false

  /**
   * Initialize analytics
   */
  private static async initializeAnalytics() {
    if (this.isInitialized) return this.analyticsInstance

    try {
      console.log('[Analytics] Initializing Firebase Analytics...')
      
      const app = getApp()
      console.log('[Analytics] Firebase app initialized:', app.name)
      
      this.analyticsInstance = getAnalytics(app)
      console.log('[Analytics] Analytics instance created')
      
      // Force enable analytics collection
      await setAnalyticsCollectionEnabled(this.analyticsInstance, true)
      console.log('[Analytics] Analytics collection enabled')
      
      // Set session timeout to 30 minutes for development
      if (__DEV__) {
        await setSessionTimeoutDuration(this.analyticsInstance, 1800000)
        console.log('[Analytics] Session timeout set to 30 minutes')
        
        // Enable debug mode for development
        // Note: For Android, debug mode should also be enabled via ADB:
        // adb shell setprop debug.firebase.analytics.app com.legingerdev.visu
        console.log('[Analytics] Debug mode enabled for development')
        console.log('[Analytics] To enable full debug mode, run: adb shell setprop debug.firebase.analytics.app com.legingerdev.visu')
      }
      
      this.isInitialized = true
      console.log('[Analytics] Analytics initialization complete')
      
      return this.analyticsInstance
    } catch (error) {
      console.error('[Analytics] Failed to initialize analytics:', error)
      throw error
    }
  }

  /**
   * Get analytics instance
   */
  private static async getAnalyticsInstance() {
    if (!this.isInitialized) {
      return await this.initializeAnalytics()
    }
    return this.analyticsInstance
  }

  /**
   * Track a custom event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      console.log('[Analytics] Attempting to track event:', event.name)
      
      const analytics = await this.getAnalyticsInstance()
      
      // Additional debug info for development
      if (__DEV__) {
        try {
          const appInstanceId = await getAppInstanceId(analytics)
          console.log('[Analytics] App Instance ID:', appInstanceId)
        } catch (idError) {
          console.log('[Analytics] Could not get App Instance ID:', idError)
        }
        
        // Test network connectivity to Firebase
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const response = await fetch('https://www.google-analytics.com/g/collect', {
            method: 'HEAD',
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          console.log('[Analytics] Network test to Google Analytics:', response.status)
        } catch (networkError) {
          console.error('[Analytics] Network test failed:', networkError)
        }
      }
      
      // Log the event to Firebase
      await logEvent(analytics, event.name, event.properties)
      console.log('[Analytics] ✅ Event logged to Firebase:', event.name, event.properties)
      
      // Force flush in development
      if (__DEV__) {
        // Try to force a flush by enabling collection again
        await setAnalyticsCollectionEnabled(analytics, true)
        console.log('[Analytics] Forced analytics flush')
        
        // Add a small delay to allow events to be sent
        setTimeout(async () => {
          try {
            // Force another flush
            await setAnalyticsCollectionEnabled(analytics, true)
            console.log('[Analytics] Secondary flush completed')
          } catch (flushError) {
            console.error('[Analytics] Secondary flush failed:', flushError)
          }
        }, 1000)
      }
      
    } catch (error) {
      console.error('[Analytics] ❌ Failed to track event:', error)
      if (error instanceof Error) {
        console.error('[Analytics] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
    }
  }

  /**
   * Track screen view
   */
  static async trackScreenView(event: ScreenViewEvent): Promise<void> {
    try {
      console.log('[Analytics] Attempting to track screen view:', event.screenName)
      
      const analytics = await this.getAnalyticsInstance()
      await logScreenView(analytics, {
        screen_name: event.screenName,
        screen_class: event.screenClass || event.screenName,
      })
      console.log('[Analytics] ✅ Screen view tracked successfully:', event.screenName)
    } catch (error) {
      console.error('[Analytics] ❌ Failed to track screen view:', error)
    }
  }

  /**
   * Set user properties
   */
  static async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      const analytics = await this.getAnalyticsInstance()
      for (const [key, value] of Object.entries(properties)) {
        await setUserProperty(analytics, key, String(value))
      }
      console.log('[Analytics] ✅ User properties set:', properties)
    } catch (error) {
      console.error('[Analytics] ❌ Failed to set user properties:', error)
    }
  }

  /**
   * Set user ID
   */
  static async setUserId(userId: string): Promise<void> {
    try {
      const analytics = await this.getAnalyticsInstance()
      await setUserId(analytics, userId)
      console.log('[Analytics] ✅ User ID set:', userId)
    } catch (error) {
      console.error('[Analytics] ❌ Failed to set user ID:', error)
    }
  }

  /**
   * Clear user ID
   */
  static async clearUserId(): Promise<void> {
    try {
      const analytics = await this.getAnalyticsInstance()
      await setUserId(analytics, null)
      console.log('[Analytics] ✅ User ID cleared')
    } catch (error) {
      console.error('[Analytics] ❌ Failed to clear user ID:', error)
    }
  }

  /**
   * Enable/disable analytics collection
   */
  static async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      const analytics = await this.getAnalyticsInstance()
      await setAnalyticsCollectionEnabled(analytics, enabled)
      console.log('[Analytics] ✅ Collection enabled:', enabled)
    } catch (error) {
      console.error('[Analytics] ❌ Failed to set collection enabled:', error)
    }
  }

  /**
   * Get analytics debug info
   */
  static async getDebugInfo(): Promise<void> {
    try {
      const analytics = await this.getAnalyticsInstance()
      const appInstanceId = await getAppInstanceId(analytics)
      
      console.log('[Analytics] 🔍 Debug Info:')
      console.log('  - Initialized:', this.isInitialized)
      console.log('  - App Instance ID:', appInstanceId)
      console.log('  - Development Mode:', __DEV__)
      
      // Test network connectivity
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('https://www.google-analytics.com/g/collect', {
          method: 'HEAD',
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        console.log('  - Network Status:', response.status)
      } catch (networkError) {
        console.log('  - Network Status: Failed')
      }
    } catch (error) {
      console.error('[Analytics] Failed to get debug info:', error)
    }
  }

  /**
   * Force send all pending events
   */
  static async forceSendEvents(): Promise<void> {
    try {
      console.log('[Analytics] 🔄 Force sending all pending events...')
      const analytics = await this.getAnalyticsInstance()
      
      // Multiple flush attempts
      for (let i = 1; i <= 3; i++) {
        try {
          await setAnalyticsCollectionEnabled(analytics, true)
          console.log(`[Analytics] Flush attempt ${i} completed`)
          
          // Small delay between attempts
          if (i < 3) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (flushError) {
          console.error(`[Analytics] Flush attempt ${i} failed:`, flushError)
        }
      }
      
      console.log('[Analytics] ✅ Force send completed')
    } catch (error) {
      console.error('[Analytics] ❌ Force send failed:', error)
    }
  }

  /**
   * Reset analytics session
   */
  static async resetSession(): Promise<void> {
    try {
      console.log('[Analytics] 🔄 Resetting analytics session...')
      
      // Re-initialize analytics
      this.isInitialized = false
      this.analyticsInstance = null
      
      const analytics = await this.initializeAnalytics()
      console.log('[Analytics] ✅ Session reset completed')
      
      return analytics
    } catch (error) {
      console.error('[Analytics] ❌ Session reset failed:', error)
    }
  }
}

// Predefined events for consistency
export const AnalyticsEvents = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  
  // Authentication
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Groups
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  GROUP_LEFT: 'group_left',
  INVITATION_SENT: 'invitation_sent',
  INVITATION_ACCEPTED: 'invitation_accepted',
  INVITATION_DECLINED: 'invitation_declined',
  
  // Items
  ITEM_ADDED: 'item_added',
  ITEM_VIEWED: 'item_viewed',
  ITEM_EDITED: 'item_edited',
  ITEM_DELETED: 'item_deleted',
  
  // Search
  SEARCH_PERFORMED: 'search_performed',
  AI_SEARCH_PERFORMED: 'ai_search_performed',
  VECTOR_SEARCH_PERFORMED: 'vector_search_performed',
  SEARCH_MODE_SWITCHED: 'search_mode_switched',
  
  // Subscription
  SUBSCRIPTION_STATUS_CHANGED: 'subscription_status_changed',
  TRIAL_ACTIVATED: 'trial_activated',
  PRO_UPGRADE: 'pro_upgrade',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  UPGRADE_ATTEMPTED: 'upgrade_attempted',
  
  // Navigation
  SCREEN_VIEWED: 'screen_viewed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const

export default AnalyticsService 