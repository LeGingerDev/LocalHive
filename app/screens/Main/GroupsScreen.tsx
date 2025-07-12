import React, { useEffect, useCallback, useState } from "react"
import {
  View,
  ScrollView,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { GroupCard } from "@/components/Groups/GroupCard"
import { InvitationCard } from "@/components/Groups/InvitationCard"
import { StartGroupCard } from "@/components/Groups/StartGroupCard"
import { InvitationForm } from "@/components/InvitationForm"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useGroups } from "@/hooks/useGroups"
import { Group, GroupInvitation } from "@/services/api/types"
import { CacheDebugger, CacheService } from "@/services/cache"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

const windowHeight = Dimensions.get("window").height
const estimatedContentHeight = 300 // Adjust this estimate as needed
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
  const { themed } = useAppTheme()
  const { user, isLoading: authLoading } = useAuth()
  const {
    groups,
    invitations,
    loading,
    error,
    isRefreshing,
    loadGroups,
    refreshGroups,
    forceRefreshGroups,
    respondToInvitation,
    createGroup,
  } = useGroups()

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )

  // Track if we should force refresh when coming back from CreateGroup
  const [shouldForceRefresh, setShouldForceRefresh] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log("GroupsScreen Debug:", {
      authLoading,
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      error,
      groupsCount: groups.length,
      invitationsCount: invitations.length,
    })

    // Log cache statistics in development
    if (__DEV__) {
      CacheDebugger.logPerformanceMetrics()
    }
  }, [authLoading, user, loading, error, groups, invitations])

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && !loading) {
        console.log("GroupsScreen: Screen focused, checking for smart refresh")
        console.log("GroupsScreen: Current groups count:", groups.length)
        console.log("GroupsScreen: Current invitations count:", invitations.length)

        // Check if we need to force refresh (e.g., after creating a group)
        if (route.params?.refresh) {
          console.log("GroupsScreen: Force refresh requested from navigation params")
          forceRefreshGroups()
          // Clear the refresh flag
          navigation.setParams({ refresh: undefined })
          return
        }

        // Force refresh when coming back from CreateGroup
        if (shouldForceRefresh) {
          console.log("GroupsScreen: Force refresh after creating group")
          forceRefreshGroups()
          setShouldForceRefresh(false)
          return
        }

        // Always check for new invitations when screen comes into focus
        // This ensures users see new invitations immediately
        if (CacheService.shouldRefreshGroupsInvitations(user?.id)) {
          console.log("GroupsScreen: Refreshing invitations on screen focus")
          refreshGroups()
        } else {
          console.log("GroupsScreen: Invitations recently checked, skipping refresh")
        }

        // For groups, use the existing logic but be more aggressive
        if (CacheService.shouldRefreshGroups()) {
          if (groups.length === 0) {
            console.log("GroupsScreen: No groups loaded and cache is stale, refreshing")
            refreshGroups()
          } else {
            console.log("GroupsScreen: Groups already loaded, checking if cache needs refresh")
            // Refresh groups if cache is stale (more than 5 minutes instead of 10)
            const cacheStats = CacheService.getCacheStats(user?.id)
            if (cacheStats.age && cacheStats.age > 5 * 60 * 1000) {
              // 5 minutes
              console.log("GroupsScreen: Cache is stale, refreshing")
              refreshGroups()
            } else {
              console.log("GroupsScreen: Cache is reasonably fresh, keeping current data")
            }
          }
        } else {
          console.log("GroupsScreen: Cache is fresh, skipping refresh")
        }
      } else if (user && loading) {
        console.log("GroupsScreen: Screen focused but still loading, skipping refresh")
      } else if (!user) {
        console.log("GroupsScreen: Screen focused but no user, skipping refresh")
      }
    }, [user, loading, refreshGroups, groups.length, invitations.length, route.params?.refresh]),
  )

  const handleInvitationResponse = async (
    invitationId: string,
    status: "accepted" | "declined",
  ): Promise<boolean> => {
    const success = await respondToInvitation(invitationId, status)
    if (success) {
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
    setShouldForceRefresh(true)
    navigation.navigate("CreateGroup")
  }

  const handleNewGroup = () => {
    if (!user) {
      setAlertTitle("Authentication Required")
      setAlertMessage("Please sign in to create a group.")
      setAlertConfirmStyle("default")
      setAlertVisible(true)
      return
    }
    setShouldForceRefresh(true)
    navigation.navigate("CreateGroup")
  }

  const handleRefresh = useCallback(async () => {
    if (user) {
      console.log("GroupsScreen: Manual refresh triggered")
      await refreshGroups()
    }
  }, [refreshGroups, user])

  const handleForceRefresh = useCallback(async () => {
    if (user) {
      console.log("GroupsScreen: Force refresh triggered")
      await forceRefreshGroups()
    }
  }, [forceRefreshGroups, user])

  const handleInvitationRefresh = useCallback(async () => {
    if (user) {
      console.log("GroupsScreen: Invitation refresh triggered")
      // Force refresh invitations specifically
      await forceRefreshGroups()
    }
  }, [forceRefreshGroups, user])

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
        <ErrorView error={error} onRetry={loadGroups} />
      </Screen>
    )
  }

  return (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={["top", "bottom"]}>
      <View style={themed($headerRow)}>
        <Text style={themed($headerTitle)} text="Groups" />
        <View style={themed($headerActions)}>
          <View style={themed($invitationIndicatorContainer)}>
            <TouchableOpacity
              style={themed($invitationIndicatorButton)}
              onPress={handleRefresh}
              activeOpacity={0.8}
              disabled={isRefreshing}
            >
              <Text style={themed($invitationIndicatorText)} text="📬" />
            </TouchableOpacity>
            {invitations.length > 0 && (
              <View style={themed($notificationBadge)}>
                <Text style={themed($notificationBadgeText)} text={invitations.length.toString()} />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={themed($refreshHeaderButton)}
            onPress={handleForceRefresh}
            activeOpacity={0.8}
            disabled={isRefreshing}
          >
            <Text
              style={themed($refreshHeaderButtonText)}
              text={isRefreshing ? "Refreshing..." : "Refresh"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={themed($headerActionButton)}
            onPress={handleNewGroup}
            activeOpacity={0.8}
          >
            <Text style={themed($headerActionText)} text="+ New" />
          </TouchableOpacity>
        </View>
      </View>

      {!user && <AuthPrompt />}

      {loading && user && (
        <View style={themed($loadingContainer)}>
          <LoadingSpinner text="Loading groups..." />
        </View>
      )}

      {/* Main content area below header */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleForceRefresh}
            tintColor={themed($refreshControlColor)}
          />
        }
      >
        {!loading && user && groups.length === 0 && invitations.length === 0 ? (
          <View style={themed($emptyStateContainer)}>
            <View style={themed($emptyState)}>
              <Text style={themed($emptyStateTitle)} text="No Groups Yet" />
              <Text style={themed($emptyStateText)} text="Create your first group to get started" />
              <TouchableOpacity
                style={themed($createFirstGroupButton)}
                onPress={handleCreateGroup}
                activeOpacity={0.8}
              >
                <Text style={themed($createFirstGroupButtonText)} text="Create Your First Group" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          user &&
          groups.map((group: Group, index: number) => (
            <GroupCard key={group.id} group={group} navigation={navigation} index={index} />
          ))
        )}

        {!loading && user && invitations.length > 0 && (
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

        {!loading && user && invitations.length === 0 && groups.length > 0 && (
          <View style={themed($noInvitationsContainer)}>
            <Text style={themed($noInvitationsText)} text="No pending invitations" />
            <Text
              style={themed($noInvitationsSubtext)}
              text="Pull down to refresh or tap the mail icon above"
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
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $headerRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.md,
})
const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: colors.text,
})
const $headerActions = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
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
const $refreshHeaderButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})
const $refreshHeaderButtonText = ({ typography, colors }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textAlign: "center",
})
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
const $createFirstGroupButton = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
})
const $createFirstGroupButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
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
const $refreshControlColor = ({ colors }: any): string => colors.tint
const $invitationIndicatorContainer = (): ViewStyle => ({ position: "relative" })
const $invitationIndicatorButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})
const $invitationIndicatorText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
})
const $notificationBadge = ({ colors }: any): ViewStyle => ({
  position: "absolute",
  top: -4,
  right: -4,
  backgroundColor: colors.error,
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  borderColor: colors.background,
})
const $notificationBadgeText = ({ typography, colors }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 12,
  textAlign: "center",
})
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
