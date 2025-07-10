import React from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text } from "@/components/Text"
import { MemberCard } from "./MemberCard"
import { useAppTheme } from "@/theme/context"
import { GroupMember } from "@/services/api/types"

export interface MembersSectionProps {
  members?: GroupMember[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onMemberPress?: (member: GroupMember) => void
  style?: ViewStyle
  testID?: string
}

export const MembersSection = ({
  members = [],
  loading = false,
  error = null,
  onRetry,
  onMemberPress,
  style,
  testID = "membersSection"
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
  marginBottom: spacing.md 
})
const $emptyText = ({ typography, colors }: any): TextStyle => ({ 
  fontFamily: typography.primary.normal, 
  fontSize: 14, 
  color: colors.textDim, 
  textAlign: "center" as const, 
  fontStyle: "italic" as const 
})