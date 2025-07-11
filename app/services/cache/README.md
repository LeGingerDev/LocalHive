# Groups Caching System

This directory contains the smart caching system for the groups functionality in the Visu app.

## Overview

The caching system provides intelligent data management that:
- Caches groups and invitations data locally
- Only fetches new data when there are actual changes
- Uses hash-based change detection
- Implements TTL (Time To Live) for cache freshness
- Provides pull-to-refresh functionality
- Automatically refreshes when the screen comes into focus

## Architecture

### CacheService
The main caching service that handles:
- Data storage and retrieval using MMKV
- Hash generation for change detection
- Cache validation and TTL management
- Cache statistics and debugging

### CacheDebugger
A utility for monitoring cache performance and debugging:
- Log cache statistics
- Monitor performance metrics
- Clear cache for testing
- Simulate cache expiration

## How It Works

### 1. Initial Load
When the groups screen loads:
1. Check if valid cached data exists
2. If yes, load from cache immediately (fast)
3. If no, fetch from Supabase and cache the result

### 2. Smart Refresh
When the screen comes into focus or pull-to-refresh is triggered:
1. Check if cache TTL has expired (5 minutes)
2. If expired, fetch fresh data from Supabase
3. Compare new data with cached data using hash
4. Only update UI if data has actually changed

### 3. Change Detection
- Uses simple hash function on JSON stringified data
- Compares current data hash with cached hash
- Updates cache only when hash differs

### 4. Cache Invalidation
Cache is automatically invalidated when:
- Data is older than 30 minutes (MAX_CACHE_AGE)
- Cache version doesn't match current version
- User performs actions that modify data (create/delete group, respond to invitation)

## Configuration

### Cache Settings
- **TTL**: 5 minutes (when cache is considered "stale")
- **Max Age**: 30 minutes (when cache is considered "expired")
- **Version**: "1.0.0" (for cache versioning)

### Storage
- Uses MMKV for fast, persistent storage
- Cache key: `groups_cache`
- Stores both groups and invitations data

## Usage

### In Components
```typescript
import { useGroups } from "@/hooks/useGroups"

const { groups, invitations, loading, refreshGroups } = useGroups()

// Manual refresh
const handleRefresh = () => {
  refreshGroups()
}
```

### Debugging
```typescript
import { CacheDebugger } from "@/services/cache"

// Log cache statistics
CacheDebugger.logCacheStats()

// Log performance metrics
CacheDebugger.logPerformanceMetrics()

// Clear cache
CacheDebugger.clearCacheWithLog()
```

## Benefits

1. **Performance**: Instant loading from cache when available
2. **Efficiency**: Only fetches data when necessary
3. **User Experience**: Smooth, responsive interface
4. **Battery Life**: Reduces unnecessary network requests
5. **Offline Support**: Works with cached data when offline

## Monitoring

The system provides comprehensive logging in development mode:
- Cache hit/miss rates
- Data change detection
- Performance metrics
- Error handling

## Future Enhancements

- Background sync with push notifications
- Incremental updates for large datasets
- Cache compression for storage efficiency
- Multi-user cache isolation
- Cache warming strategies 