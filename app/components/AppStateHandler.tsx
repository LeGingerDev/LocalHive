import { useEffect, useRef } from "react"
import { AppState, AppStateStatus } from "react-native"

import { useAuth } from "@/context/AuthContext"
import { AnalyticsService, AnalyticsEvents } from "@/services/analyticsService"
import { revenueCatService } from "@/services/revenueCatService"
import { SubscriptionService } from "@/services/subscriptionService"
import { hideNavigationBar } from "@/utils/navigationBarUtils"

export const AppStateHandler = () => {
  const { refreshUser, user } = useAuth()
  const lastRefreshTimeRef = useRef<number>(0)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          // App has come to the foreground - hide navigation bar again
          hideNavigationBar()

          // Refresh user data to update status bar colors
          refreshUser()

          // Debounce subscription refresh to prevent excessive calls
          const now = Date.now()
          if (now - lastRefreshTimeRef.current < 3000) { // 3 second debounce
            console.log("⏳ [AppStateHandler] Subscription refresh debounced")
            return
          }

          // Clear existing timeout and set new one
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
          }

          refreshTimeoutRef.current = setTimeout(async () => {
            try {
              console.log("🔄 [AppStateHandler] App became active, refreshing subscription status...")
              await revenueCatService.refreshSubscriptionStatus()
              
              // Also clear cache for current user to force fresh data
              if (user?.id) {
                console.log(`🔄 [AppStateHandler] Clearing cache for user: ${user.id}`)
                SubscriptionService.clearUserCache(user.id)
              }
              
              lastRefreshTimeRef.current = Date.now()
            } catch (error) {
              console.error("Failed to refresh subscription status:", error)
            }
          }, 1000) // 1 second delay

          // Track app opened event
          AnalyticsService.trackEvent({
            name: AnalyticsEvents.APP_OPENED,
          })
        } else if (nextAppState === "background") {
          // Track app backgrounded event
          AnalyticsService.trackEvent({
            name: AnalyticsEvents.APP_BACKGROUNDED,
          })
        }
      },
    )

    return () => {
      subscription.remove()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [refreshUser, user?.id])

  return null
}
