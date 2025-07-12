import { useState, useEffect, useCallback } from "react"

import { ItemService, type ItemCategory } from "@/services/supabase/itemService"

interface UseItemCategoriesReturn {
  categories: ItemCategory[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing item categories
 */
export const useItemCategories = (): UseItemCategoriesReturn => {
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await ItemService.getCategories()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (data) {
        setCategories(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch categories"
      setError(errorMessage)
      console.error("[useItemCategories] Error fetching categories:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    refetch,
  }
}
