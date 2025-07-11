import React, { useEffect, useState } from "react"
import { View, ScrollView, ViewStyle, TextStyle, TouchableOpacity, Modal } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated"

import { CustomAlert } from "@/components/Alert"
import { Button } from "@/components/Button"
import { MembersSection } from "@/components/Groups/MembersSection"
import { RecentActivitySection } from "@/components/Groups/RecentActivitySection"
import { Icon } from "@/components/Icon"
import { InvitationForm } from "@/components/InvitationForm"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { Group, GroupMember, GroupPost } from "@/services/api/types"
import { GroupService } from "@/services/supabase/groupService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface GroupDetailScreenProps {
  route: { params: { groupId: string } }
  navigation: any
}

export const GroupDetailScreen = ({ route, navigation }: GroupDetailScreenProps) => {
  const { themed, theme } = useAppTheme()
  const { deleteGroup } = useGroups()
  const { user } = useAuth()
  const { groupId } = route.params
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCloseAlert, setShowCloseAlert] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [showRemoveMemberAlert, setShowRemoveMemberAlert] = useState(false)
  const [removingMember, setRemovingMember] = useState(false)
  const [showCreatePostAlert, setShowCreatePostAlert] = useState(false)
  const [showMenuAlert, setShowMenuAlert] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [showMemberSuccessAlert, setShowMemberSuccessAlert] = useState(false)
  const [errorAlertMessage, setErrorAlertMessage] = useState("")
  const [successAlertMessage, setSuccessAlertMessage] = useState("")

  // Animation values
  const headerOpacity = useSharedValue(0)
  const headerTranslateY = useSharedValue(-20)
  const groupInfoOpacity = useSharedValue(0)
  const groupInfoTranslateY = useSharedValue(20)
  const actionButtonsOpacity = useSharedValue(0)
  const actionButtonsScale = useSharedValue(0.8)
  const membersSectionOpacity = useSharedValue(0)
  const membersSectionTranslateY = useSharedValue(30)
  const activitySectionOpacity = useSharedValue(0)
  const activitySectionTranslateY = useSharedValue(30)
  const closeButtonOpacity = useSharedValue(0)
  const closeButtonScale = useSharedValue(0.8)

  useEffect(() => {
    loadGroupDetails()
  }, [groupId])

  const loadGroupDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load group details
      const { data: groupData, error: groupError } = await GroupService.getGroupById(groupId)
      if (groupError) {
        setError(groupError.message)
        return
      }
      if (groupData) {
        console.log("Group details loaded:", {
          id: groupData.id,
          name: groupData.name,
          creator_id: groupData.creator_id,
          members_count: groupData.members?.length || 0,
        })

        setGroup(groupData)
        setMembers(groupData.members || [])
        setPosts(groupData.recent_posts || [])

        // Determine user's role in the group
        if (user) {
          console.log("Current user:", {
            id: user.id,
            email: user.email,
          })

          // Check if user is the creator
          const isCreator = groupData.creator_id === user.id

          // Check if user is an admin
          const currentMember = groupData.members?.find((member) => member.user_id === user.id)
          const isAdmin = currentMember?.role === "admin"

          // Set user role
          if (isCreator) {
            setUserRole("creator")
          } else if (isAdmin) {
            setUserRole("admin")
          } else {
            setUserRole("member")
          }

          console.log("User role determination:", {
            isCreator,
            creator_id: groupData.creator_id,
            user_id: user.id,
            creator_id_match: groupData.creator_id === user.id,
            memberRole: currentMember?.role || "not-member",
            determinedRole: isCreator ? "creator" : isAdmin ? "admin" : "member",
            canManageGroup: isCreator || isAdmin,
          })
        } else {
          console.log("No authenticated user found")
          setUserRole(null)
        }
      }
    } catch (err) {
      setError("Failed to load group details")
      console.error("Error loading group details:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMembers = () => {
    setShowInviteModal(true)
  }

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    // Refresh group details to show updated member count
    loadGroupDetails()
  }

  const handleInviteCancel = () => {
    setShowInviteModal(false)
  }

  const handleCreatePost = () => {
    // TODO: Implement create post functionality
    setShowCreatePostAlert(true)
  }

  const handleCloseGroup = () => {
    setShowCloseAlert(true)
  }

  const handleConfirmCloseGroup = async () => {
    setShowCloseAlert(false)
    setDeleting(true)
    try {
      const success = await deleteGroup(groupId)
      if (success) {
        setShowSuccessAlert(true)
      } else {
        setErrorAlertMessage("Failed to close group. Please try again.")
        setShowErrorAlert(true)
      }
    } catch (error) {
      setErrorAlertMessage("An unexpected error occurred while closing the group.")
      setShowErrorAlert(true)
    } finally {
      setDeleting(false)
    }
  }

  const handleSuccessAlertConfirm = () => {
    setShowSuccessAlert(false)
    // Navigate back to groups screen with refresh flag
    navigation.navigate("Main", {
      screen: "Groups",
      params: { refresh: true },
    })
  }

  const handleRemoveMember = (member: GroupMember) => {
    setMemberToRemove(member)
    setShowRemoveMemberAlert(true)
  }

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return

    setShowRemoveMemberAlert(false)
    setRemovingMember(true)

    try {
      const { error: removeError } = await GroupService.removeMember(
        groupId,
        memberToRemove.user_id,
      )

      if (removeError) {
        setErrorAlertMessage("Failed to remove member. Please try again.")
        setShowErrorAlert(true)
        console.error("Error removing member:", removeError)
      } else {
        // Remove member from local state
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id))
        setSuccessAlertMessage("Member has been removed from the group.")
        setShowMemberSuccessAlert(true)
      }
    } catch (error) {
      setErrorAlertMessage("An unexpected error occurred while removing the member.")
      setShowErrorAlert(true)
      console.error("Error removing member:", error)
    } finally {
      setRemovingMember(false)
      setMemberToRemove(null)
    }
  }

  const handleCancelRemoveMember = () => {
    setShowRemoveMemberAlert(false)
    setMemberToRemove(null)
  }

  // Check if user can manage the group (admin or creator)
  const canManageGroup = userRole === "creator" || userRole === "admin"

  // Reset animation values when groupId changes
  useEffect(() => {
    // Reset all animation values to initial state
    headerOpacity.value = 0
    headerTranslateY.value = -20
    groupInfoOpacity.value = 0
    groupInfoTranslateY.value = 20
    actionButtonsOpacity.value = 0
    actionButtonsScale.value = 0.8
    membersSectionOpacity.value = 0
    membersSectionTranslateY.value = 30
    activitySectionOpacity.value = 0
    activitySectionTranslateY.value = 30
    closeButtonOpacity.value = 0
    closeButtonScale.value = 0.8
  }, [groupId])

  // Trigger animations when screen loads
  useEffect(() => {
    if (!loading && group) {
      // Header animation
      headerOpacity.value = withTiming(1, { duration: 600 })
      headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 })

      // Group info animation
      groupInfoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }))
      groupInfoTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 300 }))

      // Action buttons animation
      actionButtonsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }))
      actionButtonsScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 300 }))

      // Members section animation
      membersSectionOpacity.value = withDelay(600, withTiming(1, { duration: 600 }))
      membersSectionTranslateY.value = withDelay(
        600,
        withSpring(0, { damping: 15, stiffness: 300 }),
      )

      // Activity section animation
      activitySectionOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))
      activitySectionTranslateY.value = withDelay(
        800,
        withSpring(0, { damping: 15, stiffness: 300 }),
      )

      // Close button animation (if visible)
      if (canManageGroup) {
        closeButtonOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }))
        closeButtonScale.value = withDelay(1000, withSpring(1, { damping: 15, stiffness: 300 }))
      }
    }
  }, [loading, group, canManageGroup])

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }))

  const groupInfoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: groupInfoOpacity.value,
    transform: [{ translateY: groupInfoTranslateY.value }],
  }))

  const actionButtonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionButtonsOpacity.value,
    transform: [{ scale: actionButtonsScale.value }],
  }))

  const membersSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: membersSectionOpacity.value,
    transform: [{ translateY: membersSectionTranslateY.value }],
  }))

  const activitySectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activitySectionOpacity.value,
    transform: [{ translateY: activitySectionTranslateY.value }],
  }))

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: closeButtonOpacity.value,
    transform: [{ scale: closeButtonScale.value }],
  }))

  if (loading) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
        <LoadingSpinner text="Loading group details..." />
      </Screen>
    )
  }

  if (error || !group) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
        <View style={themed($errorContainer)}>
          <Text style={themed($errorText)} text={error || "Group not found"} />
          <TouchableOpacity
            style={themed($retryButton)}
            onPress={loadGroupDetails}
            activeOpacity={0.8}
          >
            <Text style={themed($retryButtonText)} text="Retry" />
          </TouchableOpacity>
        </View>
      </Screen>
    )
  }

  return (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={["top", "bottom"]}>
      <Animated.View style={[themed($headerRow), headerAnimatedStyle]}>
        <Button
          LeftAccessory={() => <Icon icon="back" size={22} color={theme.colors.text} />}
          style={themed($backButtonPlain)}
          onPress={() => navigation.goBack()}
          preset="default"
        />
        <Text style={themed($headerTitle)} text={group.name} />
        <TouchableOpacity
          style={themed($headerActionButton)}
          onPress={() => setShowMenuAlert(true)}
          activeOpacity={0.8}
        >
          <Text style={themed($headerActionText)} text="..." />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[themed($groupInfo), groupInfoAnimatedStyle]}>
          <Text
            style={themed($groupDescription)}
            text={group.description || "No description available"}
          />
          <Text
            style={themed($groupStats)}
            text={`${group.member_count || 0} members • ${group.post_count || 0} posts`}
          />
        </Animated.View>

        <Animated.View style={[themed($actionButtons), actionButtonsAnimatedStyle]}>
          <TouchableOpacity
            style={themed($actionButton)}
            onPress={handleInviteMembers}
            activeOpacity={0.8}
          >
            <Text style={themed($actionButtonText)} text="Invite Members" />
          </TouchableOpacity>
          <TouchableOpacity
            style={themed($actionButton)}
            onPress={handleCreatePost}
            activeOpacity={0.8}
          >
            <Text style={themed($actionButtonText)} text="Create Post" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={membersSectionAnimatedStyle}>
          <MembersSection
            members={members}
            onRetry={loadGroupDetails}
            canManageMembers={canManageGroup}
            creatorId={group?.creator_id}
            onRemoveMember={handleRemoveMember}
          />
        </Animated.View>

        <Animated.View style={activitySectionAnimatedStyle}>
          <RecentActivitySection
            data={{ title: "Recent Activity", description: `${posts.length} recent posts` }}
            onRetry={loadGroupDetails}
          />
        </Animated.View>
      </ScrollView>

      {/* Close Group Button - Only visible to admins and creators */}
      {canManageGroup ? (
        <Animated.View style={[themed($closeGroupContainer), closeButtonAnimatedStyle]}>
          <TouchableOpacity
            style={themed($closeGroupButton)}
            onPress={handleCloseGroup}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Text
              style={themed($closeGroupButtonText)}
              text={deleting ? "Closing..." : "Close Group"}
            />
          </TouchableOpacity>
        </Animated.View>
      ) : userRole === "member" ? (
        <View style={themed($infoContainer)}>
          <Text style={themed($infoText)} text="Only group admins and creators can close groups" />
        </View>
      ) : null}

      {/* Invitation Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleInviteCancel}
      >
        <InvitationForm
          groupId={groupId}
          groupName={group.name}
          onSuccess={handleInviteSuccess}
          onCancel={handleInviteCancel}
        />
      </Modal>

      {/* Custom Alerts */}
      <CustomAlert
        visible={showCloseAlert}
        title="Close Group"
        message={`Are you sure you want to close "${group?.name}"? This action cannot be undone.`}
        confirmText="Close Group"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={handleConfirmCloseGroup}
        onCancel={() => setShowCloseAlert(false)}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Group Closed"
        message={`"${group?.name}" has been successfully closed.`}
        confirmText="OK"
        onConfirm={handleSuccessAlertConfirm}
      />

      {/* Remove Member Alert */}
      <CustomAlert
        visible={showRemoveMemberAlert}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.full_name || "this member"} from the group?`}
        confirmText={removingMember ? "Removing..." : "Remove"}
        cancelText="Cancel"
        onConfirm={handleConfirmRemoveMember}
        onCancel={handleCancelRemoveMember}
        confirmStyle="destructive"
      />

      {/* Create Post Alert */}
      <CustomAlert
        visible={showCreatePostAlert}
        title="Create Post"
        message="This feature will be implemented soon!"
        confirmText="OK"
        onConfirm={() => setShowCreatePostAlert(false)}
      />

      {/* Menu Alert */}
      <CustomAlert
        visible={showMenuAlert}
        title="Menu"
        message="Group menu options"
        confirmText="OK"
        onConfirm={() => setShowMenuAlert(false)}
      />

      {/* Error Alert */}
      <CustomAlert
        visible={showErrorAlert}
        title="Error"
        message={errorAlertMessage}
        confirmText="OK"
        confirmStyle="destructive"
        onConfirm={() => setShowErrorAlert(false)}
      />

      {/* Member Success Alert */}
      <CustomAlert
        visible={showMemberSuccessAlert}
        title="Success"
        message={successAlertMessage}
        confirmText="OK"
        confirmStyle="success"
        onConfirm={() => setShowMemberSuccessAlert(false)}
      />
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $headerRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.md,
})
const $backButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})
const $backButtonText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
})
const $backButtonPlain = ({ spacing }: any): ViewStyle => ({
  marginRight: spacing.sm,
  paddingHorizontal: 8,
  paddingVertical: 8,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  minWidth: 44,
  minHeight: 44,
  justifyContent: "center",
  alignItems: "center",
})
const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  flex: 1,
  textAlign: "center",
})
const $headerActionButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})
const $headerActionText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
})
const $groupInfo = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.md })
const $groupDescription = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
})
const $groupStats = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})
const $actionButtons = (): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: spacing.lg,
})
const $actionButton = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  overflow: "hidden" as const,
})
const $actionButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 15,
  textAlign: "center",
})
const $closeGroupContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.md,
  paddingBottom: spacing.lg,
})
const $closeGroupButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.error,
  borderRadius: 12,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
})
const $closeGroupButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 16,
  textAlign: "center",
})
const $errorContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})
const $errorText = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.error,
  textAlign: "center",
  marginBottom: spacing.md,
})
const $retryButton = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  overflow: "hidden" as const,
})
const $retryButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 15,
  textAlign: "center",
})

const $infoContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.md,
  paddingBottom: spacing.lg,
  alignItems: "center",
})

const $infoText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})
