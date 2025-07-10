import React, { useEffect, useState } from "react"
import { View, ScrollView, ViewStyle, TextStyle, Alert, TouchableOpacity } from "react-native"
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
import { spacing } from "@/theme/spacing"

interface GroupDetailScreenProps {
  route: { params: { groupId: string } }
  navigation: any
}

export const GroupDetailScreen = ({ route, navigation }: GroupDetailScreenProps) => {
  const { themed } = useAppTheme()
  const { deleteGroup } = useGroups()
  const { groupId } = route.params
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCloseAlert, setShowCloseAlert] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

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
        setGroup(groupData)
        setMembers(groupData.members || [])
        setPosts(groupData.recent_posts || [])
      }
    } catch (err) {
      setError("Failed to load group details")
      console.error("Error loading group details:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMembers = () => {
    // TODO: Implement invite members functionality
    Alert.alert("Invite Members", "This feature will be implemented soon!")
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
        <TouchableOpacity 
          style={themed($backButton)} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={themed($backButtonText)} text="← Back" />
        </TouchableOpacity>
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

      {/* Close Group Button */}
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
        title="Success"
        message="Group has been closed successfully."
        confirmText="OK"
        onConfirm={handleSuccessAlertConfirm}
        onCancel={() => setShowSuccessAlert(false)}
      />
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $headerRow = (): ViewStyle => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md })
const $backButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.xs, paddingHorizontal: spacing.md })
const $backButtonText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.tint })
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