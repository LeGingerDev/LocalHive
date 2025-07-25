import { useState, useEffect } from "react"
import { Platform } from "react-native"

import { revenueCatService } from "@/services/revenueCatService"

export interface SubscriptionTier {
  id: string
  name: string
  price: string
  period: string
  features: string[]
}

export const useRevenueCat = () => {
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canManageSubscription, setCanManageSubscription] = useState(false)

  useEffect(() => {
    initializeRevenueCat()
  }, [])

  const initializeRevenueCat = async () => {
    try {
      setLoading(true)
      setError(null)

      // Initialize RevenueCat
      await revenueCatService.initialize()

      // Get subscription tiers
      const tiers = await revenueCatService.getSubscriptionTiers()
      setSubscriptionTiers(tiers)

      // Check if user can manage subscription
      const canManage = await revenueCatService.canManageSubscription()
      setCanManageSubscription(canManage)

      setLoading(false)
    } catch (err) {
      console.error("Failed to initialize RevenueCat:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize RevenueCat")
      setLoading(false)
    }
  }

  const openSubscriptionManagement = async () => {
    try {
      await revenueCatService.openSubscriptionManagement()
    } catch (err) {
      console.error("Failed to open subscription management:", err)
      throw err
    }
  }

  const getSubscriptionManagementURL = () => {
    return revenueCatService.getSubscriptionManagementURL()
  }

  const refreshSubscriptionStatus = async () => {
    try {
      const canManage = await revenueCatService.canManageSubscription()
      setCanManageSubscription(canManage)
    } catch (err) {
      console.error("Failed to refresh subscription status:", err)
    }
  }

  return {
    subscriptionTiers,
    loading,
    error,
    canManageSubscription,
    openSubscriptionManagement,
    getSubscriptionManagementURL,
    refreshSubscriptionStatus,
  }
}
