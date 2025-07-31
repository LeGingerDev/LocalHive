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
  private _lastSyncTime = 0
  private _syncDebounceTimeout: NodeJS.Timeout | null = null
  private _isSyncing = false

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
    if (this._isSyncing) {
      console.log(`⏳ [RevenueCat] Skipping real-time update - sync in progress`)
      return
    }
    
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
        // Only restart for significant status changes (not free status updates)
        if (status !== "free") {
          console.log(`🔄 [RevenueCat] Scheduling app restart for status change to: ${status}`)
          restartApp(1000)
        }
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
    try {
      await this.ensureInitialized()

      console.log("🔄 [RevenueCat] Refreshing subscription status...")
      const customerInfo = await this.getCustomerInfo()

      if (customerInfo) {
        // Force sync with Supabase
        if (
          customerInfo.originalAppUserId &&
          !customerInfo.originalAppUserId.startsWith("$RCAnonymousID:")
        ) {
          console.log("🔄 [RevenueCat] Forcing sync with Supabase...")
          // Use the debounced sync method instead of direct sync
          await this.syncSubscriptionWithSupabase(customerInfo.originalAppUserId)
        }
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
   * Sync RevenueCat subscription status with Supabase
   */
  async syncSubscriptionWithSupabase(userID: string): Promise<void> {
    try {
      // Prevent recursive calls and add debouncing
      const now = Date.now()
      if (this._isSyncing) {
        console.log(`⏳ [RevenueCat] Sync already in progress for user: ${userID}, skipping...`)
        return
      }

      // Debounce sync calls - only allow one sync every 2 seconds
      if (now - this._lastSyncTime < 2000) {
        console.log(`⏳ [RevenueCat] Sync debounced for user: ${userID}, last sync was ${now - this._lastSyncTime}ms ago`)
        
        // Clear existing timeout and set new one
        if (this._syncDebounceTimeout) {
          clearTimeout(this._syncDebounceTimeout)
        }
        
        this._syncDebounceTimeout = setTimeout(() => {
          this.syncSubscriptionWithSupabase(userID)
        }, 2000 - (now - this._lastSyncTime))
        
        return
      }

      this._isSyncing = true
      this._lastSyncTime = now

      console.log(`🔄 [RevenueCat] Starting sync for user: ${userID}`)

      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) {
        console.log(`❌ [RevenueCat] No customer info found for user: ${userID}`)
        this._isSyncing = false
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

        // Check if this is a trial (look for trial-related entitlements or intro offers)
        const isTrial = Object.values(activeEntitlements).some((entitlement) => {
          const isTrialIdentifier =
            entitlement.identifier.includes("trial") ||
            entitlement.identifier.includes("intro") ||
            entitlement.periodType === "intro"

          const isShortPeriod =
            entitlement.expirationDate && this.isTrialPeriod(entitlement.expirationDate)

          console.log(`🔍 [RevenueCat] Checking entitlement for trial:`, {
            identifier: entitlement.identifier,
            periodType: entitlement.periodType,
            expirationDate: entitlement.expirationDate,
            isTrialIdentifier,
            isShortPeriod,
          })

          return isTrialIdentifier || isShortPeriod
        })

        if (isTrial) {
          console.log(`🎯 [RevenueCat] Detected trial subscription`)

          // Update Supabase with trial status
          const success = await this.updateSubscriptionInSupabase("trial")
          if (success) {
            console.log(`✅ [RevenueCat] Successfully updated Supabase with trial status`)

            // Track trial sync
            await AnalyticsService.trackEvent({
              name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
              properties: {
                userId: userID,
                newStatus: "trial",
                source: "revenuecat_sync",
              },
            })
          } else {
            console.error(`❌ [RevenueCat] Failed to update Supabase with trial status`)
          }
        } else {
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
              console.log(`🔄 [RevenueCat] Scheduling app restart for pro subscription change...`)
              restartApp(1000)
            } else {
              console.error(`❌ [RevenueCat] Failed to update Supabase:`, result.error)
            }
          }
        }
      } else {
        // No active subscription - check for expired subscriptions
        console.log(`📉 [RevenueCat] No active subscriptions found`)
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        console.log(`🔍 [RevenueCat] All entitlements:`, allEntitlements)

        if (allEntitlements.length > 0) {
          // Check for recently expired subscriptions
          const recentlyExpired = this.findRecentlyExpiredEntitlement(allEntitlements)

          if (recentlyExpired) {
            console.log(`📅 [RevenueCat] Found recently expired subscription:`, recentlyExpired)

            // Update Supabase with expired status
            const success = await this.updateSubscriptionInSupabase(
              "expired",
              recentlyExpired.expirationDate,
            )
            if (success) {
              console.log(`✅ [RevenueCat] Successfully updated Supabase with expired status`)

              // Track expired sync
              await AnalyticsService.trackEvent({
                name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
                properties: {
                  userId: userID,
                  newStatus: "expired",
                  source: "revenuecat_sync",
                },
              })
            } else {
              console.error(`❌ [RevenueCat] Failed to update Supabase with expired status`)
            }
          } else {
            console.log(`ℹ️ [RevenueCat] No expired entitlements found - user has no subscription history`)
            // User has no subscription history - mark as free
            const success = await this.updateSubscriptionInSupabase("free")
            if (success) {
              console.log(`✅ [RevenueCat] Successfully marked user as free (no subscription history)`)

              // Track free sync
              await AnalyticsService.trackEvent({
                name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
                properties: {
                  userId: userID,
                  newStatus: "free",
                  source: "revenuecat_sync",
                },
              })
            } else {
              console.error(`❌ [RevenueCat] Failed to mark user as free`)
            }
          }
        } else {
          console.log(`ℹ️ [RevenueCat] No expired entitlements found - user has no subscription history`)
          // User has no subscription history - mark as free
          const success = await this.updateSubscriptionInSupabase("free")
          if (success) {
            console.log(`✅ [RevenueCat] Successfully marked user as free (no subscription history)`)

            // Track free sync
            await AnalyticsService.trackEvent({
              name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
              properties: {
                userId: userID,
                newStatus: "free",
                source: "revenuecat_sync",
              },
            })
          } else {
            console.error(`❌ [RevenueCat] Failed to mark user as free`)
          }
        }
      }

      console.log(`✅ [RevenueCat] Sync completed for user: ${userID}`)
    } catch (error) {
      console.error(`❌ [RevenueCat] Error during sync:`, error)
    } finally {
      this._isSyncing = false
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
