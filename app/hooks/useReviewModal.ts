import { useState, useEffect, useRef } from "react"
import { AppState, AppStateStatus, DeviceEventEmitter } from "react-native"

import { reviewTrackingService } from "@/services/reviewTrackingService"

// Global state to ensure all instances share the same state
let globalIsVisible = false
let globalListeners: Array<(visible: boolean) => void> = []

const notifyListeners = (visible: boolean) => {
  globalListeners.forEach(listener => listener(visible))
}

export const useReviewModal = () => {
  const [isVisible, setIsVisible] = useState(globalIsVisible)
  const listenerRef = useRef<(visible: boolean) => void>()

  useEffect(() => {
    // Create listener function
    listenerRef.current = (visible: boolean) => {
      setIsVisible(visible)
    }
    
    // Add to global listeners
    globalListeners.push(listenerRef.current)
    
    // Set initial state
    setIsVisible(globalIsVisible)
    
    return () => {
      // Remove from global listeners
      if (listenerRef.current) {
        globalListeners = globalListeners.filter(listener => listener !== listenerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize the review tracking service
    reviewTrackingService.initialize()

    // Listen for review trigger events
    const handleReviewTrigger = () => {
      setIsVisible(true)
    }

    // Add event listener for review triggers using DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener('reviewTrigger', handleReviewTrigger)

    // Handle app state changes for better time tracking
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - restart time tracking
        reviewTrackingService.initialize()
      }
    }

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      // Cleanup event listeners
      subscription.remove()
      appStateSubscription?.remove()
    }
  }, [])

  const showReviewModal = () => {
    globalIsVisible = true
    notifyListeners(true)
  }

  const hideReviewModal = () => {
    globalIsVisible = false
    notifyListeners(false)
  }

  const getTrackingData = () => {
    return reviewTrackingService.getTrackingData()
  }

  const hasUserRated = () => {
    return reviewTrackingService.hasUserRated()
  }

  const resetTrackingData = async () => {
    await reviewTrackingService.resetTrackingData()
  }

  return {
    isVisible,
    showReviewModal,
    hideReviewModal,
    getTrackingData,
    hasUserRated,
    resetTrackingData,
  }
} 