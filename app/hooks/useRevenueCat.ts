import { useState, useEffect, useCallback } from 'react'
import { revenueCatService, SubscriptionTier } from '../services/revenueCatService'
import { CustomerInfo, PurchasesPackage } from 'react-native-purchases'

export interface UseRevenueCatReturn {
  isInitialized: boolean
  hasActiveSubscription: boolean
  customerInfo: CustomerInfo | null
  subscriptionTiers: SubscriptionTier[]
  isLoading: boolean
  error: string | null
  initialize: () => Promise<void>
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>
  restorePurchases: () => Promise<void>
  setUserID: (userID: string) => Promise<void>
  refreshCustomerInfo: () => Promise<void>
}

export const useRevenueCat = (): UseRevenueCatReturn => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await revenueCatService.initialize()
      setIsInitialized(true)
      
      // Load initial data
      await refreshCustomerInfo()
      await loadSubscriptionTiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize RevenueCat')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await revenueCatService.getCustomerInfo()
      setCustomerInfo(info)
      
      if (info) {
        const hasActive = Object.keys(info.entitlements.active).length > 0
        setHasActiveSubscription(hasActive)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get customer info')
    }
  }, [])

  const loadSubscriptionTiers = useCallback(async () => {
    try {
      const tiers = await revenueCatService.getSubscriptionTiers()
      setSubscriptionTiers(tiers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription tiers')
    }
  }, [])

  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true)
      setError(null)
      await revenueCatService.purchasePackage(packageToPurchase)
      await refreshCustomerInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase package')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshCustomerInfo])

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await revenueCatService.restorePurchases()
      await refreshCustomerInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore purchases')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshCustomerInfo])

  const setUserID = useCallback(async (userID: string) => {
    try {
      setError(null)
      await revenueCatService.setUserID(userID)
      await refreshCustomerInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set user ID')
      throw err
    }
  }, [refreshCustomerInfo])

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    isInitialized,
    hasActiveSubscription,
    customerInfo,
    subscriptionTiers,
    isLoading,
    error,
    initialize,
    purchasePackage,
    restorePurchases,
    setUserID,
    refreshCustomerInfo,
  }
} 