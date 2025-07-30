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
            console.log("🔄 [RevenueCat] Pro subscription updated, scheduling app restart...")
            // Schedule app restart to reflect the new subscription status
            restartApp(1000)
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
            console.log("🔄 [RevenueCat] Expired subscription updated, scheduling app restart...")
            // Schedule app restart to reflect the new subscription status
            restartApp(1000)
          }
        } else {
          console.log("🆓 [RevenueCat] No subscription found, setting to free status")
          // No subscription found - set to free
          const success = await this.updateSubscriptionInSupabase("free")
          if (success) {
            console.log("🔄 [RevenueCat] Free status updated, scheduling app restart...")
            // Schedule app restart to reflect the new subscription status
            restartApp(1000)
          }
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
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo?.originalAppUserId) {
        console.warn("❌ No user ID found for subscription update")
        return false
      }

      // Skip Supabase update if this is an anonymous user (they haven't signed up yet)
      if (customerInfo.originalAppUserId.startsWith("$RCAnonymousID:")) {
        console.log(
          `ℹ️ [RevenueCat] Skipping Supabase update for anonymous user: ${customerInfo.originalAppUserId}`,
        )
        return false
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
        return true
      } else {
        console.error(`❌ [RevenueCat] Failed to update Supabase:`, result.error)
        return false
      }
    } catch (error) {
      console.error("❌ Error updating subscription in Supabase:", error)
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

            // Check if there are any active entitlements that might be trials
            const activeEntitlementsList = Object.values(activeEntitlements)
            if (activeEntitlementsList.length > 0) {
              const firstActiveEntitlement = activeEntitlementsList[0]
              console.log(
                `🔍 [RevenueCat] Found active entitlement:`,
                firstActiveEntitlement.identifier,
                firstActiveEntitlement.expirationDate,
              )

              // Check if this is a trial
              const isTrial =
                firstActiveEntitlement.identifier.includes("trial") ||
                firstActiveEntitlement.identifier.includes("intro") ||
                firstActiveEntitlement.periodType === "intro" ||
                (firstActiveEntitlement.expirationDate &&
                  this.isTrialPeriod(firstActiveEntitlement.expirationDate))

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
                      entitlementId: firstActiveEntitlement.identifier,
                    },
                  })
                } else {
                  console.error(`❌ [RevenueCat] Failed to update Supabase with trial status`)
                }
              } else {
                console.log(`⚠️ [RevenueCat] Unknown active entitlement type - treating as free`)

                // Unknown entitlement type - treat as free to be safe
                const result = await SubscriptionService.updateSubscriptionStatus(userID, "free")
                if (result.success) {
                  console.log(`✅ [RevenueCat] Successfully marked unknown entitlement as free`)
                } else {
                  console.error(`❌ [RevenueCat] Failed to mark as free:`, result.error)
                }
              }
            } else {
              console.log(`ℹ️ [RevenueCat] No active entitlements found`)
            }
          }
        }
      } else {
        console.log(`📉 [RevenueCat] No active subscriptions found`)

        // Check if subscription expired or was cancelled - look in all entitlements
        const allEntitlements = Object.values(customerInfo.entitlements.all)
        console.log(
          `🔍 [RevenueCat] All entitlements:`,
          allEntitlements.map((e) => ({
            identifier: e.identifier,
            expirationDate: e.expirationDate,
            isActive: e.isActive,
          })),
        )

        // Look for any expired entitlement (not just pro)
        const expiredEntitlement = allEntitlements.find((entitlement) => {
          if (!entitlement.expirationDate) return false

          const now = new Date()
          const expirationDate = new Date(entitlement.expirationDate)

          // Check if it's expired (past expiration date)
          return now > expirationDate
        })

        if (expiredEntitlement) {
          console.log(
            `⏰ [RevenueCat] Found expired entitlement:`,
            expiredEntitlement.identifier,
            expiredEntitlement.expirationDate,
          )

          // Check if this was a pro subscription that expired
          const isProSubscription =
            expiredEntitlement.identifier === "pro" ||
            expiredEntitlement.identifier.includes("pro") ||
            expiredEntitlement.identifier.includes("premium") ||
            expiredEntitlement.identifier.includes("monthly") ||
            expiredEntitlement.identifier.includes("yearly")

          if (isProSubscription) {
            console.log(`💳 [RevenueCat] Pro subscription has expired - marking as expired`)

            // Mark as expired for pro subscriptions
            const result = await SubscriptionService.updateSubscriptionStatus(userID, "expired")

            if (result.success) {
              console.log(`✅ [RevenueCat] Successfully marked pro subscription as expired`)
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
                expiredAt: expiredEntitlement.expirationDate,
                entitlementId: expiredEntitlement.identifier,
              },
            })
          } else {
            console.log(`ℹ️ [RevenueCat] Non-pro subscription expired - marking as free`)

            // For non-pro subscriptions (like trials), mark as free
            const result = await SubscriptionService.updateSubscriptionStatus(userID, "free")

            if (result.success) {
              console.log(`✅ [RevenueCat] Successfully marked non-pro subscription as free`)
            } else {
              console.error(`❌ [RevenueCat] Failed to mark subscription as free:`, result.error)
            }
          }
        } else {
          console.log(
            `ℹ️ [RevenueCat] No expired entitlements found - user has no subscription history`,
          )

          // No expired entitlements found - user is free
          const result = await SubscriptionService.updateSubscriptionStatus(userID, "free")

          if (result.success) {
            console.log(
              `✅ [RevenueCat] Successfully marked user as free (no subscription history)`,
            )
          } else {
            console.error(`❌ [RevenueCat] Failed to mark user as free:`, result.error)
          }
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
