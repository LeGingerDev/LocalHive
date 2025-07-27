import { Platform, Linking } from "react-native"
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
  PurchasesError,
} from "react-native-purchases"

import { AnalyticsService, AnalyticsEvents } from "./analyticsService"
import { SubscriptionService } from "./subscriptionService"
import { restartApp } from "../utils/appRestart"

// RevenueCat API Keys - These should be your actual API keys from RevenueCat dashboard
// You need to get these from your RevenueCat dashboard under Project Settings > API Keys
const REVENUECAT_API_KEYS = {
  android: "goog_WjmZktMAqLNwwTJSCdkSmNeBWML", // Your actual Android API key
  ios: "appl_ofrng2f3e1feb53", // Replace with your actual iOS API key when you have it
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

      // Set up customer info update listener
      this.setupCustomerInfoUpdateListener()

      this._isInitialized = true
      console.log("✅ RevenueCat initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize RevenueCat:", error)
      // Don't throw error to prevent app crash, just log it
      this._isInitialized = false
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
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0
      
      if (hasActiveSubscription) {
        // User has active subscription - sync with Supabase
        const activeEntitlements = customerInfo.entitlements.active
        const proEntitlement = this.findProEntitlement(activeEntitlements)
        
        if (proEntitlement && proEntitlement.expirationDate) {
          // Update to pro status
          await this.updateSubscriptionInSupabase("pro", proEntitlement.expirationDate)
        }
      } else {
        // No active subscription - check if it was cancelled or expired
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        const recentlyExpired = this.findRecentlyExpiredEntitlement(allEntitlements)
        
        if (recentlyExpired) {
          // Subscription was cancelled or expired
          await this.updateSubscriptionInSupabase("expired", recentlyExpired.expirationDate)
        } else {
          // No subscription found - set to free
          await this.updateSubscriptionInSupabase("free")
        }
      }
    } catch (error) {
      console.error("❌ Error handling subscription status change:", error)
    }
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
   * Update subscription status in Supabase
   */
  private async updateSubscriptionInSupabase(
    status: "free" | "pro" | "expired",
    expirationDate?: string,
  ): Promise<void> {
    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo?.originalAppUserId) {
        console.warn("❌ No user ID found for subscription update")
        return
      }

      // Skip Supabase update if this is an anonymous user (they haven't signed up yet)
      if (customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
        console.log(`ℹ️ [RevenueCat] Skipping Supabase update for anonymous user: ${customerInfo.originalAppUserId}`)
        return
      }

      const result = await SubscriptionService.updateSubscriptionStatus(
        customerInfo.originalAppUserId,
        status,
        expirationDate ? { subscription_expires_at: expirationDate } : undefined,
      )

      if (result.success) {
        console.log(`✅ [RevenueCat] Successfully updated Supabase subscription to: ${status}`)
        
        // Track the subscription change
        await AnalyticsService.trackEvent({
          name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
          properties: {
            userId: customerInfo.originalAppUserId,
            newStatus: status,
            source: "revenuecat_webhook",
            expirationDate,
          },
        })

        // Schedule app restart to reflect changes
        restartApp(1000)
      } else {
        console.error(`❌ [RevenueCat] Failed to update Supabase:`, result.error)
      }
    } catch (error) {
      console.error("❌ Error updating subscription in Supabase:", error)
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
    try {
      await this.ensureInitialized()
      
      console.log("🔄 [RevenueCat] Refreshing subscription status...")
      const customerInfo = await this.getCustomerInfo()
      
      if (customerInfo) {
        // This will trigger the customer info update listener
        // which will handle syncing with Supabase
        console.log("✅ [RevenueCat] Subscription status refreshed")
      } else {
        console.log("❌ [RevenueCat] No customer info found during refresh")
      }
    } catch (error) {
      console.error("❌ [RevenueCat] Failed to refresh subscription status:", error)
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
          isAnonymous: customerInfo.originalAppUserId?.startsWith('$RCAnonymousID:'),
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
   * Sync RevenueCat subscription status with Supabase
   */
  async syncSubscriptionWithSupabase(userID: string): Promise<void> {
    try {
      console.log(`🔄 [RevenueCat] Starting sync for user: ${userID}`)

      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) {
        console.log(`❌ [RevenueCat] No customer info found for user: ${userID}`)
        return
      }

      console.log(`📊 [RevenueCat] Customer info:`, {
        userId: userID,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allEntitlements: Object.keys(customerInfo.entitlements.all),
        originalAppUserId: customerInfo.originalAppUserId,
        firstSeen: customerInfo.firstSeen,
        latestExpirationDate: customerInfo.latestExpirationDate,
      })

      // Check if user has active subscription
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0
      console.log(`🔍 [RevenueCat] Has active subscription: ${hasActiveSubscription}`)

      if (hasActiveSubscription) {
        // Get all active entitlements
        const activeEntitlements = customerInfo.entitlements.active
        console.log(`✅ [RevenueCat] Active entitlements:`, activeEntitlements)

        // Look for any pro-related entitlement (pro, premium, etc.)
        const proEntitlement =
          activeEntitlements.pro ||
          activeEntitlements.premium ||
          activeEntitlements.visu_pro ||
          Object.values(activeEntitlements).find(
            (ent) => ent.identifier.includes("pro") || ent.identifier.includes("premium"),
          )

        if (proEntitlement && proEntitlement.expirationDate) {
          const expiresAt = proEntitlement.expirationDate
          console.log(`🎯 [RevenueCat] Found pro entitlement:`, {
            identifier: proEntitlement.identifier,
            expirationDate: expiresAt,
            periodType: proEntitlement.periodType,
          })

          // Update Supabase with pro subscription
          console.log(`🔄 [RevenueCat] Updating Supabase with pro subscription...`)
          const result = await SubscriptionService.upgradeToPro(userID, expiresAt)

          if (result.success) {
            console.log(`✅ [RevenueCat] Successfully updated Supabase subscription`)
            // Schedule app restart to reflect the new subscription status
            console.log(`🔄 [RevenueCat] Scheduling app restart for subscription change...`)
            restartApp(1000)
          } else {
            console.error(`❌ [RevenueCat] Failed to update Supabase:`, result.error)
          }

          // Track subscription sync
          await AnalyticsService.trackEvent({
            name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
            properties: {
              userId: userID,
              newStatus: "pro",
              source: "revenuecat_sync",
              expiresAt,
              entitlementId: proEntitlement.identifier,
            },
          })
        } else {
          console.log(`⚠️ [RevenueCat] No pro entitlement found in active entitlements`)

          // Try to find any active entitlement and treat it as pro
          const firstActiveEntitlement = Object.values(activeEntitlements)[0]
          if (firstActiveEntitlement && firstActiveEntitlement.expirationDate) {
            console.log(
              `🔄 [RevenueCat] Using first active entitlement as pro:`,
              firstActiveEntitlement.identifier,
            )

            const result = await SubscriptionService.upgradeToPro(
              userID,
              firstActiveEntitlement.expirationDate,
            )

            if (result.success) {
              console.log(
                `✅ [RevenueCat] Successfully updated Supabase with first active entitlement`,
              )
              // Schedule app restart to reflect the new subscription status
              console.log(`🔄 [RevenueCat] Scheduling app restart for subscription change...`)
              restartApp(1000)
            } else {
              console.error(`❌ [RevenueCat] Failed to update Supabase:`, result.error)
            }
          }
        }
      } else {
        console.log(`📉 [RevenueCat] No active subscriptions found`)

        // Check if subscription expired - look in all entitlements
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        console.log(
          `🔍 [RevenueCat] All entitlements:`,
          allEntitlements.map((e) => ({
            identifier: e.identifier,
            expirationDate: e.expirationDate,
            isActive: e.isActive,
          })),
        )

        const expiredProEntitlement = allEntitlements.find(
          (entitlement) =>
            (entitlement.identifier === "pro" ||
              entitlement.identifier.includes("pro") ||
              entitlement.identifier.includes("premium")) &&
            entitlement.expirationDate,
        )

        if (expiredProEntitlement && expiredProEntitlement.expirationDate) {
          const now = new Date()
          const expirationDate = new Date(expiredProEntitlement.expirationDate)

          if (now > expirationDate) {
            console.log(
              `⏰ [RevenueCat] Subscription has expired:`,
              expiredProEntitlement.expirationDate,
            )

            // Subscription has expired
            const result = await SubscriptionService.updateSubscriptionStatus(userID, "expired")

            if (result.success) {
              console.log(`✅ [RevenueCat] Successfully marked subscription as expired`)
              // Schedule app restart to reflect the expired subscription status
              console.log(`🔄 [RevenueCat] Scheduling app restart for subscription expiration...`)
              restartApp(1000)
            } else {
              console.error(`❌ [RevenueCat] Failed to mark subscription as expired:`, result.error)
            }

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
        } else {
          console.log(`ℹ️ [RevenueCat] No expired pro entitlements found`)
        }
      }

      console.log(`✅ [RevenueCat] Sync completed for user: ${userID}`)
    } catch (error) {
      console.error("❌ [RevenueCat] Failed to sync subscription with Supabase:", error)
      // Don't throw the error to prevent app crashes, but log it for debugging
    }
  }

  /**
   * Purchase a subscription and sync with Supabase
   */
  async purchaseAndSync(
    userID: string,
    packageToPurchase: PurchasesPackage,
  ): Promise<CustomerInfo | null> {
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
