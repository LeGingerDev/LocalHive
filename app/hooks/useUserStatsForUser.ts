import { useState, useEffect, useCallback } from "react"

import { SubscriptionService } from "@/services/subscriptionService"
import { GroupService } from "@/services/supabase/groupService"

export interface UserStatsForUser {
  groupsCount: number
  itemsCount: number
  groupsCreatedCount: number
}

export const useUserStatsForUser = (userId: string | null) => {
  const [stats, setStats] = useState<UserStatsForUser>({
    groupsCount: 0,
    itemsCount: 0,
    groupsCreatedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!userId) {
      setStats({ groupsCount: 0, itemsCount: 0, groupsCreatedCount: 0 })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get groups and items count from user_usage table
      const { usage, error: usageError } = await SubscriptionService.getUserUsage(userId)
      if (usageError) {
        console.error("Error loading user usage for stats:", usageError)
      }

      // Get groups created count separately
      const { count: groupsCreatedCount, error: groupsCreatedError } =
        await GroupService.getGroupsCreatedCount(userId)
      if (groupsCreatedError) {
        console.error("Error loading groups created count for stats:", groupsCreatedError)
      }

      setStats({
        groupsCount: usage?.groups_count || 0,
        itemsCount: usage?.items_count || 0,
        groupsCreatedCount: groupsCreatedCount || 0,
      })
    } catch (err) {
      console.error("Error loading user stats for user:", err)
      setError("Failed to load user statistics")
    } finally {
      setLoading(false)
    }
  }, [userId])

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
