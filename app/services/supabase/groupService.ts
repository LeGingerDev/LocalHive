import { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import {
  Group,
  GroupMember,
  GroupInvitation,
  GroupPost,
  CreateGroupData,
  UpdateGroupData,
  CreateInvitationData,
  GroupWithDetails,
  MemberRole,
  InvitationStatus,
} from "@/services/api/types"

/**
 * Service for handling group-related operations with Supabase
 */
export class GroupService {
  /**
   * Get all groups for the current user
   */
  static async getUserGroups(): Promise<{ data: Group[] | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // First get group IDs where user is a member (avoids recursion)
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (membershipError) {
        return { data: null, error: membershipError }
      }

      if (!membershipData || membershipData.length === 0) {
        return { data: [], error: null }
      }

      const groupIds = membershipData.map(m => m.group_id)

      // Get the groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      if (groupsError || !groupsData) {
        return { data: null, error: groupsError }
      }

      // Get creator profiles
      const creatorIds = [...new Set(groupsData.map(g => g.creator_id))]
      const { data: creatorProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', creatorIds)

      // Combine data
      const enrichedGroups = groupsData.map(group => ({
        ...group,
        creator: creatorProfiles?.find(profile => profile.id === group.creator_id) || null
      }))

      return { data: enrichedGroups as Group[], error: null }
    } catch (error) {
      console.error('Error getting user groups:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get a single group by ID with details
   */
  static async getGroupById(groupId: string): Promise<{ data: GroupWithDetails | null; error: PostgrestError | null }> {
    try {
      // Get basic group data
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) return { data: null, error: groupError }

      // Get group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)

      // Get group posts
      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get all user IDs to fetch profiles
      const userIds = new Set<string>()
      userIds.add(groupData.creator_id)
      membersData?.forEach(member => userIds.add(member.user_id))
      postsData?.forEach(post => userIds.add(post.user_id))
      
      const userIdsArray = Array.from(userIds)

      // Get user profiles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIdsArray)

      // Enrich data with profiles
      const creator = userProfiles?.find(p => p.id === groupData.creator_id) || null
      const enrichedMembers = membersData?.map(member => ({
        ...member,
        user: userProfiles?.find(p => p.id === member.user_id) || null
      })) || []
      const enrichedPosts = postsData?.map(post => ({
        ...post,
        user: userProfiles?.find(p => p.id === post.user_id) || null
      })) || []

      // Transform data to match GroupWithDetails interface
      const groupWithDetails: GroupWithDetails = {
        ...groupData,
        creator,
        members: enrichedMembers,
        recent_posts: enrichedPosts,
        catalogs: [], // This would need to be implemented based on your catalog system
      }

      return { data: groupWithDetails, error: null }
    } catch (error) {
      console.error('Error getting group by ID:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(groupData: CreateGroupData): Promise<{ data: Group | null; error: PostgrestError | null }> {
    try {
      console.log("🏗️ [createGroup] START - Input data:", groupData)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("❌ [createGroup] User auth error:", userError)
        return { 
          data: null, 
          error: {
            message: userError.message || "Authentication error",
            details: "",
            hint: "",
            code: "401"
          } as PostgrestError
        }
      }
      
      if (!user) {
        console.log("❌ [createGroup] No authenticated user found")
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      console.log("✅ [createGroup] User authenticated:", { userId: user.id, email: user.email })

      // Create the group without trying to join with profiles
      const groupPayload = {
        ...groupData,
        creator_id: user.id,
      }
      console.log("📝 [createGroup] Inserting group with payload:", groupPayload)

      const { data: groupResult, error: groupError } = await supabase
        .from('groups')
        .insert(groupPayload)
        .select('*')
        .single()

      if (groupError) {
        console.error("❌ [createGroup] Group insertion error:", groupError)
        return { data: null, error: groupError }
      }

      if (!groupResult) {
        console.error("❌ [createGroup] No group result returned")
        return { data: null, error: { message: "No group created", details: "", hint: "", code: "500" } as PostgrestError }
      }

      console.log("✅ [createGroup] Group created successfully:", groupResult)

      // Get creator profile separately
      console.log("👤 [createGroup] Fetching creator profile...")
      const { data: creatorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error("⚠️ [createGroup] Creator profile fetch error (continuing anyway):", profileError)
      } else {
        console.log("✅ [createGroup] Creator profile fetched:", creatorProfile)
      }

      // Add creator as admin member
      console.log("👥 [createGroup] Adding creator as admin member...")
      const memberResult = await this.addMember(groupResult.id, user.id, 'admin')
      
      if (memberResult.error) {
        console.error("⚠️ [createGroup] Failed to add creator as member (continuing anyway):", memberResult.error)
      } else {
        console.log("✅ [createGroup] Creator added as admin member:", memberResult.data)
      }

      // Combine the data
      const enrichedGroup = {
        ...groupResult,
        creator: creatorProfile || null
      }

      console.log("🎉 [createGroup] SUCCESS - Returning enriched group:", enrichedGroup)
      return { data: enrichedGroup as Group, error: null }
    } catch (error) {
      console.error('💥 [createGroup] Unexpected error:', error)
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          details: "",
          hint: "",
          code: "500"
        } as PostgrestError,
      }
    }
  }

  /**
   * Update a group
   */
  static async updateGroup(groupId: string, updateData: UpdateGroupData): Promise<{ data: Group | null; error: PostgrestError | null }> {
    try {
      // Update the group without trying to join with profiles
      const { data: groupResult, error: groupError } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select('*')
        .single()

      if (groupError || !groupResult) {
        return { data: null, error: groupError }
      }

      // Get creator profile separately
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', groupResult.creator_id)
        .single()

      // Combine the data
      const enrichedGroup = {
        ...groupResult,
        creator: creatorProfile || null
      }

      return { data: enrichedGroup as Group, error: null }
    } catch (error) {
      console.error('Error updating group:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      return { error }
    } catch (error) {
      console.error('Error deleting group:', error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Add a member to a group
   */
  static async addMember(groupId: string, userId: string, role: MemberRole = 'member'): Promise<{ data: GroupMember | null; error: PostgrestError | null }> {
    try {
      // Insert the member
      const { data: memberResult, error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
        })
        .select('*')
        .single()

      if (memberError || !memberResult) {
        return { data: null, error: memberError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Combine data
      const enrichedMember = {
        ...memberResult,
        user: userProfile || null
      }

      return { data: enrichedMember as GroupMember, error: null }
    } catch (error) {
      console.error('Error adding member to group:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Remove a member from a group
   */
  static async removeMember(groupId: string, userId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      console.error('Error removing member from group:', error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<{ data: GroupMember | null; error: PostgrestError | null }> {
    try {
      // Update the member role
      const { data: memberResult, error: memberError } = await supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (memberError || !memberResult) {
        return { data: null, error: memberError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Combine data
      const enrichedMember = {
        ...memberResult,
        user: userProfile || null
      }

      return { data: enrichedMember as GroupMember, error: null }
    } catch (error) {
      console.error('Error updating member role:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get pending invitations for the current user
   */
  static async getPendingInvitations(): Promise<{ data: GroupInvitation[] | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // First, get the basic invitation data
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

      // Get group data for invitations
      const groupIds = [...new Set(invitationsData.map(inv => inv.group_id))]
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)

      // Get all unique user IDs (inviters) to fetch their profiles
      const inviterIds = [...new Set(invitationsData.map(inv => inv.inviter_id))]
      const { data: inviterProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', inviterIds)

      // Get current user's profile for invitee data
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Combine the data
      const enrichedInvitations = invitationsData.map(invitation => ({
        ...invitation,
        group: groupsData?.find(g => g.id === invitation.group_id) || null,
        inviter: inviterProfiles?.find(profile => profile.id === invitation.inviter_id) || null,
        invitee: currentUserProfile
      }))

      return { data: enrichedInvitations as GroupInvitation[], error: null }
    } catch (error) {
      console.error('Error getting pending invitations:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create an invitation
   */
  static async createInvitation(invitationData: CreateInvitationData): Promise<{ data: GroupInvitation | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // First, find the user by email
      const { data: inviteeProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invitationData.invitee_email)
        .single()

      if (profileError || !inviteeProfile) {
        return { 
          data: null, 
          error: { message: "User not found", details: "", hint: "", code: "404" } as PostgrestError 
        }
      }

      // Create the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .insert({
          group_id: invitationData.group_id,
          inviter_id: user.id,
          invitee_id: inviteeProfile.id,
          status: 'pending',
        })
        .select('*')
        .single()

      if (invitationError || !invitation) {
        return { data: null, error: invitationError }
      }

      // Get the group data
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('id', invitationData.group_id)
        .single()

      // Get inviter profile
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get invitee profile (full data)
      const { data: fullInviteeProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', inviteeProfile.id)
        .single()

      // Combine the data
      const enrichedInvitation = {
        ...invitation,
        group: group || null,
        inviter: inviterProfile || null,
        invitee: fullInviteeProfile || null
      }

      return { data: enrichedInvitation as GroupInvitation, error: null }
    } catch (error) {
      console.error('Error creating invitation:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Respond to an invitation
   */
  static async respondToInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<{ data: GroupInvitation | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Update the invitation status
      const { data: invitation, error: updateError } = await supabase
        .from('group_invitations')
        .update({ status })
        .eq('id', invitationId)
        .eq('invitee_id', user.id)
        .select('*')
        .single()

      if (updateError || !invitation) {
        return { data: null, error: updateError }
      }

      // If accepted, add user to group
      if (status === 'accepted') {
        await this.addMember(invitation.group_id, user.id, 'member')
      }

      // Get the group data
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('id', invitation.group_id)
        .single()

      // Get inviter profile
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invitation.inviter_id)
        .single()

      // Get invitee profile
      const { data: inviteeProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Combine the data
      const enrichedInvitation = {
        ...invitation,
        group: group || null,
        inviter: inviterProfile || null,
        invitee: inviteeProfile || null
      }

      return { data: enrichedInvitation as GroupInvitation, error: null }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a post in a group
   */
  static async createPost(groupId: string, content: string, mediaUrls?: string[]): Promise<{ data: GroupPost | null; error: PostgrestError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: "User not authenticated", details: "", hint: "", code: "401" } as PostgrestError }
      }

      // Create the post
      const { data: postResult, error: postError } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          media_urls: mediaUrls,
        })
        .select('*')
        .single()

      if (postError || !postResult) {
        return { data: null, error: postError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Combine data
      const enrichedPost = {
        ...postResult,
        user: userProfile || null
      }

      return { data: enrichedPost as GroupPost, error: null }
    } catch (error) {
      console.error('Error creating post:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get posts for a group
   */
  static async getGroupPosts(groupId: string, limit: number = 20): Promise<{ data: GroupPost[] | null; error: PostgrestError | null }> {
    try {
      // Get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (postsError || !postsData) {
        return { data: null, error: postsError }
      }

      if (postsData.length === 0) {
        return { data: [], error: null }
      }

      // Get user profiles for all posts
      const userIds = [...new Set(postsData.map(post => post.user_id))]
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      // Combine data
      const enrichedPosts = postsData.map(post => ({
        ...post,
        user: userProfiles?.find(profile => profile.id === post.user_id) || null
      }))

      return { data: enrichedPosts as GroupPost[], error: null }
    } catch (error) {
      console.error('Error getting group posts:', error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId)

      return { error }
    } catch (error) {
      console.error('Error deleting post:', error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Debug method to test basic queries
   */
  static async debugTest(): Promise<void> {
    try {
      console.log("=== DEBUG TEST START ===")
      
      // Test 1: Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log("Current user:", user?.id, userError)
      
      // Test 2: Try to get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      console.log("Profiles query:", profiles?.length, profilesError)
      
      // Test 3: Try to get group_invitations (basic)
      const { data: invitations, error: invitationsError } = await supabase
        .from('group_invitations')
        .select('*')
        .limit(5)
      console.log("Invitations query:", invitations?.length, invitationsError)
      
      // Test 4: Try to get groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .limit(5)
      console.log("Groups query:", groups?.length, groupsError)

      // Test 5: Try to get group_members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .limit(5)
      console.log("Group members query:", members?.length, membersError)
      
      console.log("=== DEBUG TEST END ===")
    } catch (error) {
      console.error("Debug test failed:", error)
    }
  }
}