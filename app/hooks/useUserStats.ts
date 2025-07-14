import { useState, useEffect, useCallback } from "react"

import { useAuth } from "@/context/AuthContext"
import { GroupService } from "@/services/supabase/groupService"
import { ItemService } from "@/services/supabase/itemService"

export interface UserStats {
  groupsCount: number
  itemsCount: number
  groupsCreatedCount: number
}

export const useUserStats = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({ groupsCount: 0, itemsCount: 0, groupsCreatedCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user?.id) {
      setStats({ groupsCount: 0, itemsCount: 0, groupsCreatedCount: 0 })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch groups count
      const { data: groupsData, error: groupsError } = await GroupService.getUserGroups()
      if (groupsError) {
        console.error("Error loading groups for stats:", groupsError)
      }

      // Fetch items count
      const { data: itemsCount, error: itemsError } = await ItemService.getUserItemsCount(user.id)
      if (itemsError) {
        console.error("Error loading items count for stats:", itemsError)
      }

      // Fetch groups created count
      const { count: groupsCreatedCount, error: groupsCreatedError } = await GroupService.getGroupsCreatedCount(user.id)
      if (groupsCreatedError) {
        console.error("Error loading groups created count for stats:", groupsCreatedError)
      }

      setStats({
        groupsCount: groupsData?.length || 0,
        itemsCount: itemsCount || 0,
        groupsCreatedCount: groupsCreatedCount || 0,
      })
    } catch (err) {
      console.error("Error loading user stats:", err)
      setError("Failed to load user statistics")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const refreshStats = useCallback(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refreshStats,
  }
}
