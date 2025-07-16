import { useState, useEffect, useCallback } from "react"

import { useAuth } from "@/context/AuthContext"
import { ItemService, ItemWithProfile } from "@/services/supabase/itemService"

export const useItems = (groupId?: string) => {
  const { user } = useAuth()
  const [items, setItems] = useState<ItemWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!user || !groupId) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await ItemService.getGroupItemsWithProfiles(groupId)

      if (fetchError) {
        setError(fetchError.message)
        setItems([])
      } else {
        setItems(data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user, groupId])

  const getRecentItems = useCallback(
    (limit: number = 3) => {
      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    },
    [items],
  )

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    getRecentItems,
  }
}
