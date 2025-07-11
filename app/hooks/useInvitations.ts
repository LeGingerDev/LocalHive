import { useState, useEffect, useCallback, useRef } from "react"

import { useAuth } from "@/context/AuthContext"
import { GroupInvitation } from "@/services/api/types"
import { CacheService } from "@/services/cache/cacheService"
import { InvitationService } from "@/services/supabase/invitationService"

export const useInvitations = () => {
  const { user } = useAuth()
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const lastFetchRef = useRef<{ pending: GroupInvitation[]; sent: GroupInvitation[] } | null>(null)

  // Load pending invitations
  const loadPendingInvitations = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!forceRefresh && pendingInvitations.length === 0) {
          const cachedData = CacheService.getCachedInvitations(user?.id)
          if (cachedData && cachedData.pending.length >= 0) {
            setPendingInvitations(cachedData.pending)
            return
          }
        }
        setLoading(true)
        setError(null)
        const { data, error } = await InvitationService.getPendingInvitations()
        if (error) {
          setError(error.message)
          return
        }
        const invitationsData = data || []
        const hasChanged = CacheService.hasInvitationsChanged(
          invitationsData,
          sentInvitations,
          user?.id,
        )
        if (hasChanged || forceRefresh) {
          setPendingInvitations(invitationsData)
          CacheService.saveInvitationsCache(invitationsData, sentInvitations, user?.id)
          lastFetchRef.current = { pending: invitationsData, sent: sentInvitations }
        }
      } catch (err) {
        setError("Failed to load invitations")
      } finally {
        setLoading(false)
      }
    },
    [pendingInvitations.length, sentInvitations, user?.id],
  )

  // Load sent invitations
  const loadSentInvitations = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!forceRefresh && sentInvitations.length === 0) {
          const cachedData = CacheService.getCachedInvitations(user?.id)
          if (cachedData && cachedData.sent.length >= 0) {
            setSentInvitations(cachedData.sent)
            return
          }
        }
        const { data, error } = await InvitationService.getSentInvitations()
        if (error) {
          return
        }
        const invitationsData = data || []
        const hasChanged = CacheService.hasInvitationsChanged(
          pendingInvitations,
          invitationsData,
          user?.id,
        )
        if (hasChanged || forceRefresh) {
          setSentInvitations(invitationsData)
          CacheService.saveInvitationsCache(pendingInvitations, invitationsData, user?.id)
          lastFetchRef.current = { pending: pendingInvitations, sent: invitationsData }
        }
      } catch (err) {}
    },
    [pendingInvitations, sentInvitations.length, user?.id],
  )

  // Invite by code
  const inviteByCode = useCallback(async (groupId: string, personalCode: string) => {
    setError(null)
    const { data, error } = await InvitationService.createInvitationByCode(groupId, personalCode)
    if (error) {
      setError(error.message)
      return null
    }
    // Optionally update sentInvitations state here if needed
    return data
  }, [])

  // Respond to an invitation
  const respondToInvitation = useCallback(
    async (invitationId: string, status: "accepted" | "declined") => {
      try {
        const { data, error } = await InvitationService.respondToInvitation(invitationId, status)
        if (error) {
          return false
        }
        setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
        if (data) {
          setSentInvitations((prev) =>
            prev.map((inv) => (inv.id === invitationId ? { ...inv, status: data.status } : inv)),
          )
        }
        return true
      } catch (err) {
        return false
      }
    },
    [],
  )

  // Cancel an invitation
  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const { error } = await InvitationService.cancelInvitation(invitationId)
        if (error) {
          return false
        }
        setSentInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
        return true
      } catch (err) {
        return false
      }
    },
    [pendingInvitations],
  )

  // Get invitation stats for a group
  const getGroupInvitationStats = useCallback(async (groupId: string) => {
    try {
      const { data, error } = await InvitationService.getGroupInvitationStats(groupId)
      if (error) {
        return null
      }
      return data
    } catch (err) {
      return null
    }
  }, [])

  // Smart refresh function
  const refreshInvitations = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (CacheService.shouldRefreshInvitations(user?.id)) {
        await loadPendingInvitations(true)
        await loadSentInvitations(true)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [loadPendingInvitations, loadSentInvitations, user?.id])

  // Force refresh function
  const forceRefreshInvitations = useCallback(async () => {
    setIsRefreshing(true)
    try {
      CacheService.clearInvitationsCache(user?.id)
      await loadPendingInvitations(true)
      await loadSentInvitations(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [loadPendingInvitations, loadSentInvitations, user?.id])

  useEffect(() => {
    loadPendingInvitations()
    loadSentInvitations()
  }, [user?.id])

  // Clear caches when user changes
  useEffect(() => {
    if (user?.id) {
      console.log("useInvitations: User changed, clearing caches and reloading data")
      // Clear caches for the new user to ensure fresh data
      CacheService.clearInvitationsCache(user.id)
      // Reset state
      setPendingInvitations([])
      setSentInvitations([])
      setError(null)
      // Load fresh data
      loadPendingInvitations(true)
      loadSentInvitations(true)
    }
  }, [user?.id])

  return {
    pendingInvitations,
    sentInvitations,
    loading,
    error,
    isRefreshing,
    loadPendingInvitations,
    loadSentInvitations,
    refreshInvitations,
    forceRefreshInvitations,
    inviteByCode,
    respondToInvitation,
    cancelInvitation,
    getGroupInvitationStats,
  }
}
