import React, { useEffect, useCallback, useState } from "react"
import {
  View,
  ScrollView,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { GroupCard } from "@/components/Groups/GroupCard"
import { InvitationCard } from "@/components/Groups/InvitationCard"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { Group, GroupInvitation } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Button } from "@/components/Button"

const windowHeight = Dimensions.get("window").height
const estimatedContentHeight = 450
const verticalPadding = Math.max((windowHeight - estimatedContentHeight) / 2, 0)

const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($errorContainer)}>
      <Text style={themed($errorText)} text={error} />
      <TouchableOpacity style={themed($retryButton)} onPress={onRetry} activeOpacity={0.8}>
        <Text style={themed($retryButtonText)} text="Retry" />
      </TouchableOpacity>
    </View>
  )
}

const AuthPrompt = () => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($authPromptContainer)}>
      <Text style={themed($authPromptTitle)} text="Please Sign In" />
      <Text
        style={themed($authPromptText)}
        text="You need to be signed in to view and manage your groups."
      />
    </View>
  )
}

export const GroupsScreen = ({ navigation, route }: any) => {
  const { themed, theme } = useAppTheme()
  const { user, isLoading: authLoading } = useAuth()
  
  const {
    groups,
    invitations,
    loading,
    refreshing,
    error,
    refresh,
    respondToInvitation,
  } = useGroups()

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )

  // Collapsible groups state
  const [groupsCollapsed, setGroupsCollapsed] = useState(false)

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refresh()
      }
    }, [user, refresh])
  )

  const handleInvitationResponse = async (
    invitationId: string,
    status: "accepted" | "declined",
  ): Promise<boolean> => {
    const success = await respondToInvitation(invitationId, status)
    if (success) {
      // Refresh the data to ensure UI is updated
      await refresh()
      
      setAlertTitle(status === "accepted" ? "Invitation Accepted" : "Invitation Declined")
      setAlertMessage(
        status === "accepted" ? "You have joined the group!" : "The invitation has been declined.",
      )
      setAlertConfirmStyle(status === "accepted" ? "success" : "default")
      setAlertVisible(true)
    } else {
      setAlertTitle("Error")
      setAlertMessage("Failed to respond to invitation. Please try again.")
      setAlertConfirmStyle("destructive")
      setAlertVisible(true)
    }
    return success
  }

  const handleCreateGroup = () => {
    if (!user) {
      setAlertTitle("Authentication Required")
      setAlertMessage("Please sign in to create a group.")
      setAlertConfirmStyle("default")
      setAlertVisible(true)
      return
    }
    navigation.navigate("CreateGroup")
  }

  const handleNavigateToGroupDetail = (groupId: string) => {
    navigation.navigate("GroupDetail", { groupId })
  }

  const handleGroupsToggle = useCallback(() => {
    setGroupsCollapsed(!groupsCollapsed)
  }, [groupsCollapsed])

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refresh()
    }
  }, [refresh, user])

  // Show auth loading
  if (authLoading) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
        <LoadingSpinner text="Checking authentication..." />
      </Screen>
    )
  }

  // Show error if there is one
  if (error) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
        <ErrorView error={error} onRetry={() => refresh()} />
      </Screen>
    )
  }
  
  return (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header
        title="Groups"
        rightActions={[
          {
            text: "Refresh",
            onPress: handleRefresh,
          },
          {
            text: "+ New",
            onPress: handleCreateGroup,
          },
        ]}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themed($refreshControlColor)}
          />
        }
      >
        {!user && <AuthPrompt />}

        {loading && !refreshing && user && (
          <View style={themed($loadingContainer)}>
            <LoadingSpinner text="Loading groups..." />
          </View>
        )}

        {!loading && !refreshing && user && groups.length === 0 && invitations.length === 0 ? (
          <View style={themed($emptyStateContainer)}>
            <View style={themed($emptyState)}>
              <Image
                source={require("../../../assets/Visu/Visu_Reading.png")}
                style={{ width: 160, height: 160, resizeMode: "contain", marginBottom: spacing.lg }}
                accessibilityLabel="No groups illustration"
              />
              <Text style={themed($emptyStateTitle)} text="No Groups Yet" />
              <Text style={themed($emptyStateText)} text="Create your first group to get started" />
              <CustomGradient preset="primary" style={{ borderRadius: 8, marginTop: spacing.md }}>
                <Button
                  text="Create Your First Group"
                  style={{ backgroundColor: "transparent", borderRadius: 8 }}
                  textStyle={{ color: "#fff", fontFamily: theme.typography.primary.medium, fontSize: 16, textAlign: "center" }}
                  onPress={handleCreateGroup}
                  preset="reversed"
                />
              </CustomGradient>
            </View>
          </View>
        ) : (
          user &&
          groups.length > 0 && (
            <>
              {/* Collapsible Groups Section Header */}
              <TouchableOpacity
                style={themed($sectionHeader)}
                onPress={handleGroupsToggle}
                activeOpacity={0.7}
              >
                <View style={themed($sectionHeaderContent)}>
                  <Text style={themed($sectionHeaderTitle)} text={`Groups (${groups.length})`} />
                  <View style={themed($sectionHeaderRight)}>
                    {groupsCollapsed && (
                      <Text style={themed($collapsedGroupsSummary)} text={`${groups.length} group${groups.length !== 1 ? "s" : ""} hidden`} />
                    )}
                    <Icon
                      icon={groupsCollapsed ? "caretRight" : "caretLeft"}
                      size={20}
                      color={theme.colors.text}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Groups Content */}
              {!groupsCollapsed && (
                groups.map((group: Group, index: number) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    navigation={navigation} 
                    index={index} 
                    onNavigateToDetail={handleNavigateToGroupDetail}
                  />
                ))
              )}
            </>
          )
        )}

        {!loading && !refreshing && user && invitations.length > 0 && (
          <>
            <Text style={themed($sectionTitle)} text="Invitations" />
            {invitations.map((invite: GroupInvitation, index: number) => (
              <InvitationCard
                key={invite.id}
                invite={invite}
                onRespond={handleInvitationResponse}
                index={index}
              />
            ))}
          </>
        )}

        {!loading && !refreshing && user && invitations.length === 0 && groups.length > 0 && (
          <View style={themed($noInvitationsContainer)}>
            <Text style={themed($noInvitationsText)} text="No pending invitations" />
            <Text
              style={themed($noInvitationsSubtext)}
              text="Pull down to refresh or tap the refresh button above"
            />
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        confirmStyle={alertConfirmStyle}
        onConfirm={() => setAlertVisible(false)}
      />
    </Screen>
  )
}

// Styles
const $root = ({ colors }: any): ViewStyle => ({ flex: 1, backgroundColor: colors.background })
const $loadingContainer = ({ spacing }: any): ViewStyle => ({
  paddingVertical: spacing.lg,
  alignItems: "center",
})
const $authPromptContainer = ({ spacing }: any): ViewStyle => ({
  paddingVertical: spacing.lg,
  alignItems: "center",
  marginBottom: spacing.md,
})
const $authPromptTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 18,
  color: colors.text,
  marginBottom: 8,
})
const $authPromptText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})
const $sectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginTop: spacing.lg,
  marginBottom: spacing.sm,
})
const $emptyStateContainer = (): ViewStyle => ({
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "center",
  paddingTop: verticalPadding,
  paddingBottom: verticalPadding,
})
const $emptyState = ({ spacing }: any): ViewStyle => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl * 2,
})
const $emptyStateTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})
const $emptyStateText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.md,
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
const $refreshControlColor = ({ colors }: any): string => colors.tint
const $noInvitationsContainer = ({ spacing }: any): ViewStyle => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.lg,
  marginTop: spacing.md,
})
const $noInvitationsText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.xs,
})
const $noInvitationsSubtext = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})
const $sectionHeader = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
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
const $sectionHeaderTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})
const $collapsedGroupsContainer = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.md,
  marginTop: spacing.sm,
})
const $collapsedGroupsSummary = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
})
