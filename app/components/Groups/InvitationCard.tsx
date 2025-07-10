import React from "react"
import { View, ViewStyle } from "react-native"
import { GroupInvitation } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { InviteButton } from "@/components/Groups/MembersSection/InviteButton"

interface InvitationCardProps {
  invite: GroupInvitation
  onRespond: (id: string, status: 'accepted' | 'declined') => void
}

export const InvitationCard = ({ invite, onRespond }: InvitationCardProps) => {
  const { themed } = useAppTheme()
  const groupName = invite.group?.name || "Unknown Group"
  const inviterName = invite.inviter?.full_name || "Unknown User"
  const memberCount = invite.group?.member_count || 0
  return (
    <View style={themed($invitationCard)}>
      <View style={themed($invitationInfo)}>
        <View style={themed($avatar)}>
          <Text style={themed($avatarInitial)} text={groupName[0]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={themed($invitationTitle)} text={groupName} />
          <Text style={themed($invitationMeta)} text={`Invited by ${inviterName} • ${memberCount} members`} />
        </View>
      </View>
      <View style={themed($invitationActions)}>
        <InviteButton 
          data={{ title: "Accept" }} 
          onPress={() => onRespond(invite.id, 'accepted')} 
        />
        <InviteButton 
          data={{ title: "Decline" }} 
          onPress={() => onRespond(invite.id, 'declined')} 
          style={themed($declineButton)} 
        />
      </View>
    </View>
  )
}

// Styles (copy from GroupsScreen)
const $invitationCard = ({ colors, spacing }: any) => ({ backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, shadowColor: colors.palette.neutral800, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 })
const $invitationInfo = (): ViewStyle => ({ flexDirection: "row", alignItems: "center", marginBottom: 8 })
const $avatar = ({ colors }: any) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary300, alignItems: "center" as const, justifyContent: "center" as const, marginRight: 12 })
const $avatarInitial = ({ colors, typography }: any) => ({ color: colors.palette.neutral100, fontFamily: typography.primary.medium, fontSize: 18 })
const $invitationTitle = ({ typography, colors }: any) => ({ fontFamily: typography.primary.medium, fontSize: 16, color: colors.text })
const $invitationMeta = ({ typography, colors }: any) => ({ fontFamily: typography.primary.normal, fontSize: 13, color: colors.textDim, marginTop: 2 })
const $invitationActions = (): ViewStyle => ({ flexDirection: "row", justifyContent: "flex-start", marginTop: 8 })
const $declineButton = ({ colors }: any) => ({ marginLeft: 12, backgroundColor: colors.palette.neutral300 }) 