import { useEffect } from "react"
import { AppState, AppStateStatus } from "react-native"

import { useAuth } from "@/context/AuthContext"
import { AnalyticsService, AnalyticsEvents } from "@/services/analyticsService"
import { hideNavigationBar } from "@/utils/navigationBarUtils"

export const AppStateHandler = () => {
  const { refreshUser } = useAuth()

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App has come to the foreground - hide navigation bar again
        hideNavigationBar()

        // Refresh user data to update status bar colors
        refreshUser()

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
    })

    return () => {
      subscription.remove()
    }
  }, [refreshUser])

  return null
} 