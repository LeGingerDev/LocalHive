import { useCallback, useEffect, useState, useMemo, useRef } from "react"

import {
  SubscriptionService,
  type SubscriptionInfo,
  type SubscriptionStatus,
} from "@/services/subscriptionService"

// Global cache to prevent multiple API calls for the same user
const subscriptionCache = new Map<
  string,
  {
    data: SubscriptionInfo | null
    error: string | null
    timestamp: number
    promise: Promise<{ info: SubscriptionInfo | null; error: any }> | null
  }
>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook for managing subscription data and operations
 */
export const useSubscription = (userId: string | null) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastRefreshTimeRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)

  /**
   * Load subscription information with caching and deduplication
   */
  const loadSubscriptionInfo = useCallback(async () => {
    if (!userId) {
      // console.log(`❌ [useSubscription] No userId provided`)
      setSubscriptionInfo(null)
      setError(null)
      return
    }

    // Check cache first
    const cached = subscriptionCache.get(userId)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      // console.log(`📋 [useSubscription] Using cached data for user: ${userId}`)
      setSubscriptionInfo(cached.data)
      setError(cached.error)
      setLoading(false)
      return
    }

    // Check if there's already a request in progress
    if (cached?.promise) {
      // console.log(`⏳ [useSubscription] Request already in progress for user: ${userId}`)
      setLoading(true)
      try {
        const { info, error } = await cached.promise
        setSubscriptionInfo(info)
        setError(error?.message || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subscription info")
        setSubscriptionInfo(null)
      } finally {
        setLoading(false)
      }
      return
    }

    // console.log(`🔄 [useSubscription] Loading subscription info for user: ${userId}`)
    setLoading(true)
    setError(null)

    // Create the promise and store it to prevent duplicate requests
    const promise = SubscriptionService.getSubscriptionInfo(userId)
    subscriptionCache.set(userId, {
      data: null,
      error: null,
      timestamp: now,
      promise,
    })

    try {
      const { info, error } = await promise

      if (error) {
        console.error(`❌ [useSubscription] Error loading subscription info:`, error)
        setError(error.message)
        setSubscriptionInfo(null)

        // Update cache with error
        subscriptionCache.set(userId, {
          data: null,
          error: error.message,
          timestamp: now,
          promise: null,
        })
      } else {
        // console.log(`✅ [useSubscription] Subscription info loaded:`, info)
        setSubscriptionInfo(info)

        // Update cache with success data
        subscriptionCache.set(userId, {
          data: info,
          error: null,
          timestamp: now,
          promise: null,
        })
      }
    } catch (err) {
      console.error(`❌ [useSubscription] Exception loading subscription info:`, err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load subscription info"
      setError(errorMessage)
      setSubscriptionInfo(null)

      // Update cache with error
      subscriptionCache.set(userId, {
        data: null,
        error: errorMessage,
        timestamp: now,
        promise: null,
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Refresh subscription information (bypasses cache) with throttling
   */
  const refresh = useCallback(() => {
    if (isRefreshingRef.current) {
      console.log("[useSubscription] Refresh skipped - already refreshing")
      return
    }

    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current
    
    // Prevent refreshing more than once every 1 second
    if (timeSinceLastRefresh < 1000) {
      console.log(`[useSubscription] Refresh throttled - last refresh was ${timeSinceLastRefresh}ms ago`)
      return
    }

    isRefreshingRef.current = true
    lastRefreshTimeRef.current = now

    console.log("[useSubscription] Refreshing subscription data")
    if (userId) {
      // Clear cache for this user to force fresh data
      subscriptionCache.delete(userId)
    }
    loadSubscriptionInfo().finally(() => {
      console.log("[useSubscription] Subscription data refresh completed")
      isRefreshingRef.current = false
    })
  }, [userId, loadSubscriptionInfo])

  /**
   * Activate trial for the user
   */
  const activateTrial = useCallback(async () => {
    if (!userId) return { success: false, error: "No user ID" }

    setLoading(true)
    setError(null)

    try {
      const { success, error } = await SubscriptionService.activateTrial(userId)

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      if (success) {
        // Clear cache and refresh subscription info after trial activation
        subscriptionCache.delete(userId)
        await loadSubscriptionInfo()
      }

      return { success, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to activate trial"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [userId, loadSubscriptionInfo])

  /**
   * Upgrade user to pro subscription
   */
  const upgradeToPro = useCallback(
    async (expiresAt: string) => {
      if (!userId) return { success: false, error: "No user ID" }

      setLoading(true)
      setError(null)

      try {
        const { success, error } = await SubscriptionService.upgradeToPro(userId, expiresAt)

        if (error) {
          setError(error.message)
          return { success: false, error: error.message }
        }

        if (success) {
          // Clear cache and refresh subscription info after upgrade
          subscriptionCache.delete(userId)
          await loadSubscriptionInfo()
        }

        return { success, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to upgrade to pro"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [userId, loadSubscriptionInfo],
  )

  /**
   * Check if user can create a group
   */
  const canCreateGroup = useCallback(async () => {
    if (!userId) return false

    try {
      const { canCreate } = await SubscriptionService.canCreateGroup(userId)
      return canCreate
    } catch (err) {
      console.error("Error checking group creation permission:", err)
      return false
    }
  }, [userId])

  /**
   * Check if user can create an item
   */
  const canCreateItem = useCallback(async () => {
    if (!userId) return false

    try {
      const { canCreate } = await SubscriptionService.canCreateItem(userId)
      return canCreate
    } catch (err) {
      console.error("Error checking item creation permission:", err)
      return false
    }
  }, [userId])

  /**
   * Check if user can use AI search
   */
  const canUseAISearch = useCallback(async () => {
    if (!userId) return false

    try {
      const { canUse } = await SubscriptionService.canUseAISearch(userId)
      return canUse
    } catch (err) {
      console.error("Error checking AI search permission:", err)
      return false
    }
  }, [userId])

  /**
   * Check if user is approaching limits
   */
  const isApproachingLimits = useCallback(async () => {
    if (!userId) return { approaching: false, details: null }

    try {
      const { approaching, details } = await SubscriptionService.isApproachingLimits(userId)
      return { approaching, details }
    } catch (err) {
      console.error("Error checking approaching limits:", err)
      return { approaching: false, details: null }
    }
  }, [userId])

  // Load subscription info when userId changes
  useEffect(() => {
    loadSubscriptionInfo()
  }, [loadSubscriptionInfo])

  // Computed values for easy access - memoized to prevent unnecessary recalculations
  const computedValues = useMemo(() => {
    const isFree = subscriptionInfo?.subscription_status === "free"
    const isTrial = subscriptionInfo?.subscription_status === "trial"
    const isPro = subscriptionInfo?.subscription_status === "pro"
    const isExpired = subscriptionInfo?.subscription_status === "expired"

    const groupsUsed = subscriptionInfo?.groups_count || 0
    const groupsLimit = subscriptionInfo?.max_groups || 1
    const itemsUsed = subscriptionInfo?.items_count || 0
    const itemsLimit = subscriptionInfo?.max_items || 10

    const groupsPercentage = groupsLimit > 0 ? (groupsUsed / groupsLimit) * 100 : 0
    const itemsPercentage = itemsLimit > 0 ? (itemsUsed / itemsLimit) * 100 : 0

    const canCreateGroupNow = subscriptionInfo?.can_create_group || false
    const canCreateItemNow = subscriptionInfo?.can_create_item || false
    const canUseAISearchNow = subscriptionInfo?.can_use_ai || false

    return {
      isFree,
      isTrial,
      isPro,
      isExpired,
      groupsUsed,
      groupsLimit,
      groupsPercentage,
      itemsUsed,
      itemsLimit,
      itemsPercentage,
      canCreateGroupNow,
      canCreateItemNow,
      canUseAISearchNow,
    }
  }, [subscriptionInfo])

  // Only log computed values in development and when they actually change
  // Reduced logging to prevent spam
  if (__DEV__ && false) { // Set to false to disable debug logging
    console.log(`📊 [useSubscription] Computed values:`, {
      subscriptionStatus: subscriptionInfo?.subscription_status,
      ...computedValues,
    })
  }

  return {
    // Data
    subscriptionInfo,
    subscriptionStatus: subscriptionInfo?.subscription_status || "free",

    // Computed values
    ...computedValues,

    // State
    loading,
    error,

    // Actions
    refresh,
    activateTrial,
    upgradeToPro,
    canCreateGroup,
    canCreateItem,
    canUseAISearch,
    isApproachingLimits,
  }
}
