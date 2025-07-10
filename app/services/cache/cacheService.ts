import { save, load, remove } from "@/utils/storage"
import { Group, GroupInvitation } from "@/services/api/types"

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

export class CacheService {
  private static readonly CACHE_VERSION = "1.0.0"
  private static readonly GROUPS_CACHE_KEY = "groups_cache"
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  private static readonly MAX_CACHE_AGE = 30 * 60 * 1000 // 30 minutes in milliseconds

  /**
   * Generate a hash for data to detect changes
   */
  private static generateHash(data: unknown): string {
    const jsonString = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
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
   * Save groups data to cache
   */
  static saveGroupsCache(groups: Group[], invitations: GroupInvitation[]): void {
    const now = Date.now()
    
    const groupsEntry: CacheEntry<Group[]> = {
      data: groups,
      timestamp: now,
      hash: this.generateHash(groups),
      version: this.CACHE_VERSION
    }
    
    const invitationsEntry: CacheEntry<GroupInvitation[]> = {
      data: invitations,
      timestamp: now,
      hash: this.generateHash(invitations),
      version: this.CACHE_VERSION
    }
    
    const cache: GroupsCache = {
      groups: groupsEntry,
      invitations: invitationsEntry,
      lastSync: now
    }
    
    save(this.GROUPS_CACHE_KEY, cache)
  }

  /**
   * Load groups data from cache
   */
  static loadGroupsCache(): GroupsCache | null {
    const cache = load<GroupsCache>(this.GROUPS_CACHE_KEY)
    
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
  static hasGroupsChanged(groups: Group[], invitations: GroupInvitation[]): boolean {
    const cache = this.loadGroupsCache()
    
    if (!cache) return true
    
    const groupsHash = this.generateHash(groups)
    const invitationsHash = this.generateHash(invitations)
    
    return groupsHash !== cache.groups.hash || invitationsHash !== cache.invitations.hash
  }

  /**
   * Check if cache needs refresh (for background sync)
   */
  static shouldRefreshGroups(): boolean {
    const cache = this.loadGroupsCache()
    
    if (!cache) return true
    
    return this.needsRefresh(cache.groups) || this.needsRefresh(cache.invitations)
  }

  /**
   * Get cached groups data if available and valid
   */
  static getCachedGroups(): { groups: Group[]; invitations: GroupInvitation[] } | null {
    const cache = this.loadGroupsCache()
    
    if (!cache) return null
    
    return {
      groups: cache.groups.data,
      invitations: cache.invitations.data
    }
  }

  /**
   * Clear groups cache
   */
  static clearGroupsCache(): void {
    remove(this.GROUPS_CACHE_KEY)
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): {
    hasCache: boolean
    age: number | null
    needsRefresh: boolean
    isValid: boolean
  } {
    const cache = this.loadGroupsCache()
    
    if (!cache) {
      return {
        hasCache: false,
        age: null,
        needsRefresh: true,
        isValid: false
      }
    }
    
    const now = Date.now()
    const age = now - cache.lastSync
    
    return {
      hasCache: true,
      age,
      needsRefresh: this.needsRefresh(cache.groups),
      isValid: this.isCacheValid(cache.groups)
    }
  }
} 