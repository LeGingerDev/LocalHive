import { useCallback, useState } from "react"
import {
  View,
  ScrollView,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  RefreshControl,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { InvitationCard } from "@/components/Groups/InvitationCard"
import { Header } from "@/components/Header"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { NotReadyYet } from "@/components/NotReadyYet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useInvitations } from "@/hooks/useInvitations"
import { GroupInvitation } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

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
        text="You need to be signed in to view and manage your invitations."
      />
    </View>
  )
}

const EmptyState = ({ title, message }: { title: string; message: string }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($emptyState)}>
      <Text style={themed($emptyStateTitle)} text={title} />
      <Text style={themed($emptyStateText)} text={message} />
    </View>
  )
}

export const InvitationsScreen = () => {
  const { themed } = useAppTheme()
  const { user, isLoading: authLoading } = useAuth()
  const {
    pendingInvitations,
    sentInvitations,
    loading,
    error,
    isRefreshing,
    loadPendingInvitations,
    loadSentInvitations,
    refreshInvitations,
    forceRefreshInvitations,
    respondToInvitation,
    cancelInvitation,
  } = useInvitations()

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">(
    "default",
  )
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null)

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && !loading) {
        refreshInvitations()
      }
    }, [user, loading, refreshInvitations]),
  )

  const showAlert = (
    title: string,
    message: string,
    confirmStyle: "default" | "destructive" | "success" = "default",
    onConfirm?: () => void,
  ) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertConfirmStyle(confirmStyle)
    setAlertOnConfirm(onConfirm || (() => setAlertVisible(false)))
    setAlertVisible(true)
  }

  const handleInvitationResponse = async (
    invitationId: string,
    status: "accepted" | "declined",
  ): Promise<boolean> => {
    const success = await respondToInvitation(invitationId, status)
    if (success) {
      showAlert(
        status === "accepted" ? "Invitation Accepted" : "Invitation Declined",
        status === "accepted" ? "You have joined the group!" : "The invitation has been declined.",
        status === "accepted" ? "success" : "default",
      )
    } else {
      showAlert("Error", "Failed to respond to invitation. Please try again.", "destructive")
    }
    return success
  }

  const handleCancelInvitation = async (invitationId: string) => {
    showAlert(
      "Cancel Invitation",
      "Are you sure you want to cancel this invitation?",
      "destructive",
      async () => {
        const success = await cancelInvitation(invitationId)
        if (success) {
          showAlert("Success", "Invitation has been cancelled.", "success")
        } else {
          showAlert("Error", "Failed to cancel invitation. Please try again.", "destructive")
        }
      },
    )
  }

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refreshInvitations()
    }
  }, [refreshInvitations, user])

  const handleForceRefresh = useCallback(async () => {
    if (user) {
      await forceRefreshInvitations()
    }
  }, [forceRefreshInvitations, user])

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
        <ErrorView
          error={error}
          onRetry={() => {
            loadPendingInvitations(true)
            loadSentInvitations(true)
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header title="Invitations" />
      <NotReadyYet pageName="Invitations" />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        confirmStyle={alertConfirmStyle}
        onConfirm={() => {
          if (alertOnConfirm) {
            alertOnConfirm()
          }
          setAlertVisible(false)
        }}
        onCancel={() => setAlertVisible(false)}
      />
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1 })
const $content = ({ spacing }: any): ViewStyle => ({
  padding: spacing.lg,
  paddingBottom: spacing.xl * 2,
})
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
const $section = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.lg })
const $sectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.sm,
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
const $refreshControlColor = ({ colors }: any): { color: string } => ({ color: colors.tint })

// Sent invitation specific styles
const $sentInvitationCard = ({ colors, spacing }: any) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.md,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
})
const $sentInvitationInfo = (): ViewStyle => ({ flexDirection: "row", alignItems: "center" })
const $avatar = ({ colors }: any) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primary300,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginRight: 12,
})
const $avatarInitial = ({ colors, typography }: any) => ({
  color: colors.palette.neutral100,
  fontFamily: typography.primary.medium,
  fontSize: 18,
})
const $sentInvitationTitle = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})
const $sentInvitationMeta = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
  marginTop: 2,
})
const $sentInvitationStatus = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: 2,
})
const $cancelButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.error,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  alignSelf: "flex-start" as const,
  marginTop: spacing.sm,
})
const $cancelButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  textAlign: "center" as const,
})
