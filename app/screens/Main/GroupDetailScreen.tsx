import React, { useEffect, useState } from "react"
import { View, ScrollView, ViewStyle, TextStyle, Alert, TouchableOpacity, Modal } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useAppTheme } from "@/theme/context"
import { Group, GroupMember, GroupPost } from "@/services/api/types"
import { GroupService } from "@/services/supabase/groupService"
import { MembersSection } from "@/components/Groups/MembersSection"
import { RecentActivitySection } from "@/components/Groups/RecentActivitySection"
import { useGroups } from "@/hooks/useGroups"
import { CustomAlert } from "@/components/Alert"
import { InvitationForm } from "@/components/InvitationForm"
import { spacing } from "@/theme/spacing"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { useAuth } from "@/context/AuthContext"

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
          members_count: groupData.members?.length || 0
        })
        
        setGroup(groupData)
        setMembers(groupData.members || [])
        setPosts(groupData.recent_posts || [])
        
        // Determine user's role in the group
        if (user) {
          console.log("Current user:", { 
            id: user.id, 
            email: user.email
          })
          
          // Check if user is the creator
          const isCreator = groupData.creator_id === user.id
          
          // Check if user is an admin
          const currentMember = groupData.members?.find(member => member.user_id === user.id)
          const isAdmin = currentMember?.role === 'admin'
          
          // Set user role
          if (isCreator) {
            setUserRole('creator')
          } else if (isAdmin) {
            setUserRole('admin')
          } else {
            setUserRole('member')
          }
          
          console.log("User role determination:", { 
            isCreator, 
            creator_id: groupData.creator_id,
            user_id: user.id,
            creator_id_match: groupData.creator_id === user.id,
            memberRole: currentMember?.role || 'not-member',
            determinedRole: isCreator ? 'creator' : (isAdmin ? 'admin' : 'member'),
            canManageGroup: isCreator || isAdmin
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
    Alert.alert("Create Post", "This feature will be implemented soon!")
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
        Alert.alert("Error", "Failed to close group. Please try again.")
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while closing the group.")
    } finally {
      setDeleting(false)
    }
  }

  const handleSuccessAlertConfirm = () => {
    setShowSuccessAlert(false)
    // Navigate back to groups screen with refresh flag
    navigation.navigate('Main', { 
      screen: 'Groups',
      params: { refresh: true }
    })
  }

  // Check if user can manage the group (admin or creator)
  const canManageGroup = userRole === 'creator' || userRole === 'admin'

  if (loading) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={['top', 'bottom']}>
        <LoadingSpinner text="Loading group details..." />
      </Screen>
    )
  }

  if (error || !group) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={['top', 'bottom']}>
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
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={['top', 'bottom']}>
      <View style={themed($headerRow)}>
        <Button
          LeftAccessory={() => <Icon icon="back" size={22} color={theme.colors.text} />}
          style={themed($backButtonPlain)}
          onPress={() => navigation.goBack()}
          preset="default"
        />
        <Text style={themed($headerTitle)} text={group.name} />
        <TouchableOpacity 
          style={themed($headerActionButton)} 
          onPress={() => Alert.alert("Menu", "Group menu options")}
          activeOpacity={0.8}
        >
          <Text style={themed($headerActionText)} text="..." />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={themed($groupInfo)}>
          <Text style={themed($groupDescription)} text={group.description || "No description available"} />
          <Text style={themed($groupStats)} text={`${group.member_count || 0} members • ${group.post_count || 0} posts`} />
        </View>

        <View style={themed($actionButtons)}>
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
        </View>

        <MembersSection 
          members={members}
          onRetry={loadGroupDetails}
        />

        <RecentActivitySection 
          data={{ title: "Recent Activity", description: `${posts.length} recent posts` }}
          onRetry={loadGroupDetails}
        />
      </ScrollView>

      {/* Close Group Button - Only visible to admins and creators */}
      {canManageGroup ? (
        <View style={themed($closeGroupContainer)}>
          <TouchableOpacity 
            style={themed($closeGroupButton)} 
            onPress={handleCloseGroup}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Text style={themed($closeGroupButtonText)} text={deleting ? "Closing..." : "Close Group"} />
          </TouchableOpacity>
        </View>
      ) : userRole === 'member' ? (
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
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $headerRow = (): ViewStyle => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md })
const $backButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.xs, paddingHorizontal: spacing.md })
const $backButtonText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.tint })
const $backButtonPlain = ({ spacing }: any): ViewStyle => ({ marginRight: spacing.sm, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 })
const $headerTitle = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.bold, fontSize: 20, color: colors.text, flex: 1, textAlign: "center" })
const $headerActionButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.xs, paddingHorizontal: spacing.md })
const $headerActionText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.tint })
const $groupInfo = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.md })
const $groupDescription = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 16, color: colors.text, marginBottom: spacing.sm })
const $groupStats = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 14, color: colors.textDim })
const $actionButtons = (): ViewStyle => ({ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg })
const $actionButton = ({ colors, typography }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, overflow: "hidden" as "hidden" })
const $actionButtonText = ({ colors, typography }: any): TextStyle => ({ color: colors.tint, fontFamily: typography.primary.medium, fontSize: 15, textAlign: "center" })
const $closeGroupContainer = ({ spacing }: any): ViewStyle => ({ padding: spacing.md, paddingBottom: spacing.lg })
const $closeGroupButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.error, borderRadius: 12, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center" })
const $closeGroupButtonText = ({ colors, typography }: any): TextStyle => ({ color: colors.background, fontFamily: typography.primary.bold, fontSize: 16, textAlign: "center" })
const $errorContainer = ({ spacing }: any): ViewStyle => ({ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg })
const $errorText = ({ typography, colors, spacing }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 16, color: colors.error, textAlign: "center", marginBottom: spacing.md })
const $retryButton = ({ colors, typography }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, overflow: "hidden" as "hidden" })
const $retryButtonText = ({ colors, typography }: any): TextStyle => ({ color: colors.tint, fontFamily: typography.primary.medium, fontSize: 15, textAlign: "center" }) 

const $infoContainer = ({ spacing }: any): ViewStyle => ({ 
  padding: spacing.md, 
  paddingBottom: spacing.lg,
  alignItems: "center" 
})

const $infoText = ({ typography, colors }: any): TextStyle => ({ 
  fontFamily: typography.primary.normal, 
  fontSize: 14, 
  color: colors.textDim,
  textAlign: "center" 
}) 