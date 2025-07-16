import { useCallback, useEffect, useState } from "react"

import { SubscriptionService, type SubscriptionInfo, type SubscriptionStatus } from "@/services/subscriptionService"

/**
 * Hook for managing subscription data and operations
 */
export const useSubscription = (userId: string | null) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load subscription information
   */
  const loadSubscriptionInfo = useCallback(async () => {
    if (!userId) {
      setSubscriptionInfo(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { info, error } = await SubscriptionService.getSubscriptionInfo(userId)
      
      if (error) {
        setError(error.message)
        setSubscriptionInfo(null)
      } else {
        setSubscriptionInfo(info)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription info")
      setSubscriptionInfo(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Refresh subscription information
   */
  const refresh = useCallback(() => {
    loadSubscriptionInfo()
  }, [loadSubscriptionInfo])

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
        // Refresh subscription info after trial activation
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
  const upgradeToPro = useCallback(async (expiresAt: string) => {
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
        // Refresh subscription info after upgrade
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
  }, [userId, loadSubscriptionInfo])

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

  // Computed values for easy access
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
    // Data
    subscriptionInfo,
    subscriptionStatus: subscriptionInfo?.subscription_status || "free",
    
    // Computed values
    isFree,
    isTrial,
    isPro,
    isExpired,
    
    // Usage
    groupsUsed,
    groupsLimit,
    groupsPercentage,
    itemsUsed,
    itemsLimit,
    itemsPercentage,
    
    // Permissions
    canCreateGroupNow,
    canCreateItemNow,
    canUseAISearchNow,
    
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