import React, { useState, useEffect } from "react"
import { View, ViewStyle, TouchableOpacity, ActivityIndicator } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated"

import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { HapticService } from "@/services/hapticService"
import { GroupInvitation } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface InvitationCardProps {
  invite: GroupInvitation
  onRespond: (id: string, status: "accepted" | "declined") => Promise<boolean>
  index?: number // For staggered animations
}

export const InvitationCard = ({ invite, onRespond, index = 0 }: InvitationCardProps) => {
  const { themed } = useAppTheme()
  const [isResponding, setIsResponding] = useState(false)

  // Animation values
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(30)
  const acceptScale = useSharedValue(1)
  const declineScale = useSharedValue(1)

  const groupName = invite.group?.name || "Unknown Group"
  const inviterName = invite.inviter?.full_name || "Unknown User"
  const memberCount = invite.group?.member_count || 0

  // Entrance animation
  useEffect(() => {
    const delay = index * 50 // Staggered entrance for invitations
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 })
      opacity.value = withTiming(1, { duration: 400 })
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
    }, delay)
  }, [])

  const handleRespond = async (status: "accepted" | "declined") => {
    HapticService.medium()
    console.log("🔍 [InvitationCard] handleRespond called with status:", status)
    console.log("🔍 [InvitationCard] Invitation ID:", invite.id)
    console.log("🔍 [InvitationCard] Group name:", groupName)
    console.log("🔍 [InvitationCard] Current isResponding state:", isResponding)

    if (isResponding) {
      console.log("🔍 [InvitationCard] Already responding, ignoring request")
      return
    }

    console.log("🔍 [InvitationCard] Setting isResponding to true")
    setIsResponding(true)

    try {
      console.log("🔍 [InvitationCard] Calling onRespond with ID:", invite.id, "status:", status)
      const result = await onRespond(invite.id, status)
      console.log("🔍 [InvitationCard] onRespond returned:", result)

      if (result) {
        console.log("🔍 [InvitationCard] Response successful!")
      } else {
        console.log("🔍 [InvitationCard] Response failed (returned false)")
      }
    } catch (error) {
      console.error("🔍 [InvitationCard] Error responding to invitation:", error)
      console.error("🔍 [InvitationCard] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        invitationId: invite.id,
        status: status,
      })
    } finally {
      console.log("🔍 [InvitationCard] Setting isResponding to false")
      setIsResponding(false)
    }
  }

  const handleAcceptPressIn = () => {
    if (!isResponding) {
      acceptScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
    }
  }

  const handleAcceptPressOut = () => {
    if (!isResponding) {
      acceptScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }
  }

  const handleDeclinePressIn = () => {
    if (!isResponding) {
      declineScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
    }
  }

  const handleDeclinePressOut = () => {
    if (!isResponding) {
      declineScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }
  }

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const animatedAcceptStyle = useAnimatedStyle(() => ({
    transform: [{ scale: acceptScale.value }],
  }))

  const animatedDeclineStyle = useAnimatedStyle(() => ({
    transform: [{ scale: declineScale.value }],
  }))

  return (
    <Animated.View style={[themed($invitationCard), animatedCardStyle]}>
      <View style={themed($invitationInfo)}>
        <View style={themed($avatar)}>
          <Text style={themed($avatarInitial)} text={groupName[0]} />
        </View>
        <View style={themed($invitationContent)}>
          <Text style={themed($invitationTitle)} text={groupName} />
          <Text
            style={themed($invitationMeta)}
            text={`Invited by ${inviterName} • ${memberCount} members`}
          />
        </View>
        <View style={themed($actionButtons)}>
          {isResponding ? (
            <ActivityIndicator size="small" color={themed($loadingColor).color} />
          ) : (
            <>
              <Animated.View style={animatedAcceptStyle}>
                <TouchableOpacity
                  style={themed($acceptButton)}
                  onPress={() => handleRespond("accepted")}
                  onPressIn={handleAcceptPressIn}
                  onPressOut={handleAcceptPressOut}
                  activeOpacity={1}
                  disabled={isResponding}
                >
                  <Icon icon="checkOutline" size={16} color={themed($acceptIconColor).color} />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={animatedDeclineStyle}>
                <TouchableOpacity
                  style={themed($declineButton)}
                  onPress={() => handleRespond("declined")}
                  onPressIn={handleDeclinePressIn}
                  onPressOut={handleDeclinePressOut}
                  activeOpacity={1}
                  disabled={isResponding}
                >
                  <Icon icon="xOutline" size={16} color={themed($declineIconColor).color} />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

// Styles
const $invitationCard = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
})

const $invitationInfo = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
})

const $avatar = ({ colors }: any): ViewStyle => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.primary300,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.sm,
})

const $avatarInitial = ({ colors, typography }: any) => ({
  color: colors.palette.neutral100,
  fontFamily: typography.primary.medium,
  fontSize: 16,
})

const $invitationContent = (): ViewStyle => ({
  flex: 1,
})

const $invitationTitle = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: colors.text,
})

const $invitationMeta = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: 2,
})

const $actionButtons = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $acceptButton = ({ colors }: any): ViewStyle => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "transparent",
  borderWidth: 2,
  borderColor: colors.success,
  alignItems: "center",
  justifyContent: "center",
})

const $declineButton = ({ colors }: any): ViewStyle => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "transparent",
  borderWidth: 2,
  borderColor: colors.error,
  alignItems: "center",
  justifyContent: "center",
})

const $acceptIconColor = ({ colors }: any) => ({
  color: colors.success,
})

const $declineIconColor = ({ colors }: any) => ({
  color: colors.error,
})

const $loadingColor = ({ colors }: any) => ({
  color: colors.textDim,
})
