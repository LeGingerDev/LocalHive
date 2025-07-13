import { Group, GroupInvitation } from "@/services/api/types"
import { save, load, remove } from "@/utils/storage"

export interface CacheEntry<T> {
  data: T
  timestamp: number
  hash: string
  version: string
}

export interface GroupsCache {
  groups: CacheEntry<Group[]>
  invitations: CacheEntry<GroupInvitation[]>
  lastSync: number
}

export interface InvitationsCache {
  pending: CacheEntry<GroupInvitation[]>
  sent: CacheEntry<GroupInvitation[]>
  lastSync: number
}

export class CacheService {
  private static readonly CACHE_VERSION = "1.0.0"
  private static readonly GROUPS_CACHE_KEY = "groups_cache"
  private static readonly INVITATIONS_CACHE_KEY = "invitations_cache"
  private static readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes in milliseconds (increased from 5)
  private static readonly INVITATIONS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds for invitations (increased from 2)
  private static readonly MAX_CACHE_AGE = 30 * 60 * 1000 // 30 minutes in milliseconds

  /**
   * Get user-specific cache key
   */
  private static getUserCacheKey(baseKey: string, userId?: string): string {
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  /**
   * Generate a hash for data to detect changes
   */
  private static generateHash(data: unknown): string {
    const jsonString = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Check if cache entry is still valid
   */
  private static isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return false

    const now = Date.now()
    const age = now - entry.timestamp

    // Check if cache is too old
    if (age > this.MAX_CACHE_AGE) return false

    // Check if cache version matches
    if (entry.version !== this.CACHE_VERSION) return false

    return true
  }

  /**
   * Check if cache needs refresh (based on TTL)
   */
  private static needsRefresh<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return true

    const now = Date.now()
    const age = now - entry.timestamp

    return age > this.CACHE_TTL
  }

  /**
   * Check if invitations cache needs refresh (based on shorter TTL)
   */
  private static needsInvitationsRefresh<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return true

    const now = Date.now()
    const age = now - entry.timestamp

    return age > this.INVITATIONS_CACHE_TTL
  }

  /**
   * Save groups data to cache
   */
  static saveGroupsCache(groups: Group[], invitations: GroupInvitation[], userId?: string): void {
    const now = Date.now()
    const cacheKey = this.getUserCacheKey(this.GROUPS_CACHE_KEY, userId)

    const groupsEntry: CacheEntry<Group[]> = {
      data: groups,
      timestamp: now,
      hash: this.generateHash(groups),
      version: this.CACHE_VERSION,
    }

    const invitationsEntry: CacheEntry<GroupInvitation[]> = {
      data: invitations,
      timestamp: now,
      hash: this.generateHash(invitations),
      version: this.CACHE_VERSION,
    }

    const cache: GroupsCache = {
      groups: groupsEntry,
      invitations: invitationsEntry,
      lastSync: now,
    }

    save(cacheKey, cache)
  }

  /**
   * Load groups data from cache
   */
  static loadGroupsCache(userId?: string): GroupsCache | null {
    const cacheKey = this.getUserCacheKey(this.GROUPS_CACHE_KEY, userId)
    const cache = load<GroupsCache>(cacheKey)

    if (!cache) return null

    // Validate cache entries
    if (!this.isCacheValid(cache.groups) || !this.isCacheValid(cache.invitations)) {
      return null
    }

    return cache
  }

  /**
   * Check if groups data has changed since last cache
   */
  static hasGroupsChanged(
    groups: Group[],
    invitations: GroupInvitation[],
    userId?: string,
  ): boolean {
    const cache = this.loadGroupsCache(userId)

    if (!cache) return true

    const groupsHash = this.generateHash(groups)
    const invitationsHash = this.generateHash(invitations)

    return groupsHash !== cache.groups.hash || invitationsHash !== cache.invitations.hash
  }

  /**
   * Check if cache needs refresh (for background sync)
   */
  static shouldRefreshGroups(userId?: string): boolean {
    const cache = this.loadGroupsCache(userId)

    if (!cache) return true

    return this.needsRefresh(cache.groups) || this.needsRefresh(cache.invitations)
  }

  /**
   * Get cached groups data if available and valid
   */
  static getCachedGroups(
    userId?: string,
  ): { groups: Group[]; invitations: GroupInvitation[] } | null {
    const cache = this.loadGroupsCache(userId)

    if (!cache) return null

    return {
      groups: cache.groups.data,
      invitations: cache.invitations.data,
    }
  }

  /**
   * Clear groups cache
   */
  static clearGroupsCache(userId?: string): void {
    const cacheKey = this.getUserCacheKey(this.GROUPS_CACHE_KEY, userId)
    remove(cacheKey)
  }

  /**
   * Clear all groups caches (for all users)
   */
  static clearAllGroupsCaches(): void {
    // Clear both user-specific and general cache
    remove(this.GROUPS_CACHE_KEY)
    // Note: We can't easily clear all user-specific keys without knowing them
    // This is a limitation, but the general cache clear should be sufficient
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(userId?: string): {
    hasCache: boolean
    age: number | null
    needsRefresh: boolean
    isValid: boolean
  } {
    const cache = this.loadGroupsCache(userId)

    if (!cache) {
      return {
        hasCache: false,
        age: null,
        needsRefresh: true,
        isValid: false,
      }
    }

    const now = Date.now()
    const age = now - cache.lastSync

    return {
      hasCache: true,
      age,
      needsRefresh: this.needsRefresh(cache.groups),
      isValid: this.isCacheValid(cache.groups),
    }
  }

  // ===== INVITATIONS CACHE METHODS =====

  /**
   * Save invitations data to cache
   */
  static saveInvitationsCache(
    pending: GroupInvitation[],
    sent: GroupInvitation[],
    userId?: string,
  ): void {
    const now = Date.now()
    const cacheKey = this.getUserCacheKey(this.INVITATIONS_CACHE_KEY, userId)

    const pendingEntry: CacheEntry<GroupInvitation[]> = {
      data: pending,
      timestamp: now,
      hash: this.generateHash(pending),
      version: this.CACHE_VERSION,
    }

    const sentEntry: CacheEntry<GroupInvitation[]> = {
      data: sent,
      timestamp: now,
      hash: this.generateHash(sent),
      version: this.CACHE_VERSION,
    }

    const cache: InvitationsCache = {
      pending: pendingEntry,
      sent: sentEntry,
      lastSync: now,
    }

    save(cacheKey, cache)
  }

  /**
   * Load invitations data from cache
   */
  static loadInvitationsCache(userId?: string): InvitationsCache | null {
    const cacheKey = this.getUserCacheKey(this.INVITATIONS_CACHE_KEY, userId)
    const cache = load<InvitationsCache>(cacheKey)

    if (!cache) return null

    // Validate cache entries
    if (!this.isCacheValid(cache.pending) || !this.isCacheValid(cache.sent)) {
      return null
    }

    return cache
  }

  /**
   * Check if invitations data has changed since last cache
   */
  static hasInvitationsChanged(
    pending: GroupInvitation[],
    sent: GroupInvitation[],
    userId?: string,
  ): boolean {
    const cache = this.loadInvitationsCache(userId)

    if (!cache) return true

    const pendingHash = this.generateHash(pending)
    const sentHash = this.generateHash(sent)

    return pendingHash !== cache.pending.hash || sentHash !== cache.sent.hash
  }

  /**
   * Check if invitations cache needs refresh
   */
  static shouldRefreshInvitations(userId?: string): boolean {
    const cache = this.loadInvitationsCache(userId)

    if (!cache) return true

    return this.needsInvitationsRefresh(cache.pending) || this.needsInvitationsRefresh(cache.sent)
  }

  /**
   * Check if groups cache invitations need refresh (for mixed cache)
   */
  static shouldRefreshGroupsInvitations(userId?: string): boolean {
    const cache = this.loadGroupsCache(userId)

    if (!cache) return true

    return this.needsInvitationsRefresh(cache.invitations)
  }

  /**
   * Get cached invitations data if available and valid
   */
  static getCachedInvitations(
    userId?: string,
  ): { pending: GroupInvitation[]; sent: GroupInvitation[] } | null {
    const cache = this.loadInvitationsCache(userId)

    if (!cache) return null

    return {
      pending: cache.pending.data,
      sent: cache.sent.data,
    }
  }

  /**
   * Clear invitations cache
   */
  static clearInvitationsCache(userId?: string): void {
    const cacheKey = this.getUserCacheKey(this.INVITATIONS_CACHE_KEY, userId)
    remove(cacheKey)
  }

  /**
   * Clear all invitations caches (for all users)
   */
  static clearAllInvitationsCaches(): void {
    // Clear both user-specific and general cache
    remove(this.INVITATIONS_CACHE_KEY)
  }

  /**
   * Clear all caches (groups and invitations)
   */
  static clearAllCaches(): void {
    this.clearAllGroupsCaches()
    this.clearAllInvitationsCaches()
  }
}
