import { PostgrestError } from "@supabase/supabase-js"

import { AnalyticsService, AnalyticsEvents } from "./analyticsService"
import { supabase } from "./supabase/supabase"

// Event emitter for subscription changes
class SubscriptionEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }
}

// Global event emitter instance
export const subscriptionEventEmitter = new SubscriptionEventEmitter()

/**
 * Subscription status types
 */
export type SubscriptionStatus = "free" | "trial" | "pro" | "expired"

/**
 * Subscription plan interface
 */
export interface SubscriptionPlan {
  id: string
  name: string
  max_groups: number
  max_items: number
  max_lists: number
  ai_search_enabled: boolean
  trial_days: number
  price_monthly: number
  price_yearly: number
  created_at: string
  updated_at: string
}

/**
 * User usage interface
 */
export interface UserUsage {
  groups_count: number
  items_count: number
  lists_count: number
  last_updated: string
}

/**
 * User limits interface
 */
export interface UserLimits {
  max_groups: number
  max_items: number
  max_lists: number
  ai_search_enabled: boolean
}

/**
 * Comprehensive subscription info interface
 */
export interface SubscriptionInfo {
  subscription_status: SubscriptionStatus
  groups_count: number
  items_count: number
  lists_count: number
  max_groups: number
  max_items: number
  max_lists: number
  ai_search_enabled: boolean
  can_create_group: boolean
  can_create_item: boolean
  can_create_list: boolean
  can_use_ai: boolean
  trial_ends_at: string | null
  subscription_expires_at: string | null
}

/**
 * Service for handling subscription-related operations
 */
export class SubscriptionService {
  private static realtimeSubscription: any = null

  /**
   * Initialize real-time subscription for profile changes
   */
  static initializeRealtimeSubscription(): void {
    if (this.realtimeSubscription) {
      console.log("🔄 [SubscriptionService] Real-time subscription already initialized")
      return
    }

    console.log("🔄 [SubscriptionService] Initializing real-time subscription for subscription changes")

    this.realtimeSubscription = supabase
      .channel('subscriptions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles', // Changed from 'subscriptions' to 'profiles'
        },
        (payload) => {
          // console.log("🔄 [SubscriptionService] Profile changed:", payload)
          
          // Type guard to ensure payload has the expected structure
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          
          // Only emit if subscription-related fields changed
          if (newRecord?.subscription_status !== oldRecord?.subscription_status ||
              newRecord?.subscription_expires_at !== oldRecord?.subscription_expires_at) {
            
            // Emit event for subscription change
            subscriptionEventEmitter.emit('subscriptionChanged', {
              userId: newRecord?.id || oldRecord?.id,
              oldStatus: oldRecord?.subscription_status,
              newStatus: newRecord?.subscription_status,
              expiresAt: newRecord?.subscription_expires_at,
              event: payload.eventType,
              timestamp: new Date().toISOString(),
            })

            // Clear cache for this user
            if (newRecord?.id) {
              this.clearUserCache(newRecord.id)
            }
          }
        }
      )
      .on(
        'broadcast',
        { event: 'new_subscription' },
        (payload) => {
          // console.log("🔄 [SubscriptionService] New subscription broadcast:", payload)
          
          // Emit event for new subscription
          subscriptionEventEmitter.emit('subscriptionChanged', {
            userId: payload.user_id,
            newStatus: payload.status,
            planName: payload.plan_name,
            expiresAt: payload.expires_at,
            event: 'INSERT',
            timestamp: new Date().toISOString(),
          })

          // Clear cache for this user
          this.clearUserCache(payload.user_id)
        }
      )
      .subscribe((status) => {
        // console.log("📡 [SubscriptionService] Real-time subscription status:", status)
      })
  }

  /**
   * Clean up real-time subscription
   */
  static cleanupRealtimeSubscription(): void {
    if (this.realtimeSubscription) {
      console.log("🧹 [SubscriptionService] Cleaning up real-time subscription")
      supabase.removeChannel(this.realtimeSubscription)
      this.realtimeSubscription = null
    }
  }

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    // This will be used by the useSubscription hook
    subscriptionEventEmitter.emit('cacheCleared', { userId })
  }

  /**
   * Get the current user's subscription status
   */
  static async getSubscriptionStatus(userId: string): Promise<{
    status: SubscriptionStatus | null
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("get_user_subscription_status", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error getting subscription status:", error)
        return { status: null, error }
      }

      return { status: data as SubscriptionStatus, error: null }
    } catch (error) {
      console.error("Error getting subscription status:", error)
      return {
        status: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get the current user's usage counts
   */
  static async getUserUsage(userId: string): Promise<{
    usage: UserUsage | null
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("get_user_usage", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error getting user usage:", error)
        return { usage: null, error }
      }

      // The function returns a single row with groups_count, items_count, and lists_count
      const usage: UserUsage = {
        groups_count: data?.[0]?.groups_count || 0,
        items_count: data?.[0]?.items_count || 0,
        lists_count: data?.[0]?.lists_count || 0,
        last_updated: new Date().toISOString(),
      }

      return { usage, error: null }
    } catch (error) {
      console.error("Error getting user usage:", error)
      return {
        usage: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get the current user's subscription limits
   */
  static async getUserLimits(userId: string): Promise<{
    limits: UserLimits | null
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("get_user_limits", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error getting user limits:", error)
        return { limits: null, error }
      }

      // The function returns a single row with limits
      const limits: UserLimits = {
        max_groups: data?.[0]?.max_groups || 1,
        max_items: data?.[0]?.max_items || 10,
        max_lists: data?.[0]?.max_lists || 5,
        ai_search_enabled: data?.[0]?.ai_search_enabled || false,
      }

      return { limits, error: null }
    } catch (error) {
      console.error("Error getting user limits:", error)
      return {
        limits: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get comprehensive subscription information for a user
   */
  static async getSubscriptionInfo(userId: string): Promise<{
    info: SubscriptionInfo | null
    error: PostgrestError | null
  }> {
    try {
      if (__DEV__ && false) {
        // Disable debug logging
        console.log(`🔍 [SubscriptionService] Getting subscription info for user: ${userId}`)
      }

      const { data, error } = await supabase.rpc("get_user_subscription_info", {
        user_uuid: userId,
      })

      if (error) {
        console.error("❌ [SubscriptionService] Error getting subscription info:", error)
        return { info: null, error }
      }

      if (__DEV__ && false) {
        // Enable debug logging
        console.log(`📊 [SubscriptionService] Raw data from get_user_subscription_info:`, data)
      }

      // The function returns a single row with all subscription info
      const info: SubscriptionInfo = {
        subscription_status: data?.[0]?.subscription_status || "free",
        groups_count: data?.[0]?.groups_count || 0,
        items_count: data?.[0]?.items_count || 0,
        lists_count: data?.[0]?.lists_count || 0,
        max_groups: data?.[0]?.max_groups || 1,
        max_items: data?.[0]?.max_items || 10,
        max_lists: data?.[0]?.max_lists || 5,
        ai_search_enabled: data?.[0]?.ai_search_enabled || false,
        can_create_group: data?.[0]?.can_create_group || false,
        can_create_item: data?.[0]?.can_create_item || false,
        can_create_list: data?.[0]?.can_create_list || false,
        can_use_ai: data?.[0]?.can_use_ai || false,
        trial_ends_at: data?.[0]?.trial_ends_at || null,
        subscription_expires_at: data?.[0]?.subscription_expires_at || null,
      }

      if (__DEV__ && false) {
        // Enable debug logging
        console.log(`✅ [SubscriptionService] Processed subscription info:`, {
          subscription_status: info.subscription_status,
          groups_count: info.groups_count,
          max_groups: info.max_groups,
          can_create_group: info.can_create_group,
          items_count: info.items_count,
          max_items: info.max_items,
          can_create_item: info.can_create_item,
          lists_count: info.lists_count,
          max_lists: info.max_lists,
          can_create_list: info.can_create_list,
          ai_search_enabled: info.ai_search_enabled,
          can_use_ai: info.can_use_ai,
        })
      }

      return { info, error: null }
    } catch (error) {
      console.error("❌ [SubscriptionService] Error getting subscription info:", error)
      return {
        info: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Check if user can create a new group
   */
  static async canCreateGroup(userId: string): Promise<{
    canCreate: boolean
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("can_create_group", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error checking group creation permission:", error)
        return { canCreate: false, error }
      }

      return { canCreate: data as boolean, error: null }
    } catch (error) {
      console.error("Error checking group creation permission:", error)
      return {
        canCreate: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Check if user can create a new item
   */
  static async canCreateItem(userId: string): Promise<{
    canCreate: boolean
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("can_create_item", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error checking item creation permission:", error)
        return { canCreate: false, error }
      }

      return { canCreate: data as boolean, error: null }
    } catch (error) {
      console.error("Error checking item creation permission:", error)
      return {
        canCreate: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Check if user can use AI search
   */
  static async canUseAISearch(userId: string): Promise<{
    canUse: boolean
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("can_use_ai_search", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error checking AI search permission:", error)
        return { canUse: false, error }
      }

      return { canUse: data as boolean, error: null }
    } catch (error) {
      console.error("Error checking AI search permission:", error)
      return {
        canUse: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Check if user can create a new list
   */
  static async canCreateList(userId: string): Promise<{
    canCreate: boolean
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("can_create_list", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error checking list creation permission:", error)
        return { canCreate: false, error }
      }

      return { canCreate: data as boolean, error: null }
    } catch (error) {
      console.error("Error checking list creation permission:", error)
      return {
        canCreate: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update user's subscription status
   */
  static async updateSubscriptionStatus(
    userId: string,
    status: SubscriptionStatus,
    options?: {
      subscription_expires_at?: string
    },
  ): Promise<{
    success: boolean
    error: PostgrestError | null
  }> {
    try {
      const updateData: any = {
        subscription_status: status,
        subscription_updated_at: new Date().toISOString(),
      }

      // Only handle subscription_expires_at - trials are managed by RevenueCat
      if (options?.subscription_expires_at) {
        updateData.subscription_expires_at = options.subscription_expires_at
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

      if (error) {
        console.error("Error updating subscription status:", error)
        return { success: false, error }
      }

      // Track subscription status change
      await AnalyticsService.trackEvent({
        name: AnalyticsEvents.SUBSCRIPTION_STATUS_CHANGED,
        properties: {
          userId,
          newStatus: status,
          subscriptionExpiresAt: options?.subscription_expires_at,
        },
      })

      return { success: true, error: null }
    } catch (error) {
      console.error("Error updating subscription status:", error)
      return {
        success: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Activate trial for a user
   * @deprecated This method is deprecated. Trials are now managed by RevenueCat.
   * Use RevenueCat's trial system instead of this custom implementation.
   */
  static async activateTrial(userId: string): Promise<{
    success: boolean
    error: PostgrestError | null
  }> {
    console.warn("activateTrial is deprecated. Trials are now managed by RevenueCat.")
    return {
      success: false,
      error: {
        message: "Trials are now managed by RevenueCat. Use RevenueCat's trial system instead.",
        details: "This method is deprecated",
        hint: "Use RevenueCat's trial system",
        code: "DEPRECATED_METHOD",
      } as PostgrestError,
    }
  }

  /**
   * Upgrade user to pro subscription
   */
  static async upgradeToPro(
    userId: string,
    expiresAt: string,
  ): Promise<{
    success: boolean
    error: PostgrestError | null
  }> {
    try {
      const result = await this.updateSubscriptionStatus(userId, "pro", {
        subscription_expires_at: expiresAt,
      })

      if (result.success) {
        // Track pro upgrade
        await AnalyticsService.trackEvent({
          name: AnalyticsEvents.PRO_UPGRADE,
          properties: {
            userId,
            subscriptionExpiresAt: expiresAt,
          },
        })
      }

      return result
    } catch (error) {
      console.error("Error upgrading to pro:", error)
      return {
        success: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get all available subscription plans
   */
  static async getSubscriptionPlans(): Promise<{
    plans: SubscriptionPlan[] | null
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true })

      if (error) {
        console.error("Error getting subscription plans:", error)
        return { plans: null, error }
      }

      return { plans: data as SubscriptionPlan[], error: null }
    } catch (error) {
      console.error("Error getting subscription plans:", error)
      return {
        plans: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update user usage counts (triggers automatically, but can be called manually)
   */
  static async updateUserUsage(userId: string): Promise<{
    success: boolean
    error: PostgrestError | null
  }> {
    try {
      const { error } = await supabase.rpc("update_user_usage", {
        user_uuid: userId,
      })

      if (error) {
        console.error("Error updating user usage:", error)
        return { success: false, error }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Error updating user usage:", error)
      return {
        success: false,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Initialize usage for all existing users (run once after migration)
   */
  static async initializeAllUserUsage(): Promise<{
    count: number | null
    error: PostgrestError | null
  }> {
    try {
      const { data, error } = await supabase.rpc("initialize_all_user_usage")

      if (error) {
        console.error("Error initializing user usage:", error)
        return { count: null, error }
      }

      return { count: data as number, error: null }
    } catch (error) {
      console.error("Error initializing user usage:", error)
      return {
        count: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Check if user is approaching limits
   */
  static async isApproachingLimits(userId: string): Promise<{
    approaching: boolean
    details: {
      groups: { current: number; max: number; percentage: number }
      items: { current: number; max: number; percentage: number }
      lists: { current: number; max: number; percentage: number }
    } | null
    error: PostgrestError | null
  }> {
    try {
      const { info, error } = await this.getSubscriptionInfo(userId)

      if (error) {
        return { approaching: false, details: null, error }
      }

      if (!info) {
        return { approaching: false, details: null, error: null }
      }

      const groupsPercentage = info.max_groups > 0 ? (info.groups_count / info.max_groups) * 100 : 0
      const itemsPercentage = info.max_items > 0 ? (info.items_count / info.max_items) * 100 : 0
      const listsPercentage = info.max_lists > 0 ? (info.lists_count / info.max_lists) * 100 : 0

      const approaching = groupsPercentage >= 80 || itemsPercentage >= 80 || listsPercentage >= 80

      const details = approaching
        ? {
            groups: {
              current: info.groups_count,
              max: info.max_groups,
              percentage: groupsPercentage,
            },
            items: {
              current: info.items_count,
              max: info.max_items,
              percentage: itemsPercentage,
            },
            lists: {
              current: info.lists_count,
              max: info.max_lists,
              percentage: listsPercentage,
            },
          }
        : null

      return { approaching, details, error: null }
    } catch (error) {
      console.error("Error checking approaching limits:", error)
      return { approaching: false, details: null, error: error as PostgrestError }
    }
  }
}
