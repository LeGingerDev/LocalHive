import React, { useEffect, useCallback } from "react"
import { View, ScrollView, ViewStyle, TextStyle, Alert, TouchableOpacity, RefreshControl } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useAppTheme } from "@/theme/context"
import { useGroups } from "@/hooks/useGroups"
import { useAuth } from "@/context/AuthContext"
import { Group, GroupInvitation } from "@/services/api/types"
import { GroupCard } from "@/components/Groups/GroupCard"
import { InvitationCard } from "@/components/Groups/InvitationCard"
import { StartGroupCard } from "@/components/Groups/StartGroupCard"
import { CacheDebugger, CacheService } from "@/services/cache"
import { spacing } from "@/theme/spacing"
import { InvitationForm } from "@/components/InvitationForm"

const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($errorContainer)}>
      <Text style={themed($errorText)} text={error} />
      <TouchableOpacity 
        style={themed($retryButton)} 
        onPress={onRetry}
        activeOpacity={0.8}
      >
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
      <Text style={themed($authPromptText)} text="You need to be signed in to view and manage your groups." />
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
    createGroup 
  } = useGroups()

  // Debug logging
  useEffect(() => {
    console.log("GroupsScreen Debug:", { 
      authLoading, 
      user: user ? { id: user.id, email: user.email } : null,
      loading, 
      error, 
      groupsCount: groups.length, 
      invitationsCount: invitations.length 
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
        
        // Check if we need to force refresh (e.g., after creating a group)
        if (route.params?.refresh) {
          console.log("GroupsScreen: Force refresh requested from navigation params")
          forceRefreshGroups()
          // Clear the refresh flag
          navigation.setParams({ refresh: undefined })
          return
        }
        
        // Only refresh if cache is stale and we have no groups, or if cache is very stale
        if (CacheService.shouldRefreshGroups()) {
          if (groups.length === 0) {
            console.log("GroupsScreen: No groups loaded and cache is stale, refreshing")
            refreshGroups()
          } else {
            console.log("GroupsScreen: Groups already loaded, checking if cache needs refresh")
            // Only refresh if cache is very stale (more than 10 minutes)
            const cacheStats = CacheService.getCacheStats()
            if (cacheStats.age && cacheStats.age > 10 * 60 * 1000) { // 10 minutes
              console.log("GroupsScreen: Cache is very stale, refreshing")
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
    }, [user, loading, refreshGroups, groups.length, route.params?.refresh])
  )

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined'): Promise<boolean> => {
    const success = await respondToInvitation(invitationId, status)
    if (success) {
      Alert.alert(
        status === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined',
        status === 'accepted' 
          ? 'You have joined the group!' 
          : 'The invitation has been declined.'
      )
    } else {
      Alert.alert('Error', 'Failed to respond to invitation. Please try again.')
    }
    return success
  }

  const handleCreateGroup = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to create a group.')
      return
    }
    navigation.navigate('CreateGroup')
  }

  const handleNewGroup = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to create a group.')
      return
    }
    navigation.navigate('CreateGroup')
  }

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refreshGroups()
    }
  }, [refreshGroups, user])

  const handleForceRefresh = useCallback(async () => {
    if (user) {
      await forceRefreshGroups()
    }
  }, [forceRefreshGroups, user])

  // Show auth loading
  if (authLoading) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={['top', 'bottom']}>
        <LoadingSpinner text="Checking authentication..." />
      </Screen>
    )
  }

  // Show error if there is one
  if (error) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={['top', 'bottom']}>
        <ErrorView error={error} onRetry={loadGroups} />
      </Screen>
    )
  }

  return (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={['top', 'bottom']}>
      <View style={themed($headerRow)}>
        <Text style={themed($headerTitle)} text="Groups" />
        <View style={themed($headerActions)}>
          {__DEV__ && (
            <TouchableOpacity 
              style={themed($debugButton)} 
              onPress={handleForceRefresh}
              activeOpacity={0.8}
            >
              <Text style={themed($debugButtonText)} text="🔄 Debug" />
            </TouchableOpacity>
          )}
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
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themed($refreshControlColor)}
          />
        }
      >
        {!loading && user && groups.length === 0 ? (
          <View style={themed($emptyState)}>
            <Text style={themed($emptyStateTitle)} text="No Groups Yet" />
            <Text style={themed($emptyStateText)} text="Create your first group to get started" />
          </View>
        ) : (
          user && groups.map((group: Group, index: number) => (
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
        
        <StartGroupCard onPress={handleCreateGroup} />
      </ScrollView>
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $headerRow = (): ViewStyle => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md })
const $headerTitle = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.bold, fontSize: 22, color: colors.text })
const $headerActions = (): ViewStyle => ({ flexDirection: "row", alignItems: "center", gap: spacing.sm })
const $headerActionButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.xs, paddingHorizontal: spacing.md })
const $headerActionText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.tint })
const $debugButton = ({ colors }: any): ViewStyle => ({ backgroundColor: colors.error, borderRadius: 8, paddingVertical: spacing.xs, paddingHorizontal: spacing.md })
const $debugButtonText = ({ typography, colors }: any): TextStyle => ({ color: colors.background, fontFamily: typography.primary.medium, fontSize: 14, textAlign: "center" })
const $loadingContainer = ({ spacing }: any): ViewStyle => ({ paddingVertical: spacing.lg, alignItems: "center" })
const $authPromptContainer = ({ spacing }: any): ViewStyle => ({ paddingVertical: spacing.lg, alignItems: "center", marginBottom: spacing.md })
const $authPromptTitle = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 18, color: colors.text, marginBottom: 8 })
const $authPromptText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 14, color: colors.textDim, textAlign: "center" })
const $sectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm })
const $emptyState = ({ spacing }: any): ViewStyle => ({ alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl * 2 })
const $emptyStateTitle = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.medium, fontSize: 18, color: colors.text, marginBottom: spacing.md })
const $emptyStateText = ({ typography, colors }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 14, color: colors.textDim, textAlign: "center" })
const $errorContainer = ({ spacing }: any): ViewStyle => ({ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg })
const $errorText = ({ typography, colors, spacing }: any): TextStyle => ({ fontFamily: typography.primary.normal, fontSize: 16, color: colors.error, textAlign: "center", marginBottom: spacing.md })
const $retryButton = ({ colors, typography }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, overflow: "hidden" as "hidden" })
const $retryButtonText = ({ colors, typography }: any): TextStyle => ({ color: colors.tint, fontFamily: typography.primary.medium, fontSize: 15, textAlign: "center" })
const $refreshControlColor = ({ colors }: any): string => colors.tint