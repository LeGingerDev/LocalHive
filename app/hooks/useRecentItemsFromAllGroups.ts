import { useState, useEffect, useCallback } from "react"

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

  const fetchRecentItems = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await ItemService.getRecentItemsFromAllGroups(user.id, limit)

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

  return {
    items,
    loading,
    error,
    refresh: fetchRecentItems,
  }
} 