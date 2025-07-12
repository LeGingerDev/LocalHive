import { PostgrestError } from "@supabase/supabase-js"

import Config from "@/config"
import {
  Group,
  GroupMember,
  GroupInvitation,
  GroupPost,
  CreateGroupData,
  UpdateGroupData,
  GroupWithDetails,
  MemberRole,
  InvitationStatus,
} from "@/services/api/types"

import { supabase } from "./supabase"

/**
 * Service for handling group-related operations with Supabase
 */
export class GroupService {
  /**
   * Get all groups for the current user
   */
  static async getUserGroups(): Promise<{ data: Group[] | null; error: PostgrestError | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return {
          data: null,
          error: {
            message: "User not authenticated",
            details: "",
            hint: "",
            code: "401",
          } as PostgrestError,
        }
      }

      // First get group IDs where user is a member (avoids recursion)
      const { data: membershipData, error: membershipError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)

      if (membershipError) {
        return { data: null, error: membershipError }
      }

      if (!membershipData || membershipData.length === 0) {
        return { data: [], error: null }
      }

      const groupIds = membershipData.map((m) => m.group_id)

      // Get the groups with member counts and item counts
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select(
          `
          *,
          member_count:group_members(count),
          item_count:items(count)
        `,
        )
        .in("id", groupIds)
        .order("created_at", { ascending: false })

      if (groupsError || !groupsData) {
        return { data: null, error: groupsError }
      }

      // Get creator profiles
      const creatorIds = [...new Set(groupsData.map((g) => g.creator_id))]
      const { data: creatorProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", creatorIds)

      // Combine data and ensure member_count and item_count are numbers
      const enrichedGroups = groupsData.map((group) => ({
        ...group,
        member_count: group.member_count?.[0]?.count || 0,
        item_count: group.item_count?.[0]?.count || 0,
        creator: creatorProfiles?.find((profile) => profile.id === group.creator_id) || null,
      }))

      return { data: enrichedGroups as Group[], error: null }
    } catch (error) {
      console.error("Error getting user groups:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get a single group by ID with details
   */
  static async getGroupById(
    groupId: string,
  ): Promise<{ data: GroupWithDetails | null; error: PostgrestError | null }> {
    try {
      // Get basic group data
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single()

      if (groupError) return { data: null, error: groupError }

      // Get group members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)

      // Get group posts
      const { data: postsData, error: postsError } = await supabase
        .from("group_posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(10)

      // Get all user IDs to fetch profiles
      const userIds = new Set<string>()
      userIds.add(groupData.creator_id)
      membersData?.forEach((member) => userIds.add(member.user_id))
      postsData?.forEach((post) => userIds.add(post.user_id))

      const userIdsArray = Array.from(userIds)

      // Get user profiles
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIdsArray)

      // Enrich data with profiles
      const creator = userProfiles?.find((p) => p.id === groupData.creator_id) || null
      const enrichedMembers =
        membersData?.map((member) => ({
          ...member,
          user: userProfiles?.find((p) => p.id === member.user_id) || null,
        })) || []
      const enrichedPosts =
        postsData?.map((post) => ({
          ...post,
          user: userProfiles?.find((p) => p.id === post.user_id) || null,
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
      console.error("Error getting group by ID:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(
    groupData: CreateGroupData,
  ): Promise<{ data: Group | null; error: PostgrestError | null }> {
    console.log("🏗️ [createGroup] START - Input data:", groupData)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error("❌ [createGroup] User auth error:", userError)
      return {
        data: null,
        error: {
          message: userError.message || "Authentication error",
          details: "",
          hint: "",
          code: "401",
        } as PostgrestError,
      }
    }

    if (!user) {
      console.log("❌ [createGroup] No authenticated user found")
      return {
        data: null,
        error: {
          message: "User not authenticated",
          details: "",
          hint: "",
          code: "401",
        } as PostgrestError,
      }
    }

    console.log("✅ [createGroup] User authenticated:", { userId: user.id, email: user.email })

    // 🔥 ADD DEBUG CALL BEFORE GROUP CREATION
    console.log("🔍 Running authentication debug before group creation...")
    await this.debugAuthentication()

    // Create the group without trying to join with profiles
    const groupPayload = {
      ...groupData,
      creator_id: user.id,
    }
    console.log("📝 [createGroup] Inserting group with payload:", groupPayload)

    // Check if it's a token timing issue
    console.log("🔍 Final token check before insert...")
    const { data: sessionCheck } = await supabase.auth.getSession()
    console.log("Session just before insert:", {
      hasToken: !!sessionCheck.session?.access_token,
      expiresAt: sessionCheck.session?.expires_at,
      currentTime: Math.floor(Date.now() / 1000),
      isExpired: sessionCheck.session?.expires_at
        ? sessionCheck.session.expires_at < Math.floor(Date.now() / 1000)
        : "unknown",
    })

    // Try refreshing the session before insert
    console.log("🔄 Refreshing session before insert...")
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    console.log("Session refresh result:", {
      error: refreshError,
      hasNewToken: !!refreshed.session?.access_token,
      newExpiresAt: refreshed.session?.expires_at,
    })

    const { data: groupResult, error: groupError } = await supabase
      .from("groups")
      .insert(groupPayload)
      .select("*")
      .single()

    if (groupError) {
      console.error("❌ [createGroup] Group insertion error:", groupError)

      // 🔥 RUN DEBUG AGAIN AFTER FAILURE
      console.log("🔍 Running debug again after failure...")
      await this.debugAuthentication()

      return { data: null, error: groupError }
    }

    if (!groupResult) {
      console.error("❌ [createGroup] No group result returned")
      return {
        data: null,
        error: {
          message: "No group created",
          details: "",
          hint: "",
          code: "500",
        } as PostgrestError,
      }
    }

    console.log("✅ [createGroup] Group created successfully:", groupResult)

    // Get creator profile separately
    console.log("👤 [createGroup] Fetching creator profile...")
    const { data: creatorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error(
        "⚠️ [createGroup] Creator profile fetch error (continuing anyway):",
        profileError,
      )
    } else {
      console.log("✅ [createGroup] Creator profile fetched:", creatorProfile)
    }

    // Add creator as admin member
    console.log("👥 [createGroup] Adding creator as admin member...")
    const memberResult = await this.addMember(groupResult.id, user.id, "admin")

    if (memberResult.error) {
      console.error(
        "⚠️ [createGroup] Failed to add creator as member (continuing anyway):",
        memberResult.error,
      )
    } else {
      console.log("✅ [createGroup] Creator added as admin member:", memberResult.data)
    }

    // Combine the data
    const enrichedGroup = {
      ...groupResult,
      creator: creatorProfile || null,
    }

    console.log("🎉 [createGroup] SUCCESS - Returning enriched group:", enrichedGroup)
    return { data: enrichedGroup as Group, error: null }
  }

  /**
   * Update a group
   */
  static async updateGroup(
    groupId: string,
    updateData: UpdateGroupData,
  ): Promise<{ data: Group | null; error: PostgrestError | null }> {
    console.log("🛠️ [updateGroup] groupId:", groupId, "updateData:", updateData)
    try {
      // Update the group without trying to join with profiles
      const { data: groupResult, error: groupError } = await supabase
        .from("groups")
        .update(updateData)
        .eq("id", groupId)
        .select("*")
        .single()

      if (groupError || !groupResult) {
        return { data: null, error: groupError }
      }

      // Get creator profile separately
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", groupResult.creator_id)
        .single()

      // Combine the data
      const enrichedGroup = {
        ...groupResult,
        creator: creatorProfile || null,
      }

      return { data: enrichedGroup as Group, error: null }
    } catch (error) {
      console.error("Error updating group:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Delete a group (only creator or admin can delete)
   */
  static async deleteGroup(groupId: string): Promise<{ error: PostgrestError | null }> {
    console.log("🗑️ [deleteGroup] groupId:", groupId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return {
          error: {
            message: "User not authenticated",
            details: "",
            hint: "",
            code: "401",
          } as PostgrestError,
        }
      }

      // Check if user is the creator or has admin role
      const { data: membership, error: membershipError } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single()

      if (membershipError && membershipError.code !== "PGRST116") {
        return { error: membershipError }
      }

      // Get group to check if user is creator
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("creator_id")
        .eq("id", groupId)
        .single()

      if (groupError) {
        return { error: groupError }
      }

      // Check permissions: user must be creator or admin member
      const isCreator = group.creator_id === user.id
      const isAdmin = membership && membership.role === "admin"

      if (!isCreator && !isAdmin) {
        return {
          error: {
            message:
              "You don't have permission to delete this group. Only the creator or admin members can delete groups.",
            details: "",
            hint: "",
            code: "403",
          } as PostgrestError,
        }
      }

      // Delete the group (this will cascade to members, posts, invitations due to RLS)
      const { error: deleteError } = await supabase.from("groups").delete().eq("id", groupId)
      if (deleteError) {
        console.error("❌ [deleteGroup] Group deletion error:", deleteError)
        return { error: deleteError }
      }
      console.log("✅ [deleteGroup] Group deleted")
      return { error: null }
    } catch (error) {
      console.error("Error deleting group:", error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Add a member to a group
   */
  static async addMember(
    groupId: string,
    userId: string,
    role: MemberRole = "member",
  ): Promise<{ data: GroupMember | null; error: PostgrestError | null }> {
    console.log("➕ [addMember] groupId:", groupId, "userId:", userId, "role:", role)
    try {
      // Insert the member
      const { data: memberResult, error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
        })
        .select("*")
        .single()

      if (memberError || !memberResult) {
        return { data: null, error: memberError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      // Combine data
      const enrichedMember = {
        ...memberResult,
        user: userProfile || null,
      }

      return { data: enrichedMember as GroupMember, error: null }
    } catch (error) {
      console.error("Error adding member to group:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Remove a member from a group
   */
  static async removeMember(
    groupId: string,
    userId: string,
  ): Promise<{ error: PostgrestError | null }> {
    console.log("➖ [removeMember] groupId:", groupId, "userId:", userId)
    try {
      const { error: removeError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId)
      if (removeError) {
        console.error("❌ [removeMember] Remove member error:", removeError)
        return { error: removeError }
      }
      console.log("✅ [removeMember] Member removed")
      return { error: null }
    } catch (error) {
      console.error("Error removing member from group:", error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    groupId: string,
    userId: string,
    role: MemberRole,
  ): Promise<{ data: GroupMember | null; error: PostgrestError | null }> {
    console.log("🔄 [updateMemberRole] groupId:", groupId, "userId:", userId, "role:", role)
    try {
      // Update the member role
      const { data: memberResult, error: memberError } = await supabase
        .from("group_members")
        .update({ role })
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .select("*")
        .single()

      if (memberError || !memberResult) {
        return { data: null, error: memberError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      // Combine data
      const enrichedMember = {
        ...memberResult,
        user: userProfile || null,
      }

      return { data: enrichedMember as GroupMember, error: null }
    } catch (error) {
      console.error("Error updating member role:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get pending invitations for the current user
   */
  static async getPendingInvitations(): Promise<{
    data: GroupInvitation[] | null
    error: PostgrestError | null
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return {
          data: null,
          error: {
            message: "User not authenticated",
            details: "",
            hint: "",
            code: "401",
          } as PostgrestError,
        }
      }

      // First, get the basic invitation data
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("group_invitations")
        .select("*")
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (invitationsError || !invitationsData) {
        return { data: null, error: invitationsError }
      }

      if (invitationsData.length === 0) {
        return { data: [], error: null }
      }

      // Get group data for invitations
      const groupIds = [...new Set(invitationsData.map((inv) => inv.group_id))]
      const { data: groupsData } = await supabase.from("groups").select("*").in("id", groupIds)

      // Get all unique user IDs (inviters) to fetch their profiles
      const inviterIds = [...new Set(invitationsData.map((inv) => inv.inviter_id))]
      const { data: inviterProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", inviterIds)

      // Get current user's profile for invitee data
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      // Combine the data
      const enrichedInvitations = invitationsData.map((invitation) => ({
        ...invitation,
        group: groupsData?.find((g) => g.id === invitation.group_id) || null,
        inviter: inviterProfiles?.find((profile) => profile.id === invitation.inviter_id) || null,
        invitee: currentUserProfile,
      }))

      return { data: enrichedInvitations as GroupInvitation[], error: null }
    } catch (error) {
      console.error("Error getting pending invitations:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Respond to an invitation
   */
  static async respondToInvitation(
    invitationId: string,
    status: "accepted" | "declined",
  ): Promise<{ data: GroupInvitation | null; error: PostgrestError | null }> {
    console.log("📩 [respondToInvitation] invitationId:", invitationId, "status:", status)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return {
          data: null,
          error: {
            message: "User not authenticated",
            details: "",
            hint: "",
            code: "401",
          } as PostgrestError,
        }
      }

      if (status === "declined") {
        // Delete the invitation row
        const { error: deleteError } = await supabase
          .from("group_invitations")
          .delete()
          .eq("id", invitationId)
          .eq("invitee_id", user.id)
        if (deleteError) {
          return { data: null, error: deleteError }
        }
        return { data: null, error: null }
      }

      // Update the invitation status to accepted
      const { data: invitation, error: updateError } = await supabase
        .from("group_invitations")
        .update({ status })
        .eq("id", invitationId)
        .eq("invitee_id", user.id)
        .select("*")
        .single()

      if (updateError || !invitation) {
        return { data: null, error: updateError }
      }

      // If accepted, add user to group
      if (status === "accepted") {
        await this.addMember(invitation.group_id, user.id, "member")
      }

      // Get the group data
      const { data: group } = await supabase
        .from("groups")
        .select("*")
        .eq("id", invitation.group_id)
        .single()

      // Get inviter profile
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", invitation.inviter_id)
        .single()

      // Get invitee profile
      const { data: inviteeProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      // Combine the data
      const enrichedInvitation = {
        ...invitation,
        group: group || null,
        inviter: inviterProfile || null,
        invitee: inviteeProfile || null,
      }

      return { data: enrichedInvitation as GroupInvitation, error: null }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a post in a group
   */
  static async createPost(
    groupId: string,
    content: string,
    mediaUrls?: string[],
  ): Promise<{ data: GroupPost | null; error: PostgrestError | null }> {
    console.log("📝 [createPost] groupId:", groupId, "content:", content, "mediaUrls:", mediaUrls)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return {
          data: null,
          error: {
            message: "User not authenticated",
            details: "",
            hint: "",
            code: "401",
          } as PostgrestError,
        }
      }

      // Create the post
      const { data: postResult, error: postError } = await supabase
        .from("group_posts")
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          media_urls: mediaUrls,
        })
        .select("*")
        .single()

      if (postError || !postResult) {
        return { data: null, error: postError }
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      // Combine data
      const enrichedPost = {
        ...postResult,
        user: userProfile || null,
      }

      return { data: enrichedPost as GroupPost, error: null }
    } catch (error) {
      console.error("Error creating post:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get posts for a group
   */
  static async getGroupPosts(
    groupId: string,
    limit: number = 20,
  ): Promise<{ data: GroupPost[] | null; error: PostgrestError | null }> {
    try {
      // Get the posts
      const { data: postsData, error: postsError } = await supabase
        .from("group_posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (postsError || !postsData) {
        return { data: null, error: postsError }
      }

      if (postsData.length === 0) {
        return { data: [], error: null }
      }

      // Get user profiles for all posts
      const userIds = [...new Set(postsData.map((post) => post.user_id))]
      const { data: userProfiles } = await supabase.from("profiles").select("*").in("id", userIds)

      // Combine data
      const enrichedPosts = postsData.map((post) => ({
        ...post,
        user: userProfiles?.find((profile) => profile.id === post.user_id) || null,
      }))

      return { data: enrichedPosts as GroupPost[], error: null }
    } catch (error) {
      console.error("Error getting group posts:", error)
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
    console.log("🗑️ [deletePost] postId:", postId)
    try {
      const { error: deleteError } = await supabase.from("group_posts").delete().eq("id", postId)
      if (deleteError) {
        console.error("❌ [deletePost] Post deletion error:", deleteError)
        return { error: deleteError }
      }
      console.log("✅ [deletePost] Post deleted")
      return { error: null }
    } catch (error) {
      console.error("Error deleting post:", error)
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      console.log("Current user:", user?.id, userError)

      // Test 2: Try to get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .limit(5)
      console.log("Profiles query:", profiles?.length, profilesError)

      // Test 3: Try to get group_invitations (basic)
      const { data: invitations, error: invitationsError } = await supabase
        .from("group_invitations")
        .select("*")
        .limit(5)
      console.log("Invitations query:", invitations?.length, invitationsError)

      // Test 4: Try to get groups
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .limit(5)
      console.log("Groups query:", groups?.length, groupsError)

      // Test 5: Try to get group_members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .limit(5)
      console.log("Group members query:", members?.length, membersError)

      console.log("=== DEBUG TEST END ===")
    } catch (error) {
      console.error("Debug test failed:", error)
    }
  }

  /**
   * Debug authentication status and context
   */
  static async debugAuthentication(): Promise<void> {
    console.log("🔍 === AUTHENTICATION DEBUG START ===")

    try {
      // 1. Check current user from auth
      console.log("1️⃣ Checking auth.getUser()...")
      const { data: authData, error: authError } = await supabase.auth.getUser()
      console.log("Auth User Data:", {
        user: authData.user
          ? {
              id: authData.user.id,
              email: authData.user.email,
              aud: authData.user.aud,
              role: authData.user.role,
              app_metadata: authData.user.app_metadata,
              user_metadata: authData.user.user_metadata,
              created_at: authData.user.created_at,
              provider: authData.user.app_metadata?.provider,
              providers: authData.user.app_metadata?.providers,
              identities: authData.user.identities, // Add identities to see provider details
            }
          : null,
        error: authError,
      })

      // 2. Check current session
      console.log("2️⃣ Checking auth.getSession()...")
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log("Session Data:", {
        session: sessionData.session
          ? {
              access_token: sessionData.session.access_token ? "EXISTS" : "MISSING",
              refresh_token: sessionData.session.refresh_token ? "EXISTS" : "MISSING",
              user_id: sessionData.session.user?.id,
              user_role: sessionData.session.user?.role,
              user_aud: sessionData.session.user?.aud,
              provider_token: sessionData.session.provider_token ? "EXISTS" : "MISSING",
              provider_refresh_token: sessionData.session.provider_refresh_token
                ? "EXISTS"
                : "MISSING",
              expires_at: sessionData.session.expires_at,
              token_type: sessionData.session.token_type,
              expires_in: sessionData.session.expires_in,
            }
          : null,
        error: sessionError,
      })

      // Check for Google Auth specifically
      if (sessionData.session?.provider_token) {
        console.log("🔑 Google Auth token found!")

        // Check if token is valid by getting basic profile info
        try {
          console.log("Checking Google token validity...")
          const googleResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${sessionData.session.provider_token}`,
            },
          })

          if (googleResponse.ok) {
            const googleData = await googleResponse.json()
            console.log("✅ Google token is valid. Profile:", {
              sub: googleData.sub,
              email: googleData.email,
              name: googleData.name,
            })
          } else {
            console.log("❌ Google token is invalid:", await googleResponse.text())
          }
        } catch (error) {
          console.error("Error checking Google token:", error)
        }
      } else {
        console.log("⚠️ No Google Auth token found in session")
      }

      if (!authData.user) {
        console.log("❌ No authenticated user found!")
        return
      }

      // 3. Test basic database query with user context
      console.log("3️⃣ Testing basic database query...")
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      console.log("Profile Query Result:", {
        profile: profileData,
        error: profileError,
        user_id_used: authData.user.id,
      })

      // 4. Test what auth.uid() returns in database context
      console.log("4️⃣ Testing auth.uid() in database...")
      try {
        const { data: authUidData, error: authUidError } = await supabase.rpc("get_current_user_id")

        console.log("Database auth.uid() Result:", {
          auth_uid: authUidData,
          error: authUidError,
          matches_client_id: authUidData === authData.user.id,
        })

        // Get user role
        const { data: roleData, error: roleError } = await supabase.rpc("get_current_user_role")

        console.log("Database auth.role() Result:", {
          role: roleData,
          error: roleError,
          is_authenticated: roleData === "authenticated",
        })

        // Test RLS condition directly
        const { data: rlsTestData, error: rlsTestError } = await supabase.rpc(
          "test_rls_condition",
          { test_creator_id: authData.user.id },
        )

        console.log("RLS Condition Test Result:", {
          condition_passes: rlsTestData,
          error: rlsTestError,
        })

        // Get comprehensive auth debug info
        const { data: authDebugData, error: authDebugError } =
          await supabase.rpc("get_auth_debug_info")

        console.log("Comprehensive Auth Debug Info:", {
          data: authDebugData,
          error: authDebugError,
        })
      } catch (error) {
        console.log("Error calling auth debug functions:", error)
        console.log(
          "Note: You may need to create these functions in Supabase. Check migrations/create_auth_debug_functions.sql",
        )
      }

      // 5. Check user role and permissions
      console.log("5️⃣ Testing role and permissions...")
      const { data: roleTest, error: roleError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1)

      console.log("Role Test (can query profiles):", {
        can_query: !roleError,
        error: roleError,
        result: roleTest,
      })

      // 6. Test RLS policy condition simulation
      console.log("6️⃣ Testing RLS condition simulation...")
      const testCreatorId = authData.user.id
      console.log("RLS Test Values:", {
        creator_id: testCreatorId,
        auth_uid_from_client: authData.user.id,
        client_matches: testCreatorId === authData.user.id,
      })

      // 7. Test groups table access
      console.log("7️⃣ Testing groups table access...")
      const { data: groupsTest, error: groupsError } = await supabase
        .from("groups")
        .select("count")
        .limit(1)

      console.log("Groups Table Access:", {
        can_query: !groupsError,
        error: groupsError,
        result: groupsTest,
      })

      // 8. Test JWT token claims
      console.log("8️⃣ Testing JWT token claims...")
      if (sessionData.session?.access_token) {
        try {
          // Extract payload from JWT without verification (for debugging only)
          const tokenParts = sessionData.session.access_token.split(".")
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log("JWT Claims:", {
              sub: payload.sub,
              role: payload.role,
              aud: payload.aud,
              exp: new Date(payload.exp * 1000).toISOString(),
              iat: new Date(payload.iat * 1000).toISOString(),
              user_id_matches: payload.sub === authData.user.id,
              role_is_authenticated: payload.role === "authenticated",
              has_aud: !!payload.aud,
            })
          } else {
            console.log("❌ Invalid JWT format")
          }
        } catch (error) {
          console.error("Error parsing JWT:", error)
        }
      } else {
        console.log("❌ No access token found")
      }

      // 9. Test if we can create a minimal test record
      console.log("9️⃣ Testing minimal insert capability...")
      const testPayload = {
        name: "DEBUG_TEST_GROUP",
        creator_id: authData.user.id,
        category: "hobby",
        is_public: true,
      }

      console.log("Test Payload:", testPayload)

      // Don't actually insert, just validate the payload
      console.log("Payload Validation:", {
        name_valid: !!testPayload.name,
        creator_id_valid: !!testPayload.creator_id,
        creator_id_format: typeof testPayload.creator_id,
        creator_id_length: testPayload.creator_id?.length,
      })

      // 10. Test direct API call with access token
      if (sessionData.session?.access_token) {
        console.log("🔟 Testing direct API call with access token...")
        try {
          const apiUrl = `${Config.SUPABASE_URL}/rest/v1/profiles?select=id,email&limit=1`
          const response = await fetch(apiUrl, {
            headers: {
              apikey: Config.SUPABASE_KEY,
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          })

          const responseData = await response.json()
          console.log("Direct API Call Result:", {
            status: response.status,
            ok: response.ok,
            data: responseData,
            headers: {
              contentType: response.headers.get("content-type"),
              server: response.headers.get("server"),
            },
          })
        } catch (error) {
          console.error("Error making direct API call:", error)
        }
      } else {
        console.log("❌ No access token available for direct API test")
      }
    } catch (error) {
      console.error("💥 Debug authentication failed:", error)
    }

    console.log("🔍 === AUTHENTICATION DEBUG END ===")
  }

  /**
   * Test RLS policy by attempting a minimal insert
   * This can be called directly to test if the RLS policy is working
   */
  static async testRlsPolicy(): Promise<{ success: boolean; error: any; payload: any }> {
    console.log("🧪 === RLS POLICY TEST START ===")

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("❌ [testRlsPolicy] User auth error:", userError)
        return {
          success: false,
          error: userError || "No authenticated user",
          payload: null,
        }
      }

      console.log("✅ [testRlsPolicy] User authenticated:", { userId: user.id, email: user.email })

      // Create a minimal test group
      const testPayload = {
        name: `RLS_TEST_${Date.now().toString().slice(-6)}`,
        creator_id: user.id,
        category: "test",
        is_public: true,
      }

      console.log("📝 [testRlsPolicy] Test payload:", testPayload)

      // Attempt the insert
      const { data: result, error: insertError } = await supabase
        .from("groups")
        .insert(testPayload)
        .select("*")
        .single()

      if (insertError) {
        console.error("❌ [testRlsPolicy] Insert failed:", insertError)
        return {
          success: false,
          error: insertError,
          payload: testPayload,
        }
      }

      console.log("✅ [testRlsPolicy] Insert succeeded:", result)

      // Clean up the test group
      const { error: deleteError } = await supabase.from("groups").delete().eq("id", result.id)

      if (deleteError) {
        console.warn("⚠️ [testRlsPolicy] Cleanup failed:", deleteError)
      } else {
        console.log("🧹 [testRlsPolicy] Test group deleted")
      }

      return {
        success: true,
        error: null,
        payload: testPayload,
      }
    } catch (error) {
      console.error("💥 [testRlsPolicy] Test failed with exception:", error)
      return {
        success: false,
        error,
        payload: null,
      }
    } finally {
      console.log("🧪 === RLS POLICY TEST END ===")
    }
  }
}
