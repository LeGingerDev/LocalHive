import { Platform, Linking } from "react-native"
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
  PurchasesError,
} from "react-native-purchases"

import { AnalyticsService, AnalyticsEvents } from "./analyticsService"
import { SubscriptionService, subscriptionEventEmitter } from "./subscriptionService"
import { restartApp } from "../utils/appRestart"
import { supabase } from "./supabase/supabase"
import Config from "../config/config.dev"

// RevenueCat API Keys - Loaded from EAS environment variables
// These should be set in your EAS project environment variables
const REVENUECAT_API_KEYS = {
  android: Config.REVENUECAT_ANDROID_KEY,
  ios: Config.REVENUECAT_IOS_KEY,
}

// Product IDs
const PRODUCT_IDS = {
  PRO_MONTHLY: Platform.select({
    android: "$rc_monthly", // Your Android product ID
    ios: "com.legingerdev.visu.pro.monthly", // Your iOS product ID
    default: "$rc_monthly",
  }),
  PRO_YEARLY: Platform.select({
    android: "$rc_yearly", // Your Android product ID
    ios: "com.legingerdev.visu.pro.yearly", // Your iOS product ID
    default: "$rc_yearly",
  }),
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
  private _customerInfoUpdateListener: (() => void) | null = null

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

      if (!apiKey) {
        console.warn(
          "RevenueCat API key not properly configured. Please set EXPO_PUBLIC_REVENUECAT_ANDROID_KEY and EXPO_PUBLIC_REVENUECAT_IOS_KEY in your EAS environment variables.",
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

      // Set up customer info update listener
      this.setupCustomerInfoUpdateListener()

      this._isInitialized = true
      console.log("✅ RevenueCat initialized successfully")

      // ADDED: Automatically sync subscription status on app start
      await this.syncSubscriptionOnAppStart()
    } catch (error) {
      console.error("❌ Failed to initialize RevenueCat:", error)
      // Don't throw error to prevent app crash, just log it
      this._isInitialized = false
    }
  }

  /**
   * ADDED: Sync subscription status on app start
   */
  private async syncSubscriptionOnAppStart(): Promise<void> {
    try {
      console.log("🔄 [RevenueCat] Syncing subscription status on app start...")
      const customerInfo = await this.getCustomerInfo()

      if (
        customerInfo?.originalAppUserId &&
        !customerInfo.originalAppUserId.startsWith("$RCAnonymousID:")
      ) {
        console.log("🔄 [RevenueCat] Syncing with Supabase on app start...")
        await this.syncSubscriptionWithSupabase(customerInfo.originalAppUserId)
      } else {
        console.log("ℹ️ [RevenueCat] No authenticated user found for sync on app start")
      }
    } catch (error) {
      console.error("❌ [RevenueCat] Error syncing subscription on app start:", error)
    }
  }

  /**
   * Set up listener for customer info updates (subscription changes)
   */
  private setupCustomerInfoUpdateListener(): void {
    try {
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log("🔄 [RevenueCat] Customer info updated:", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all),
        })

        // Handle subscription status changes
        this.handleSubscriptionStatusChange(customerInfo)
      })
    } catch (error) {
      console.error("❌ Failed to set up customer info update listener:", error)
    }
  }

  /**
   * Handle subscription status changes from RevenueCat
   */
  private async handleSubscriptionStatusChange(customerInfo: CustomerInfo): Promise<void> {
    try {
      console.log("🔄 [RevenueCat] Handling subscription status change:", {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allEntitlements: Object.keys(customerInfo.entitlements.all),
        originalAppUserId: customerInfo.originalAppUserId,
      })

      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0

      if (hasActiveSubscription) {
        // User has active subscription - sync with Supabase
        const activeEntitlements = customerInfo.entitlements.active
        const proEntitlement = this.findProEntitlement(activeEntitlements)

        if (proEntitlement && proEntitlement.expirationDate) {
          console.log("✅ [RevenueCat] Active pro subscription found, updating to pro status")
          // Update to pro status
          const success = await this.updateSubscriptionInSupabase(
            "pro",
            proEntitlement.expirationDate,
          )
          if (success) {
            console.log("✅ [RevenueCat] Pro subscription updated successfully")
            // Trigger real-time update instead of app restart
            this.triggerRealtimeUpdate("pro", customerInfo.originalAppUserId)
          }
        }
      } else {
        // No active subscription - check if it was cancelled or expired
        console.log(
          "❌ [RevenueCat] No active subscription found, checking for cancellations/expirations",
        )
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        const recentlyExpired = this.findRecentlyExpiredEntitlement(allEntitlements)

        if (recentlyExpired) {
          console.log(
            "📅 [RevenueCat] Recently expired subscription found, updating to expired status",
          )
          // Subscription was cancelled or expired
          const success = await this.updateSubscriptionInSupabase(
            "expired",
            recentlyExpired.expirationDate,
          )
          if (success) {
            console.log("✅ [RevenueCat] Expired subscription updated successfully")
            // Trigger real-time update instead of app restart
            this.triggerRealtimeUpdate("expired", customerInfo.originalAppUserId)
          }
        } else {
          console.log("🆓 [RevenueCat] No subscription found, setting to free status")
          // No subscription found - set to free
          const success = await this.updateSubscriptionInSupabase("free")
          if (success) {
            console.log("✅ [RevenueCat] Free status updated successfully")
            // Trigger real-time update instead of app restart
            this.triggerRealtimeUpdate("free", customerInfo.originalAppUserId)
          }
        }
      }
    } catch (error) {
      console.error("❌ Error handling subscription status change:", error)
    }
  }

  /**
   * Trigger real-time update for subscription changes
   */
  private triggerRealtimeUpdate(status: string, userId: string): void {
    console.log(`🔄 [RevenueCat] Triggering real-time update for user ${userId} with status: ${status}`)
    
    // Only trigger real-time update if we're not currently syncing
    // if (this._isSyncing) { // This line is removed as per the edit hint
    //   console.log(`⏳ [RevenueCat] Skipping real-time update - sync in progress`)
    //   return
    // }
    
    // Emit subscription changed event
    subscriptionEventEmitter.emit('subscriptionChanged', {
      userId,
      oldStatus: 'unknown', // We don't have the old status here
      newStatus: status,
      timestamp: new Date().toISOString(),
      source: 'revenuecat'
    })

    // Clear cache for this user
    SubscriptionService.clearUserCache(userId)
  }

  /**
   * Find pro-related entitlement in active entitlements
   */
  private findProEntitlement(activeEntitlements: any): any {
    return (
      activeEntitlements.pro ||
      activeEntitlements.premium ||
      activeEntitlements.visu_pro ||
      Object.values(activeEntitlements).find(
        (ent: any) => ent.identifier.includes("pro") || ent.identifier.includes("premium"),
      )
    )
  }

  /**
   * Find recently expired entitlement
   */
  private findRecentlyExpiredEntitlement(allEntitlements: any[]): any {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    return allEntitlements.find((entitlement) => {
      if (!entitlement.expirationDate) return false

      const expirationDate = new Date(entitlement.expirationDate)
      return (
        expirationDate >= thirtyDaysAgo &&
        expirationDate <= now &&
        (entitlement.identifier.includes("pro") || entitlement.identifier.includes("premium"))
      )
    })
  }

  /**
   * Check if an expiration date indicates a trial period (7 days or less from now)
   */
  private isTrialPeriod(expirationDate: string): boolean {
    const expiration = new Date(expirationDate)
    const now = new Date()
    const daysDifference = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    console.log(`📅 [RevenueCat] Trial period check:`, {
      expirationDate,
      now: now.toISOString(),
      daysDifference,
      isTrial: daysDifference <= 7,
    })

    return daysDifference <= 7
  }

  /**
   * Update subscription status in Supabase
   */
  private async updateSubscriptionInSupabase(
    status: "free" | "trial" | "pro" | "expired",
    expirationDate?: string,
  ): Promise<boolean> {
    try {
      console.log(`🔄 [RevenueCat] Updating subscription status in Supabase: ${status}`)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("❌ [RevenueCat] No authenticated user found for sync")
        return false
      }

      const result = await SubscriptionService.updateSubscriptionStatus(user.id, status, {
        subscription_expires_at: expirationDate,
      })

      if (result.success) {
        console.log(`✅ [RevenueCat] Successfully updated Supabase subscription to: ${status}`)
        return true
      } else {
        console.error(`❌ [RevenueCat] Failed to update Supabase subscription:`, result.error)
        return false
      }
    } catch (error) {
      console.error(`❌ [RevenueCat] Error updating subscription in Supabase:`, error)
      return false
    }
  }

  /**
   * Open platform subscription management
   */
  async openSubscriptionManagement(): Promise<void> {
    try {
      await this.ensureInitialized()

      if (Platform.OS === "ios") {
        // Open iOS subscription management
        await Linking.openURL("https://apps.apple.com/account/subscriptions")
      } else if (Platform.OS === "android") {
        // Open Google Play subscription management
        await Linking.openURL("https://play.google.com/store/account/subscriptions")
      }
    } catch (error) {
      console.error("Failed to open subscription management:", error)
      throw error
    }
  }

  /**
   * Get subscription management URL for the current platform
   */
  getSubscriptionManagementURL(): string {
    if (Platform.OS === "ios") {
      return "https://apps.apple.com/account/subscriptions"
    } else if (Platform.OS === "android") {
      return "https://play.google.com/store/account/subscriptions"
    }
    return ""
  }

  /**
   * Check if user can manage subscription (has active subscription)
   */
  async canManageSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) return false

      // Check if user has any active entitlements
      return Object.keys(customerInfo.entitlements.active).length > 0
    } catch (error) {
      console.error("Failed to check if user can manage subscription:", error)
      return false
    }
  }

  /**
   * Refresh subscription status from RevenueCat
   * Call this when app comes back from background to detect changes
   */
  async refreshSubscriptionStatus(): Promise<void> {
    // This method is deprecated - webhooks now handle subscription updates
    console.log("🔄 [RevenueCat] Manual refresh deprecated - webhooks handle subscription updates")
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
   * Link anonymous purchase to user account
   * This should be called after user signs up to link their anonymous purchase
   */
  async linkAnonymousPurchase(userID: string): Promise<void> {
    try {
      await this.ensureInitialized()

      console.log(`🔄 [RevenueCat] Linking anonymous purchase to user: ${userID}`)

      // Get current customer info (should be anonymous)
      const customerInfo = await this.getCustomerInfo()

      if (customerInfo) {
        console.log(`📊 [RevenueCat] Current customer info:`, {
          originalAppUserId: customerInfo.originalAppUserId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          isAnonymous: customerInfo.originalAppUserId?.startsWith("$RCAnonymousID:"),
        })

        // If user has active entitlements, link them to the new account
        const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0

        if (hasActiveEntitlements) {
          console.log(`✅ [RevenueCat] Found active entitlements, linking to user account`)

          // Link anonymous purchase to real user ID
          await Purchases.logIn(userID)

          // Sync with Supabase
          await this.syncSubscriptionWithSupabase(userID)

          console.log(`✅ [RevenueCat] Successfully linked anonymous purchase to user: ${userID}`)

          // Track the linking
          await AnalyticsService.trackEvent({
            name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
            properties: {
              userId: userID,
              newStatus: "pro",
              source: "anonymous_purchase_linking",
              originalAppUserId: customerInfo.originalAppUserId,
            },
          })
        } else {
          console.log(`ℹ️ [RevenueCat] No active entitlements found, skipping linking`)
        }
      } else {
        console.log(`ℹ️ [RevenueCat] No customer info found, skipping linking`)
      }
    } catch (error) {
      console.error(`❌ [RevenueCat] Failed to link anonymous purchase:`, error)
      throw error
    }
  }

  /**
   * Sync subscription with Supabase
   */
  async syncSubscriptionWithSupabase(userID: string): Promise<void> {
    // This method is deprecated - webhooks now handle subscription syncing
    // console.log(`🔄 [RevenueCat] Manual sync deprecated - webhooks handle subscription updates`)
  }

  /**
   * Purchase a subscription (webhook will handle sync)
   */
  async purchaseAndSync(
    userID: string,
    packageToPurchase: PurchasesPackage,
  ): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await this.purchasePackage(packageToPurchase)

      if (customerInfo) {
        // Webhook will handle syncing with Supabase
        // No need for manual sync calls anymore
        
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
      console.error("Failed to purchase:", error)
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
