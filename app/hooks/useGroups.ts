import { useState, useEffect, useCallback, useRef } from "react"

import { useAuth } from "@/context/AuthContext"
import { Group, GroupInvitation, CreateGroupData } from "@/services/api/types"
import { GroupService } from "@/services/supabase/groupService"

export const useGroups = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastUserIdRef = useRef<string | null>(null)

  // Simple function to load all data
  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Load groups and invitations in parallel for better performance
      const [groupsResult, invitationsResult] = await Promise.all([
        GroupService.getUserGroups(),
        GroupService.getPendingInvitations()
      ])
      
      // Check for errors in either call
      if (groupsResult.error) {
        setError(groupsResult.error.message)
        return
      }
      
      if (invitationsResult.error) {
        setError(invitationsResult.error.message)
        return
      }

      setGroups(groupsResult.data || [])
      setInvitations(invitationsResult.data || [])
    } catch (err) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load data on mount and when user changes
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id
      loadData()
    } else if (!user) {
      lastUserIdRef.current = null
      setGroups([])
      setInvitations([])
      setError(null)
    }
  }, [user?.id]) // Only depend on user.id, not the entire user object

  // Simple refresh function
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Create group
  const createGroup = useCallback(async (groupData: CreateGroupData) => {
    if (!user) return null

    try {
      setError(null)
      const { data, error } = await GroupService.createGroup(groupData)

      if (error) {
        setError(error.message)
        return null
      }

      if (data) {
        setGroups(prev => [data, ...prev])
      }

      return data
    } catch (err) {
      setError("Failed to create group")
      return null
    }
  }, [user])

  // Respond to invitation
  const respondToInvitation = useCallback(async (invitationId: string, status: "accepted" | "declined") => {
    if (!user) return false

    try {
      const { data, error } = await GroupService.respondToInvitation(invitationId, status)

      if (error) {
        setError(error.message)
        return false
      }

      // Remove invitation from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

      // Add group to list if accepted
      if (status === "accepted" && data?.group) {
        setGroups(prev => [data.group!, ...prev])
      }

      return true
    } catch (err) {
      setError("Failed to respond to invitation")
      return false
    }
  }, [user])

  // Delete group
  const deleteGroup = useCallback(async (groupId: string) => {
    if (!user) return false

    try {
      const { error } = await GroupService.deleteGroup(groupId)

      if (error) {
        setError(error.message)
        return false
      }

      setGroups(prev => prev.filter(group => group.id !== groupId))
      return true
    } catch (err) {
      setError("Failed to delete group")
      return false
    }
  }, [user])

  return {
    groups,
    invitations,
    loading,
    error,
    refresh,
    createGroup,
    respondToInvitation,
    deleteGroup,
  }
}
