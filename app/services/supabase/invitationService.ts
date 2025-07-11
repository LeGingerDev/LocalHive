import { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import {
  GroupInvitation,
  InvitationStatus,
  Profile,
  Group,
} from "@/services/api/types"

/**
 * Service for handling invitation-related operations with Supabase
 */
export class InvitationService {
  /**
   * Get all pending invitations for the current user
   */
  static async getPendingInvitations(): Promise<{ data: GroupInvitation[] | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitationsError || !invitationsData) {
        return { data: null, error: invitationsError }
      }

      if (invitationsData.length === 0) {
        return { data: [], error: null }
      }

      // Enrich with related data
      const enrichedInvitations = await this._enrichInvitations(invitationsData)
      return { data: enrichedInvitations, error: null }
    } catch (error) {
      console.error('Error getting pending invitations:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get all invitations sent by the current user
   */
  static async getSentInvitations(): Promise<{ data: GroupInvitation[] | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false })

      if (invitationsError || !invitationsData) {
        return { data: null, error: invitationsError }
      }

      if (invitationsData.length === 0) {
        return { data: [], error: null }
      }

      // Enrich with related data
      const enrichedInvitations = await this._enrichInvitations(invitationsData)
      return { data: enrichedInvitations, error: null }
    } catch (error) {
      console.error('Error getting sent invitations:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create an invitation by personal_code only
   */
  static async createInvitationByCode(groupId: string, personalCode: string): Promise<{ data: GroupInvitation | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Find the invitee by personal_code
      const { data: inviteeProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('personal_code', personalCode)
        .single()

      if (profileError || !inviteeProfile) {
        return { data: null, error: { message: "User not found with this invitation code", details: "", hint: "", code: "404" } as PostgrestError }
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', inviteeProfile.id)
        .single()

      if (existingMembership) {
        return { 
          data: null, 
          error: { message: "User is already a member of this group", details: "", hint: "", code: "409" } as PostgrestError 
        }
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('group_invitations')
        .select('id')
        .eq('group_id', groupId)
        .eq('invitee_id', inviteeProfile.id)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        return { 
          data: null, 
          error: { message: "An invitation has already been sent to this user", details: "", hint: "", code: "409" } as PostgrestError 
        }
      }

      // Create the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeProfile.id,
          status: 'pending',
        })
        .select('*')
        .single()

      if (invitationError || !invitation) {
        return { data: null, error: invitationError }
      }

      // Enrich the invitation with related data
      const enrichedInvitation = await this._enrichSingleInvitation(invitation)
      return { data: enrichedInvitation, error: null }
    } catch (error) {
      console.error('Error creating invitation by code:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Respond to an invitation (accept or decline)
   */
  static async respondToInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<{ data: GroupInvitation | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Get the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        return { 
          data: null, 
          error: { message: "Invitation not found or already responded to", details: "", hint: "", code: "404" } as PostgrestError 
        }
      }

      // Update the invitation status
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('group_invitations')
        .update({ status })
        .eq('id', invitationId)
        .select('*')
        .single()

      if (updateError || !updatedInvitation) {
        return { data: null, error: updateError }
      }

      // If accepted, add user to group
      if (status === 'accepted') {
        const { error: membershipError } = await supabase
          .from('group_members')
          .insert({
            group_id: invitation.group_id,
            user_id: user.id,
            role: 'member',
          })

        if (membershipError) {
          console.error('Error adding user to group after accepting invitation:', membershipError)
          // Don't fail the whole operation, just log the error
        }
      }

      // Enrich the invitation with related data
      const enrichedInvitation = await this._enrichSingleInvitation(updatedInvitation)
      return { data: enrichedInvitation, error: null }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Cancel an invitation (only the inviter can do this)
   */
  static async cancelInvitation(invitationId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Check if user is the inviter
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('inviter_id', user.id)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        return { 
          error: { message: "Invitation not found or you don't have permission to cancel it", details: "", hint: "", code: "404" } as PostgrestError 
        }
      }

      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('group_invitations')
        .delete()
        .eq('id', invitationId)

      return { error: deleteError }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get invitation statistics for a group
   */
  static async getGroupInvitationStats(groupId: string): Promise<{ 
    data: { 
      pending: number; 
      accepted: number; 
      declined: number; 
      total: number 
    } | null; 
    error: PostgrestError | null 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Check if user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return { 
          data: null, 
          error: { message: "You must be a member of this group to view invitation stats", details: "", hint: "", code: "403" } as PostgrestError 
        }
      }

      const { data: stats, error: statsError } = await supabase
        .from('group_invitations')
        .select('status')
        .eq('group_id', groupId)

      if (statsError || !stats) {
        return { data: null, error: statsError }
      }

      const result = {
        pending: stats.filter(s => s.status === 'pending').length,
        accepted: stats.filter(s => s.status === 'accepted').length,
        declined: stats.filter(s => s.status === 'declined').length,
        total: stats.length,
      }

      return { data: result, error: null }
    } catch (error) {
      console.error('Error getting invitation stats:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Private helper to enrich invitations with related data
   */
  private static async _enrichInvitations(invitations: any[]): Promise<GroupInvitation[]> {
    if (invitations.length === 0) return []

    // Get all unique IDs
    const groupIds = [...new Set(invitations.map(inv => inv.group_id))]
    const inviterIds = [...new Set(invitations.map(inv => inv.inviter_id))]
    const inviteeIds = [...new Set(invitations.map(inv => inv.invitee_id))]

    // Fetch related data
    const [groupsResult, inviterProfilesResult, inviteeProfilesResult] = await Promise.all([
      supabase.from('groups').select('*').in('id', groupIds),
      supabase.from('profiles').select('*').in('id', inviterIds),
      supabase.from('profiles').select('*').in('id', inviteeIds),
    ])

    const groups = groupsResult.data || []
    const inviterProfiles = inviterProfilesResult.data || []
    const inviteeProfiles = inviteeProfilesResult.data || []

    // Enrich invitations
    return invitations.map(invitation => ({
      ...invitation,
      group: groups.find(g => g.id === invitation.group_id) || null,
      inviter: inviterProfiles.find(p => p.id === invitation.inviter_id) || null,
      invitee: inviteeProfiles.find(p => p.id === invitation.invitee_id) || null,
    })) as GroupInvitation[]
  }

  /**
   * Private helper to enrich a single invitation
   */
  private static async _enrichSingleInvitation(invitation: any): Promise<GroupInvitation> {
    const enriched = await this._enrichInvitations([invitation])
    return enriched[0]
  }
} 