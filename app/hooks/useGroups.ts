import { useState, useEffect, useCallback, useRef } from "react"

import { useAuth } from "@/context/AuthContext"
import { Group, GroupInvitation, CreateGroupData } from "@/services/api/types"
import { CacheService } from "@/services/cache/cacheService"
import { GroupService } from "@/services/supabase/groupService"

export const useGroups = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const lastFetchRef = useRef<{ groups: Group[]; invitations: GroupInvitation[] } | null>(null)

  // 🔥 ADD THIS: Debug test that runs once when hook first loads
  useEffect(() => {
    console.log("🚀 Running debug test...")
    GroupService.debugTest()
  }, [])

  const loadGroups = useCallback(
    async (forceRefresh = false) => {
      try {
        console.log("useGroups: Starting to load groups...", { forceRefresh })

        // Only check cache if we're not forcing refresh and we have no current groups
        if (!forceRefresh && groups.length === 0) {
          console.log("useGroups: No groups loaded, checking cache for data")
          const cachedData = CacheService.getCachedGroups(user?.id)
          console.log("useGroups: Cache check result:", {
            hasCachedData: !!cachedData,
            cachedGroupsCount: cachedData?.groups?.length || 0,
            cachedInvitationsCount: cachedData?.invitations?.length || 0,
          })

          if (cachedData && cachedData.groups.length > 0) {
            console.log("useGroups: Using cached data", {
              groupsCount: cachedData.groups.length,
              invitationsCount: cachedData.invitations.length,
            })
            setGroups(cachedData.groups)
            setInvitations(cachedData.invitations)
            setLoading(false)
            setError(null)
            return
          }
        }

        console.log("useGroups: Fetching fresh data from API")

        setLoading(true)
        setError(null)

        const { data, error } = await GroupService.getUserGroups()

        console.log("useGroups: GroupService.getUserGroups result:", {
          data: data
            ? { count: data.length, groups: data.map((g) => ({ id: g.id, name: g.name })) }
            : null,
          error,
        })

        if (error) {
          console.error("useGroups: Error loading groups:", error)
          setError(error.message)
          return
        }

        const groupsData = data || []
        console.log("useGroups: Processed groups data:", {
          count: groupsData.length,
          groups: groupsData.map((g) => ({ id: g.id, name: g.name })),
        })

        // Get current invitations for cache comparison
        const currentInvitations = invitations

        // Check if data has actually changed
        const hasChanged = CacheService.hasGroupsChanged(groupsData, currentInvitations, user?.id)

        if (hasChanged || forceRefresh) {
          console.log("useGroups: Data has changed, updating state and cache")
          setGroups(groupsData)
          CacheService.saveGroupsCache(groupsData, currentInvitations, user?.id)
          lastFetchRef.current = { groups: groupsData, invitations: currentInvitations }
        } else {
          console.log("useGroups: No changes detected, keeping current data")
        }

        console.log("useGroups: Groups loaded successfully:", groupsData.length, "groups")
      } catch (err) {
        console.error("useGroups: Exception loading groups:", err)
        setError("Failed to load groups")
      } finally {
        setLoading(false)
        console.log("useGroups: Loading finished")
      }
    },
    [user?.id],
  )

  const loadInvitations = useCallback(
    async (forceRefresh = false) => {
      try {
        console.log("useGroups: Starting to load invitations...", { forceRefresh })

        // Only check cache if we're not forcing refresh and we have no current invitations
        if (!forceRefresh && invitations.length === 0) {
          console.log("useGroups: No invitations loaded, checking cache for data")
          const cachedData = CacheService.getCachedGroups(user?.id)
          console.log("useGroups: Cache check for invitations:", {
            hasCachedData: !!cachedData,
            cachedInvitationsCount: cachedData?.invitations?.length || 0,
          })

          if (cachedData && cachedData.invitations.length >= 0) {
            console.log("useGroups: Using cached invitations")
            setInvitations(cachedData.invitations)
            return
          }
        }

        console.log("useGroups: Fetching fresh invitations from API")

        const { data, error } = await GroupService.getPendingInvitations()

        console.log("useGroups: GroupService.getPendingInvitations result:", { data, error })

        if (error) {
          console.error("useGroups: Error loading invitations:", error)
          return
        }

        const invitationsData = data || []

        // Get current groups for cache comparison
        const currentGroups = groups

        // Check if data has actually changed
        const hasChanged = CacheService.hasGroupsChanged(currentGroups, invitationsData, user?.id)

        if (hasChanged || forceRefresh) {
          console.log("useGroups: Invitations have changed, updating state and cache")
          setInvitations(invitationsData)
          CacheService.saveGroupsCache(currentGroups, invitationsData, user?.id)
          lastFetchRef.current = { groups: currentGroups, invitations: invitationsData }
        } else {
          console.log("useGroups: No invitation changes detected, keeping current data")
        }

        console.log(
          "useGroups: Invitations loaded successfully:",
          invitationsData.length,
          "invitations",
        )
      } catch (err) {
        console.error("useGroups: Exception loading invitations:", err)
      }
    },
    [user?.id],
  )

  const createGroup = useCallback(
    async (groupData: CreateGroupData) => {
      try {
        setError(null)

        console.log("useGroups: Creating group with data:", groupData)

        const { data, error } = await GroupService.createGroup(groupData)

        if (error) {
          setError(error.message)
          return null
        }

        if (data) {
          console.log("useGroups: Group created successfully:", { id: data.id, name: data.name })

          // Update both groups and cache immediately
          setGroups((prev) => {
            const newGroups = [data, ...prev]
            console.log("useGroups: Updated groups state:", {
              previousCount: prev.length,
              newCount: newGroups.length,
              newGroup: { id: data.id, name: data.name },
            })

            // Update cache with new data immediately
            CacheService.saveGroupsCache(newGroups, invitations, user?.id)
            console.log("useGroups: Cache updated with new group")

            return newGroups
          })

          // Also update the lastFetchRef to keep it in sync
          lastFetchRef.current = {
            groups: [data, ...groups],
            invitations,
          }
        }

        return data
      } catch (err) {
        setError("Failed to create group")
        console.error("Error creating group:", err)
        return null
      }
    },
    [user?.id],
  )

  const respondToInvitation = useCallback(
    async (invitationId: string, status: "accepted" | "declined") => {
      console.log("🔍 [useGroups] respondToInvitation called with:", { invitationId, status })
      console.log("🔍 [useGroups] Current user ID:", user?.id)
      console.log("🔍 [useGroups] Current invitations count:", invitations.length)
      console.log("🔍 [useGroups] Current groups count:", groups.length)

      try {
        console.log("🔍 [useGroups] Calling GroupService.respondToInvitation...")
        const { data, error } = await GroupService.respondToInvitation(invitationId, status)

        console.log("🔍 [useGroups] GroupService.respondToInvitation returned:", {
          hasData: !!data,
          hasError: !!error,
          data: data,
          error: error,
        })

        if (error) {
          console.error("🔍 [useGroups] Error from GroupService:", error)
          console.error("🔍 [useGroups] Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          return false
        }

        console.log("🔍 [useGroups] No error from GroupService, processing response...")

        if (status === "accepted" && data?.group) {
          console.log("🔍 [useGroups] Invitation accepted, adding group to state:", {
            id: data.group.id,
            name: data.group.name,
          })

          // Add the group to the user's groups if accepted
          setGroups((prev) => {
            const newGroups = [data.group!, ...prev]
            console.log("🔍 [useGroups] Updated groups after accepting invitation:", {
              previousCount: prev.length,
              newCount: newGroups.length,
              newGroup: { id: data.group!.id, name: data.group!.name },
            })

            // Update cache with new data
            CacheService.saveGroupsCache(
              newGroups,
              invitations.filter((inv) => inv.id !== invitationId),
              user?.id,
            )
            console.log("🔍 [useGroups] Cache updated after accepting invitation")

            return newGroups
          })
        } else if (status === "declined") {
          console.log("🔍 [useGroups] Invitation declined, no group to add")
        }

        // Remove the invitation from the list
        console.log("🔍 [useGroups] Removing invitation from state:", invitationId)
        setInvitations((prev) => {
          const updatedInvitations = prev.filter((inv) => inv.id !== invitationId)
          console.log("🔍 [useGroups] Updated invitations after response:", {
            previousCount: prev.length,
            newCount: updatedInvitations.length,
            removedInvitationId: invitationId,
          })

          return updatedInvitations
        })

        console.log("🔍 [useGroups] respondToInvitation completed successfully")
        return true
      } catch (err) {
        console.error("🔍 [useGroups] Exception in respondToInvitation:", err)
        console.error("🔍 [useGroups] Exception details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
          invitationId: invitationId,
          status: status,
        })
        return false
      }
    },
    [user?.id, invitations, groups],
  )

  const deleteGroup = useCallback(
    async (groupId: string) => {
      try {
        console.log("useGroups: Deleting group:", groupId)

        const { error } = await GroupService.deleteGroup(groupId)

        if (error) {
          console.error("Error deleting group:", error)
          return false
        }

        // Remove the group from the list and update cache
        setGroups((prev) => {
          const updatedGroups = prev.filter((group) => group.id !== groupId)
          console.log("useGroups: Updated groups after deletion:", {
            previousCount: prev.length,
            newCount: updatedGroups.length,
          })

          // Update cache with new data
          CacheService.saveGroupsCache(updatedGroups, invitations, user?.id)
          console.log("useGroups: Cache updated after group deletion")

          return updatedGroups
        })

        return true
      } catch (err) {
        console.error("Error deleting group:", err)
        return false
      }
    },
    [user?.id],
  )

  useEffect(() => {
    console.log(
      "useGroups: useEffect triggered, calling loadGroups and loadInvitations in parallel",
    )
    console.log("useGroups: Current state:", {
      loading,
      groupsCount: groups.length,
      invitationsCount: invitations.length,
      error,
    })

    // Load both in parallel for better performance
    Promise.all([loadGroups(), loadInvitations()]).catch((error) => {
      console.error("useGroups: Error loading data in parallel:", error)
    })
  }, []) // Empty dependency array since loadGroups and loadInvitations are now stable

  // Clear caches when user changes
  useEffect(() => {
    if (user?.id) {
      console.log("useGroups: User changed, clearing caches and reloading data in parallel")
      // Clear caches for the new user to ensure fresh data
      CacheService.clearGroupsCache(user.id)
      // Reset state
      setGroups([])
      setInvitations([])
      setError(null)
      // Load fresh data in parallel
      Promise.all([loadGroups(true), loadInvitations(true)]).catch((error) => {
        console.error("useGroups: Error loading data for new user:", error)
      })
    }
  }, [user?.id])

  // Smart refresh function that only fetches if needed
  const refreshGroups = useCallback(async () => {
    console.log("useGroups: Smart refresh triggered")
    setIsRefreshing(true)

    try {
      // Check if we need to refresh based on cache TTL
      if (CacheService.shouldRefreshGroups(user?.id)) {
        console.log("useGroups: Cache TTL expired, fetching fresh data in parallel")
        await Promise.all([loadGroups(true), loadInvitations(true)])
      } else {
        console.log("useGroups: Cache still fresh, no refresh needed")
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [loadGroups, loadInvitations, user?.id])

  // Force refresh function that bypasses cache completely
  const forceRefreshGroups = useCallback(async () => {
    console.log("useGroups: Force refresh triggered")
    setIsRefreshing(true)

    try {
      // Clear cache and fetch fresh data in parallel
      CacheService.clearGroupsCache(user?.id)
      console.log("useGroups: Cache cleared, fetching fresh data in parallel")
      await Promise.all([loadGroups(true), loadInvitations(true)])
    } finally {
      setIsRefreshing(false)
    }
  }, [loadGroups, loadInvitations, user?.id])

  return {
    groups,
    invitations,
    loading,
    error,
    isRefreshing,
    loadGroups,
    loadInvitations,
    refreshGroups,
    forceRefreshGroups,
    createGroup,
    respondToInvitation,
    deleteGroup,
  }
}
