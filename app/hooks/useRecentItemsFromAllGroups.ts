import { useState, useEffect, useCallback, useRef } from "react"

import { useAuth } from "@/context/AuthContext"
import { ItemService, ItemWithProfile } from "@/services/supabase/itemService"

export interface RecentItemWithGroup extends ItemWithProfile {
  group_name: string
}

export const useRecentItemsFromAllGroups = (limit: number = 5) => {
  const { user } = useAuth()
  const [items, setItems] = useState<RecentItemWithGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastRefreshTimeRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)

  const fetchRecentItems = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await ItemService.getRecentItemsFromAllGroups(
        user.id,
        limit,
      )

      if (fetchError) {
        setError(fetchError.message)
        setItems([])
      } else {
        setItems(data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recent items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit])

  useEffect(() => {
    fetchRecentItems()
  }, [fetchRecentItems])

  // Throttled refresh function
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log("[useRecentItems] Refresh skipped - already refreshing")
      return
    }

    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current

    // Prevent refreshing more than once every 1 second
    if (timeSinceLastRefresh < 1000) {
      console.log(
        `[useRecentItems] Refresh throttled - last refresh was ${timeSinceLastRefresh}ms ago`,
      )
      return
    }

    isRefreshingRef.current = true
    lastRefreshTimeRef.current = now

    try {
      console.log("[useRecentItems] Refreshing recent items data")
      await fetchRecentItems()
      console.log("[useRecentItems] Recent items data refresh completed")
    } finally {
      isRefreshingRef.current = false
    }
  }, [fetchRecentItems])

  return {
    items,
    loading,
    error,
    refresh,
  }
}
