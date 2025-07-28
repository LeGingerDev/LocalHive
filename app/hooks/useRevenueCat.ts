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
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<any>(null)

  useEffect(() => {
    initializeRevenueCat()
  }, [])

  const initializeRevenueCat = async () => {
    try {
      setLoading(true)
      setError(null)

      // Initialize RevenueCat
      await revenueCatService.initialize()
      setIsInitialized(true)

      // Get subscription tiers
      const tiers = await revenueCatService.getSubscriptionTiers()
      setSubscriptionTiers(tiers)

      // Get customer info
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)

      // Check subscription status
      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)

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

  const setUserID = async (userID: string) => {
    try {
      await revenueCatService.setUserID(userID)

      // Refresh customer info after setting user ID
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)

      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)
    } catch (err) {
      console.error("Failed to set user ID:", err)
      throw err
    }
  }

  const purchaseAndSync = async (userID: string, packageToPurchase: any) => {
    try {
      const result = await revenueCatService.purchaseAndSync(userID, packageToPurchase)

      // Refresh customer info after purchase
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)

      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)

      return result
    } catch (err) {
      console.error("Failed to purchase and sync:", err)
      throw err
    }
  }

  const linkAnonymousPurchase = async (userID: string) => {
    try {
      await revenueCatService.linkAnonymousPurchase(userID)

      // Refresh customer info after linking
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)

      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)
    } catch (err) {
      console.error("Failed to link anonymous purchase:", err)
      throw err
    }
  }

  const refreshCustomerInfo = async () => {
    try {
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)

      const hasActive = await revenueCatService.hasActiveSubscription()
      setHasActiveSubscription(hasActive)
    } catch (err) {
      console.error("Failed to refresh customer info:", err)
      throw err
    }
  }

  return {
    subscriptionTiers,
    loading,
    error,
    canManageSubscription,
    isInitialized,
    hasActiveSubscription,
    customerInfo,
    openSubscriptionManagement,
    getSubscriptionManagementURL,
    refreshSubscriptionStatus,
    setUserID,
    purchaseAndSync,
    linkAnonymousPurchase,
    refreshCustomerInfo,
  }
}
