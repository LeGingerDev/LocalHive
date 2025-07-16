import { useCallback } from 'react'
import { AnalyticsService, AnalyticsEvents, type AnalyticsEvent, type ScreenViewEvent } from '@/services/analyticsService'

/**
 * Custom hook for analytics
 * 
 * Provides easy access to analytics functions throughout the app.
 * Wraps the AnalyticsService with React hooks for better integration.
 */
export const useAnalytics = () => {
  /**
   * Track a custom event
   */
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    AnalyticsService.trackEvent(event)
  }, [])

  /**
   * Track screen view
   */
  const trackScreenView = useCallback((event: ScreenViewEvent) => {
    AnalyticsService.trackScreenView(event)
  }, [])

  /**
   * Set user properties
   */
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    AnalyticsService.setUserProperties(properties)
  }, [])

  /**
   * Set user ID
   */
  const setUserId = useCallback((userId: string) => {
    AnalyticsService.setUserId(userId)
  }, [])

  /**
   * Clear user ID
   */
  const clearUserId = useCallback(() => {
    AnalyticsService.clearUserId()
  }, [])

  /**
   * Enable/disable analytics collection
   */
  const setAnalyticsCollectionEnabled = useCallback((enabled: boolean) => {
    AnalyticsService.setAnalyticsCollectionEnabled(enabled)
  }, [])

  return {
    trackEvent,
    trackScreenView,
    setUserProperties,
    setUserId,
    clearUserId,
    setAnalyticsCollectionEnabled,
    events: AnalyticsEvents,
  }
} 