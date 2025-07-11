import React from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { GroupMember, MemberRole } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"

import { MemberCard } from "./MemberCard"

export interface MembersSectionProps {
  members?: GroupMember[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onMemberPress?: (member: GroupMember) => void
  onRemoveMember?: (member: GroupMember) => void
  canManageMembers?: boolean
  creatorId?: string
  style?: ViewStyle
  testID?: string
}

export const MembersSection = ({
  members = [],
  loading = false,
  error = null,
  onRetry,
  onMemberPress,
  onRemoveMember,
  canManageMembers = false,
  creatorId,
  style,
  testID = "membersSection",
}: MembersSectionProps) => {
  const { themed } = useAppTheme()

  if (loading) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_loading`}>
        <Text style={themed($sectionTitle)} text="Members" />
        <MemberCard isLoading={true} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[themed($container), style]} testID={`${testID}_error`}>
        <Text style={themed($sectionTitle)} text="Members" />
        <MemberCard error={error} onRetry={onRetry} />
      </View>
    )
  }

  return (
    <View style={[themed($container), style]} testID={testID}>
      <Text style={themed($sectionTitle)} text="Members" />
      {members.length === 0 ? (
        <Text style={themed($emptyText)} text="No members yet" />
      ) : (
        members.map((member) => (
          <MemberCard
            key={member.id}
            data={member}
            onPress={() => onMemberPress?.(member)}
            canRemove={canManageMembers && member.role !== "admin" && member.user_id !== creatorId}
            onRemove={() => onRemoveMember?.(member)}
            testID={`${testID}_member_${member.id}`}
          />
        ))
      )}
    </View>
  )
}

// Styles
const $container = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.xl })
const $sectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.md,
})
const $emptyText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center" as const,
  fontStyle: "italic" as const,
})
