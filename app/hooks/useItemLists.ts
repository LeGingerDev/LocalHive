import { useState, useEffect } from "react"

import { useAuth } from "@/context/AuthContext"
import {
  ItemListService,
  type ItemList,
  type CreateListData,
} from "@/services/supabase/itemListService"

export const useItemLists = () => {
  const { user } = useAuth()
  const [lists, setLists] = useState<ItemList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = async () => {
    if (!user?.id) {
      setLists([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await ItemListService.getUserLists(user.id)

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setLists(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lists")
    } finally {
      setLoading(false)
    }
  }

  const createList = async (listData: Omit<CreateListData, "user_id">) => {
    if (!user?.id) {
      throw new Error("User not authenticated")
    }

    try {
      setError(null)

      const { data, error: createError } = await ItemListService.createList({
        ...listData,
        user_id: user.id,
      })

      if (createError) {
        throw new Error(createError.message)
      }

      if (data) {
        setLists((prevLists) => [data, ...prevLists])
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create list"
      setError(errorMessage)
      throw err
    }
  }

  const deleteList = async (listId: string) => {
    try {
      setError(null)

      const { error: deleteError } = await ItemListService.deleteList(listId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setLists((prevLists) => prevLists.filter((list) => list.id !== listId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete list"
      setError(errorMessage)
      throw err
    }
  }

  const archiveList = async (listId: string) => {
    try {
      setError(null)

      const { data, error: archiveError } = await ItemListService.archiveList(listId)

      if (archiveError) {
        throw new Error(archiveError.message)
      }

      if (data) {
        setLists((prevLists) => prevLists.filter((list) => list.id !== listId))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to archive list"
      setError(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchLists()
  }, [user?.id])

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    archiveList,
    refetch: fetchLists,
  }
}
