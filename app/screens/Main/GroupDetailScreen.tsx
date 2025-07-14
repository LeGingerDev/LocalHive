import React, { useEffect, useState, useCallback } from "react"
import { View, ScrollView, ViewStyle, TextStyle, TouchableOpacity, Modal } from "react-native"

import { CustomAlert } from "@/components/Alert"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { MembersSection } from "@/components/Groups/MembersSection"
import { RecentActivitySection } from "@/components/Groups/RecentActivitySection"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { InvitationForm } from "@/components/InvitationForm"
import { ItemCard } from "@/components/ItemCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { Group, GroupMember, GroupPost } from "@/services/api/types"
import { GroupService } from "@/services/supabase/groupService"
import { ItemService, ItemWithProfile } from "@/services/supabase/itemService"
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
  const [showMenuAlert, setShowMenuAlert] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [showMemberSuccessAlert, setShowMemberSuccessAlert] = useState(false)
  const [errorAlertMessage, setErrorAlertMessage] = useState("")
  const [successAlertMessage, setSuccessAlertMessage] = useState("")
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [items, setItems] = useState<ItemWithProfile[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  // Collapsible sections state
  const [membersCollapsed, setMembersCollapsed] = useState(false)
  const [itemsCollapsed, setItemsCollapsed] = useState(false)
  const [recentActivityCollapsed, setRecentActivityCollapsed] = useState(false)

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
          member_count: groupData.member_count,
          member_limit: groupData.member_limit,
          capacity_check: groupData.member_limit && (groupData.member_count || 0) >= groupData.member_limit,
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
      const { data, error } = await ItemService.getGroupItemsWithProfiles(groupId)
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
    console.log("🔍 [GroupDetailScreen] Group deleted successfully, navigating back to Groups with refresh")
    // Navigate back to main and then to groups tab with refresh parameter
    navigation.navigate("Main", { screen: "Groups", params: { refresh: true } })
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

  // Collapsible section handlers
  const handleMembersToggle = useCallback(() => {
    setMembersCollapsed(!membersCollapsed)
  }, [membersCollapsed])



  const handleItemsToggle = useCallback(() => {
    setItemsCollapsed(!itemsCollapsed)
  }, [itemsCollapsed])

  const handleRecentActivityToggle = useCallback(() => {
    setRecentActivityCollapsed(!recentActivityCollapsed)
  }, [recentActivityCollapsed])

  // ItemCard component


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
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header
        title={group.name}
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightActions={[
          {
            text: "...",
            onPress: () => setShowMenuModal(true),
          },
        ]}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={themed($content)}>
        <View style={themed($groupInfo)}>
          <Text
            style={themed($groupDescription)}
            text={group.description || "No description available"}
          />
          <Text
            style={themed($groupStats)}
            text={`${group.member_count || 0} members • ${group.item_count || 0} items`}
          />
        </View>



        {/* Collapsible Members Section */}
        <View style={themed($sectionHeader)}>
          <View style={themed($sectionHeaderContent)}>
            <TouchableOpacity
              style={themed($sectionHeaderLeft)}
              onPress={handleMembersToggle}
              activeOpacity={0.7}
            >
              <Text style={themed($sectionHeaderTitle)} text={`Members (${members.length}${group?.member_limit ? `/${group.member_limit}` : ''})`} />
            </TouchableOpacity>
            <View style={themed($sectionHeaderRight)}>
              {membersCollapsed && (
                <Text style={themed($collapsedSectionSummary)} text={`${members.length} member${members.length !== 1 ? "s" : ""} hidden`} />
              )}
              {!membersCollapsed && !(group?.member_limit && (group.member_count || 0) >= group.member_limit) && (
                <TouchableOpacity
                  style={themed($inviteButton)}
                  onPress={handleInviteMembers}
                  activeOpacity={0.8}
                >
                  <Text style={themed($inviteButtonText)} text="Invite" />
                </TouchableOpacity>
              )}
              {!membersCollapsed && group?.member_limit && (group.member_count || 0) >= group.member_limit && (
                <Text style={themed($inviteButtonDisabled)} text="Max Capacity" />
              )}
              <TouchableOpacity
                style={themed($caretButton)}
                onPress={handleMembersToggle}
                activeOpacity={0.7}
              >
                <Icon
                  icon={membersCollapsed ? "caretRight" : "caretLeft"}
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {!membersCollapsed && (
          <View>
            <MembersSection
              members={members}
              onRetry={loadGroupDetails}
              canManageMembers={canManageGroup}
              creatorId={group?.creator_id}
              onRemoveMember={handleRemoveMember}
              memberLimit={group?.member_limit}
            />
          </View>
        )}

        {/* Collapsible Recent Activity Section */}
        <TouchableOpacity
          style={themed($sectionHeader)}
          onPress={handleRecentActivityToggle}
          activeOpacity={0.7}
        >
          <View style={themed($sectionHeaderContent)}>
            <Text style={themed($sectionHeaderTitle)} text="Recent Activity" />
            <View style={themed($sectionHeaderRight)}>
              {recentActivityCollapsed && (
                <Text style={themed($collapsedSectionSummary)} text="Recent activity hidden" />
              )}
              <Icon
                icon={recentActivityCollapsed ? "caretRight" : "caretLeft"}
                size={20}
                color={theme.colors.text}
              />
            </View>
          </View>
        </TouchableOpacity>

        {!recentActivityCollapsed && (
          <RecentActivitySection 
            groupId={groupId}
            onItemPress={(item) => {
              // Handle item press - could navigate to item detail or edit
              console.log("Item pressed:", item)
            }}
          />
        )}

        {/* Collapsible Items Section */}
        <TouchableOpacity
          style={themed($sectionHeader)}
          onPress={handleItemsToggle}
          activeOpacity={0.7}
        >
          <View style={themed($sectionHeaderContent)}>
            <Text style={themed($sectionHeaderTitle)} text={`Items (${items.length})`} />
            <View style={themed($sectionHeaderRight)}>
              {itemsCollapsed && (
                <Text style={themed($collapsedSectionSummary)} text={`${items.length} item${items.length !== 1 ? "s" : ""} hidden`} />
              )}
              <Icon
                icon={itemsCollapsed ? "caretRight" : "caretLeft"}
                size={20}
                color={theme.colors.text}
              />
            </View>
          </View>
        </TouchableOpacity>

        {!itemsCollapsed && (
          <View style={themed($itemsSection)}>
            {itemsLoading ? (
              <LoadingSpinner text="Loading items..." />
            ) : items.length > 0 ? (
              <View style={themed($itemsList)}>
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <View style={themed($emptyItemsContainer)}>
                <Text style={themed($emptyItemsText)} text="No items yet" />
                <Text style={themed($emptyItemsSubtext)} text="Add the first item to this group!" />
              </View>
            )}
          </View>
        )}
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
const $root = (): ViewStyle => ({ flex: 1 })
const $content = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.xl * 2,
})
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
const $actionButtonDisabled = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.errorLight,
  opacity: 0.7,
})
const $actionButtonTextDisabled = ({ colors }: any): TextStyle => ({
  color: colors.error,
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
  marginTop: spacing.xs,
  marginBottom: spacing.md,
})

const $itemsSectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})

const $itemsList = (): ViewStyle => ({
  // ItemCard components now have their own marginBottom
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

// Collapsible section styles
const $sectionHeader = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.sm,
  backgroundColor: colors.primary100,
  borderRadius: 8,
  marginBottom: spacing.xs,
})
const $sectionHeaderContent = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
})
const $sectionHeaderRight = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
})
const $sectionHeaderLeft = (): ViewStyle => ({
  flex: 1,
})
const $inviteButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderRadius: 6,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})
const $inviteButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})
const $inviteButtonDisabled = ({ colors, typography }: any): TextStyle => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 12,
  fontStyle: "italic",
})
const $caretButton = (): ViewStyle => ({
  padding: 4,
})
const $sectionHeaderTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})
const $collapsedSectionContainer = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.md,
  marginTop: spacing.sm,
})
const $collapsedSectionSummary = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
})
