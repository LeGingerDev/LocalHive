import React, { useState } from "react"
import { View, ViewStyle, TouchableOpacity, ActivityIndicator } from "react-native"
import { GroupInvitation } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { spacing } from "@/theme/spacing"

interface InvitationCardProps {
  invite: GroupInvitation
  onRespond: (id: string, status: 'accepted' | 'declined') => Promise<boolean>
}

export const InvitationCard = ({ invite, onRespond }: InvitationCardProps) => {
  const { themed } = useAppTheme()
  const [isResponding, setIsResponding] = useState(false)
  
  const groupName = invite.group?.name || "Unknown Group"
  const inviterName = invite.inviter?.full_name || "Unknown User"
  const memberCount = invite.group?.member_count || 0

  const handleRespond = async (status: 'accepted' | 'declined') => {
    if (isResponding) return
    
    setIsResponding(true)
    try {
      await onRespond(invite.id, status)
    } catch (error) {
      console.error('Error responding to invitation:', error)
    } finally {
      setIsResponding(false)
    }
  }

  return (
    <View style={themed($invitationCard)}>
      <View style={themed($invitationInfo)}>
        <View style={themed($avatar)}>
          <Text style={themed($avatarInitial)} text={groupName[0]} />
        </View>
        <View style={themed($invitationContent)}>
          <Text style={themed($invitationTitle)} text={groupName} />
          <Text style={themed($invitationMeta)} text={`Invited by ${inviterName} • ${memberCount} members`} />
        </View>
        <View style={themed($actionButtons)}>
          {isResponding ? (
            <ActivityIndicator size="small" color={themed($loadingColor).color} />
          ) : (
            <>
              <TouchableOpacity
                style={themed($acceptButton)}
                onPress={() => handleRespond('accepted')}
                activeOpacity={0.7}
                disabled={isResponding}
              >
                <Icon icon="check" size={16} color={themed($acceptIconColor).color} />
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($declineButton)}
                onPress={() => handleRespond('declined')}
                activeOpacity={0.7}
                disabled={isResponding}
              >
                <Icon icon="x" size={16} color={themed($declineIconColor).color} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
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
  elevation: 1 
})

const $invitationInfo = (): ViewStyle => ({ 
  flexDirection: "row", 
  alignItems: "center" 
})

const $avatar = ({ colors }: any): ViewStyle => ({ 
  width: 36, 
  height: 36, 
  borderRadius: 18, 
  backgroundColor: colors.primary300, 
  alignItems: "center", 
  justifyContent: "center", 
  marginRight: spacing.sm 
})

const $avatarInitial = ({ colors, typography }: any) => ({ 
  color: colors.palette.neutral100, 
  fontFamily: typography.primary.medium, 
  fontSize: 16 
})

const $invitationContent = (): ViewStyle => ({ 
  flex: 1 
})

const $invitationTitle = ({ typography, colors }: any) => ({ 
  fontFamily: typography.primary.medium, 
  fontSize: 15, 
  color: colors.text 
})

const $invitationMeta = ({ typography, colors }: any) => ({ 
  fontFamily: typography.primary.normal, 
  fontSize: 12, 
  color: colors.textDim, 
  marginTop: 2 
})

const $actionButtons = (): ViewStyle => ({ 
  flexDirection: "row", 
  alignItems: "center", 
  gap: spacing.xs 
})

const $acceptButton = ({ colors }: any): ViewStyle => ({ 
  width: 32, 
  height: 32, 
  borderRadius: 16, 
  backgroundColor: colors.success, 
  alignItems: "center", 
  justifyContent: "center" 
})

const $declineButton = ({ colors }: any): ViewStyle => ({ 
  width: 32, 
  height: 32, 
  borderRadius: 16, 
  backgroundColor: colors.error, 
  alignItems: "center", 
  justifyContent: "center" 
})

const $acceptIconColor = ({ colors }: any) => ({ 
  color: colors.palette.neutral100 
})

const $declineIconColor = ({ colors }: any) => ({ 
  color: colors.palette.neutral100 
})

const $loadingColor = ({ colors }: any) => ({ 
  color: colors.textDim 
}) 