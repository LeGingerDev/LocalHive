import React, { useEffect, useState } from "react"
import { View, ScrollView, ViewStyle, TextStyle, TouchableOpacity, Modal } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { CustomAlert } from "@/components/Alert"
import { Button } from "@/components/Button"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
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
import { ItemService, type Item } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

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
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  // Calculate if user can manage the group (admin or creator)
  const canManageGroup = userRole === "creator" || userRole === "admin"

  // Track if all data is fully loaded and ready for display
  const [isDataReady, setIsDataReady] = useState(false)

  useEffect(() => {
    loadGroupDetails()
    loadGroupItems()
  }, [groupId])

  const loadGroupDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsDataReady(false) // Reset data ready state

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

        // Mark data as ready after a short delay to ensure all state updates are complete
        setTimeout(() => {
          console.log("[GroupDetailScreen] Marking data as ready")
          setIsDataReady(true)
        }, 100)
      }
    } catch (err) {
      setError("Failed to load group details")
      console.error("Error loading group details:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupItems = async () => {
    try {
      setItemsLoading(true)
      const { data, error } = await ItemService.getGroupItems(groupId)
      if (error) {
        console.error("Error loading group items:", error)
        return
      }
      if (data) {
        setItems(data)
      }
    } catch (err) {
      console.error("Error loading group items:", err)
    } finally {
      setItemsLoading(false)
    }
  }

  const handleInviteMembers = () => {
    setShowInviteModal(true)
  }

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    // Refresh group details to show updated member count
    loadGroupDetails()
    loadGroupItems() // Also refresh items
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
    // Just go back to the previous screen, GroupsScreen will refresh when it comes into focus
    navigation.goBack()
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

  // ItemCard component
  const ItemCard = ({ item, themed }: { item: Item; themed: any }) => (
    <View style={themed($itemCard)}>
      <View style={themed($itemImageContainer)}>
        {item.image_urls && item.image_urls.length > 0 ? (
          <View style={themed($itemImage)}>
            <Text style={themed($itemImagePlaceholder)} text="📷" />
          </View>
        ) : (
          <View style={themed($itemImagePlaceholder)}>
            <Icon icon="menu" size={24} color={theme.colors.textDim} />
          </View>
        )}
      </View>
      <View style={themed($itemContent)}>
        <Text style={themed($itemTitle)} text={item.title} />
        <Text style={themed($itemCategory)} text={item.category} />
        {item.location && <Text style={themed($itemLocation)} text={`📍 ${item.location}`} />}
        {item.details && (
          <Text style={themed($itemDetails)} text={item.details} numberOfLines={2} />
        )}
      </View>
    </View>
  )

  if (loading || !isDataReady) {
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
      <View style={themed($headerRow)}>
        <TouchableOpacity
          style={themed($backButtonPlain)}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon icon="back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={themed($headerTitle)} text={group.name} />
        <TouchableOpacity
          style={themed($headerActionButton)}
          onPress={() => setShowMenuModal(true)}
          activeOpacity={0.8}
        >
          <Text style={themed($headerActionText)} text="..." />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={themed($groupInfo)}>
          <Text
            style={themed($groupDescription)}
            text={group.description || "No description available"}
          />
          <Text
            style={themed($groupStats)}
            text={`${group.member_count || 0} members • ${group.post_count || 0} posts`}
          />
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

        <View>
          <MembersSection
            members={members}
            onRetry={loadGroupDetails}
            canManageMembers={canManageGroup}
            creatorId={group?.creator_id}
            onRemoveMember={handleRemoveMember}
          />
        </View>

        <View>
          <RecentActivitySection
            data={{ title: "Recent Activity", description: `${posts.length} recent posts` }}
            onRetry={loadGroupDetails}
          />
        </View>

        {/* Items Section */}
        <View style={themed($itemsSection)}>
          <Text style={themed($itemsSectionTitle)} text="Items" />
          {itemsLoading ? (
            <LoadingSpinner text="Loading items..." />
          ) : items.length > 0 ? (
            <View style={themed($itemsList)}>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} themed={themed} />
              ))}
            </View>
          ) : (
            <View style={themed($emptyItemsContainer)}>
              <Text style={themed($emptyItemsText)} text="No items yet" />
              <Text style={themed($emptyItemsSubtext)} text="Add the first item to this group!" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Item Button at the bottom */}
      <View style={themed($addItemContainer)}>
        <CustomGradient preset="primary" style={themed($addItemButton)}>
          <TouchableOpacity
            style={themed($addItemButtonInner)}
            onPress={() => navigation.navigate("Main", { screen: "Add", params: { groupId } })}
            activeOpacity={0.8}
          >
            <Text style={themed($addItemButtonText)} text="Add Item" />
          </TouchableOpacity>
        </CustomGradient>
      </View>

      {/* Menu Modal for group actions */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <View
            style={{
              backgroundColor: theme.colors.cardColor,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 24,
            }}
          >
            {canManageGroup && (
              <TouchableOpacity
                style={themed($closeGroupButton)}
                onPress={() => {
                  setShowMenuModal(false)
                  handleCloseGroup()
                }}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text
                  style={themed($closeGroupButtonText)}
                  text={deleting ? "Closing..." : "Close Group"}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ marginTop: 16, alignItems: "center" }}
              onPress={() => setShowMenuModal(false)}
            >
              <Text style={{ color: theme.colors.textDim, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  paddingHorizontal: 12,
  paddingVertical: 12,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  minWidth: 48,
  minHeight: 48,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
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
const $addItemContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.md,
  paddingBottom: spacing.lg,
})
const $addItemButton = ({ colors, typography }: any): ViewStyle => ({
  borderRadius: 16,
  overflow: "hidden",
})
const $addItemButtonInner = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: "transparent",
  borderRadius: 16,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
})
const $addItemButtonText = ({ colors, typography }: any): TextStyle => ({
  color: "#ffffff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
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

// Items Section Styles
const $itemsSection = ({ spacing }: any): ViewStyle => ({
  marginTop: spacing.lg,
  marginBottom: spacing.md,
})

const $itemsSectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})

const $itemsList = ({ spacing }: any): ViewStyle => ({
  gap: spacing.sm,
})

const $itemCard = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})

const $itemImageContainer = ({ spacing }: any): ViewStyle => ({
  marginRight: spacing.md,
})

const $itemImage = ({ colors, spacing }: any): ViewStyle => ({
  width: 60,
  height: 60,
  borderRadius: 8,
  backgroundColor: colors.cardColor,
  justifyContent: "center",
  alignItems: "center",
})

const $itemImagePlaceholder = ({ colors, spacing }: any): ViewStyle => ({
  width: 60,
  height: 60,
  borderRadius: 8,
  backgroundColor: colors.cardColor,
  justifyContent: "center",
  alignItems: "center",
})

const $itemContent = (): ViewStyle => ({
  flex: 1,
})

const $itemTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: 4,
})

const $itemCategory = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.tint,
  textTransform: "capitalize",
  marginBottom: 4,
})

const $itemLocation = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 4,
})

const $itemDetails = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  lineHeight: 16,
})

const $emptyItemsContainer = ({ spacing }: any): ViewStyle => ({
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $emptyItemsText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $emptyItemsSubtext = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})
