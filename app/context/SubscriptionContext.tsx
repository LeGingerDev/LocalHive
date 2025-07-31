import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

import { useAuth } from "./AuthContext"
import { useSubscription } from "@/hooks/useSubscription"
import { subscriptionEventEmitter } from "@/services/subscriptionService"

interface SubscriptionContextType {
  isRefreshing: boolean
  lastRefreshTime: number
  forceRefresh: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

interface SubscriptionProviderProps {
  children: ReactNode
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)

  const forceRefresh = () => {
    if (subscription.refresh) {
      setIsRefreshing(true)
      setLastRefreshTime(Date.now())
      subscription.refresh()
      // Reset refreshing state after a short delay
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  // Listen for global subscription changes
  useEffect(() => {
    if (!user?.id) return

    const unsubscribeSubscriptionChanged = subscriptionEventEmitter.subscribe('subscriptionChanged', (data) => {
      if (data.userId === user.id) {
        console.log("🔄 [SubscriptionContext] Global subscription change detected, forcing refresh")
        forceRefresh()
      }
    })

    const unsubscribeCacheCleared = subscriptionEventEmitter.subscribe('cacheCleared', (data) => {
      if (data.userId === user.id) {
        console.log("🔄 [SubscriptionContext] Cache cleared, forcing refresh")
        forceRefresh()
      }
    })

    return () => {
      unsubscribeSubscriptionChanged()
      unsubscribeCacheCleared()
    }
  }, [user?.id])

  const value: SubscriptionContextType = {
    isRefreshing,
    lastRefreshTime,
    forceRefresh,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscriptionContext = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscriptionContext must be used within a SubscriptionProvider")
  }
  return context
} 