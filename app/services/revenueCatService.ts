import { Platform } from "react-native"
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases"

import { SubscriptionService } from "./subscriptionService"
import { AnalyticsService, AnalyticsEvents } from "./analyticsService"

// RevenueCat API Keys - These should be your actual API keys from RevenueCat dashboard
// You need to get these from your RevenueCat dashboard under Project Settings > API Keys
const REVENUECAT_API_KEYS = {
  android: "goog_WjmZktMAqLNwwTJSCdkSmNeBWML", // Your actual Android API key
  ios: "appl_ofrng2f3e1feb53", // Replace with your actual iOS API key when you have it
}

// Product IDs
const PRODUCT_IDS = {
  PRO_MONTHLY: "$rc_monthly", // Your Visu Pro Product ID
}

export interface SubscriptionTier {
  id: string
  name: string
  price: string
  period: string
  features: string[]
}

class RevenueCatService {
  private _isInitialized = false

  /**
   * Initialize RevenueCat with your API keys
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return

    try {
      const apiKey = Platform.select({
        android: REVENUECAT_API_KEYS.android,
        ios: REVENUECAT_API_KEYS.ios,
        default: REVENUECAT_API_KEYS.android,
      })

      if (!apiKey || apiKey === "appl_ofrng2f3e1feb53") {
        console.warn(
          "RevenueCat API key not properly configured. Please check your API keys in RevenueCat dashboard.",
        )
        // Don't throw error, just return to prevent app crash
        return
      }

      // Configure RevenueCat with proper options
      await Purchases.configure({
        apiKey,
        observerMode: false, // Set to true if you want to test without making actual purchases
        useAmazon: false,
      })
      
      this._isInitialized = true
      console.log("✅ RevenueCat initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize RevenueCat:", error)
      // Don't throw error to prevent app crash, just log it
      this._isInitialized = false
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      await this.ensureInitialized()
      const offerings = await Purchases.getOfferings()
      return offerings.current
    } catch (error) {
      console.error("Failed to get offerings:", error)
      return null
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      await this.ensureInitialized()
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)
      return customerInfo
    } catch (error) {
      console.error("Failed to purchase package:", error)
      throw error
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      await this.ensureInitialized()
      const customerInfo = await Purchases.restorePurchases()
      return customerInfo
    } catch (error) {
      console.error("Failed to restore purchases:", error)
      throw error
    }
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      await this.ensureInitialized()
      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo
    } catch (error) {
      console.error("Failed to get customer info:", error)
      return null
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) return false

      // Check if user has any active entitlements
      return Object.keys(customerInfo.entitlements.active).length > 0
    } catch (error) {
      console.error("Failed to check subscription status:", error)
      return false
    }
  }

  /**
   * Get subscription tier information
   */
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    try {
      const offering = await this.getOfferings()
      if (!offering) return []

      return offering.availablePackages.map((pkg: PurchasesPackage) => ({
        id: pkg.identifier,
        name: pkg.product.title,
        price: pkg.product.priceString,
        period: pkg.product.subscriptionPeriod || "One-time",
        features: [], // You can add features based on your subscription tiers
      }))
    } catch (error) {
      console.error("Failed to get subscription tiers:", error)
      return []
    }
  }

  /**
   * Set user ID for RevenueCat and sync with Supabase
   */
  async setUserID(userID: string): Promise<void> {
    try {
      await this.ensureInitialized()
      await Purchases.logIn(userID)
      
      // Sync subscription status with Supabase
      await this.syncSubscriptionWithSupabase(userID)
    } catch (error) {
      console.error("Failed to set user ID:", error)
      throw error
    }
  }

  /**
   * Sync RevenueCat subscription status with Supabase
   */
  async syncSubscriptionWithSupabase(userID: string): Promise<void> {
    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) return

      // Check if user has active subscription
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0

             if (hasActiveSubscription) {
         // Get the active entitlement (assuming you have one called "pro")
         const proEntitlement = customerInfo.entitlements.active.pro
         if (proEntitlement && proEntitlement.expirationDate) {
           const expiresAt = proEntitlement.expirationDate
           
           // Update Supabase with pro subscription
           await SubscriptionService.upgradeToPro(userID, expiresAt)
          
          // Track subscription sync
          await AnalyticsService.trackEvent({
            name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
            properties: {
              userId: userID,
              newStatus: "pro",
              source: "revenuecat_sync",
              expiresAt,
            },
          })
        }
             } else {
         // Check if subscription expired - look in all entitlements
         const allEntitlements = Object.values(customerInfo.entitlements.all)
         const expiredProEntitlement = allEntitlements.find(
           (entitlement) => entitlement.identifier === "pro" && entitlement.expirationDate
         )
         
         if (expiredProEntitlement && expiredProEntitlement.expirationDate) {
           const now = new Date()
           const expirationDate = new Date(expiredProEntitlement.expirationDate)
           
           if (now > expirationDate) {
             // Subscription has expired
             await SubscriptionService.updateSubscriptionStatus(userID, "expired")
            
                         // Track subscription expiration
             await AnalyticsService.trackEvent({
               name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
               properties: {
                 userId: userID,
                 newStatus: "expired",
                 source: "revenuecat_sync",
                 expiredAt: expiredProEntitlement.expirationDate,
               },
             })
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync subscription with Supabase:", error)
    }
  }

  /**
   * Purchase a subscription and sync with Supabase
   */
  async purchaseAndSync(userID: string, packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await this.purchasePackage(packageToPurchase)
      
      if (customerInfo) {
        // Sync the new subscription with Supabase
        await this.syncSubscriptionWithSupabase(userID)
        
        // Track successful purchase
        await AnalyticsService.trackEvent({
          name: AnalyticsEvents.PRO_UPGRADE,
          properties: {
            userId: userID,
            productId: packageToPurchase.product.identifier,
            price: packageToPurchase.product.price,
            currency: packageToPurchase.product.currencyCode,
            source: "revenuecat_purchase",
          },
        })
      }
      
      return customerInfo
    } catch (error) {
      console.error("Failed to purchase and sync:", error)
      throw error
    }
  }

  /**
   * Ensure RevenueCat is initialized before making calls
   */
  private async ensureInitialized(): Promise<void> {
    if (!this._isInitialized) {
      await this.initialize()
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService()
export default revenueCatService
