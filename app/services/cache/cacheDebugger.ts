import { CacheService } from "./cacheService"

export class CacheDebugger {
  /**
   * Log detailed cache statistics
   */
  static logCacheStats(): void {
    const stats = CacheService.getCacheStats()

    console.log("🔍 Cache Statistics:")
    console.log("  - Has Cache:", stats.hasCache)
    console.log("  - Age:", stats.age ? `${Math.round(stats.age / 1000)}s` : "N/A")
    console.log("  - Needs Refresh:", stats.needsRefresh)
    console.log("  - Is Valid:", stats.isValid)

    if (stats.hasCache && stats.age !== null) {
      const ageMinutes = Math.round(stats.age / (1000 * 60))
      console.log(`  - Age in minutes: ${ageMinutes}m`)
    }
  }

  /**
   * Log cache performance metrics
   */
  static logPerformanceMetrics(): void {
    const stats = CacheService.getCacheStats()

    if (stats.hasCache) {
      const hitRate = stats.isValid ? "HIT" : "MISS"
      const freshness = stats.needsRefresh ? "STALE" : "FRESH"

      console.log(`📊 Cache Performance: ${hitRate} | ${freshness}`)
    } else {
      console.log("📊 Cache Performance: NO_CACHE")
    }
  }

  /**
   * Clear cache and log the action
   */
  static clearCacheWithLog(): void {
    console.log("🧹 Clearing groups cache...")
    CacheService.clearGroupsCache()
    console.log("✅ Groups cache cleared")
  }

  /**
   * Simulate cache expiration for testing
   */
  static simulateCacheExpiration(): void {
    console.log("🧪 Simulating cache expiration...")
    // This would require modifying the cache service to accept a custom timestamp
    // For now, we'll just clear the cache
    this.clearCacheWithLog()
  }
}
