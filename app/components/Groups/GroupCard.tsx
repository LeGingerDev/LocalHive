import React from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle, Image, ImageStyle } from "react-native"
import { Group } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { spacing } from "@/theme/spacing"
import { Icon } from "@/components/Icon"

interface GroupCardProps {
  group: Group
  navigation: any
}

export const GroupCard = ({ group, navigation }: GroupCardProps) => {
  const { themed, theme } = useAppTheme()
  
  // Calculate member display text
  const memberCount = group.member_count || 0
  const memberText = group.member_limit ? `${memberCount}/${group.member_limit}` : `${memberCount}`

  // Determine privacy label
  const privacyLabel = group.is_public ? "Public" : "Private"

  const handleViewGroup = () => {
    navigation.navigate('GroupDetail', { groupId: group.id })
  }

  return (
    <TouchableOpacity 
      style={themed($groupCard)}
      onPress={handleViewGroup}
      activeOpacity={0.8}
    >
      <View style={themed($contentContainer)}>
        <View style={themed($textContainer)}>
          <View style={themed($nameRow)}>
            {/* Privacy indicator */}
            <View style={[
              themed($privacyIndicator), 
              { backgroundColor: group.is_public ? theme.colors.success : theme.colors.error }
            ]} />
            
            <Text style={themed($groupName)} text={group.name} numberOfLines={1} ellipsizeMode="tail" />
            
            {/* Privacy label - only show in development */}
            {__DEV__ && (
              <Text style={themed($privacyLabel)} text={privacyLabel} />
            )}
          </View>
          
          <View style={themed($metaRow)}>
            <Icon 
              icon="menu" 
              size={14} 
              color={theme.colors.textDim} 
              containerStyle={themed($memberIconContainer)}
            />
            <Text style={themed($memberCount)} text="Members: " />
            <Text style={themed($memberCountValue)} text={memberText} />
          </View>
        </View>
        
        <TouchableOpacity 
          style={themed($viewButton)} 
          onPress={handleViewGroup}
          activeOpacity={0.7}
        >
          <Text style={themed($viewButtonText)} text="View" />
          <Icon 
            icon="caretRight" 
            size={12} 
            color="#000000" 
            containerStyle={themed($buttonIconContainer)}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

// Compact styles
const $groupCard = ({ colors, spacing }: any): ViewStyle => ({ 
  backgroundColor: colors.cardColor, 
  borderRadius: 12, 
  padding: spacing.sm, 
  paddingVertical: spacing.sm + 2,
  marginBottom: spacing.sm, 
  shadowColor: colors.palette.neutral800, 
  shadowOpacity: 0.08, 
  shadowRadius: 8, 
  shadowOffset: { width: 0, height: 3 }, 
  elevation: 2,
  borderWidth: 1,
  borderColor: colors.border
})

const $contentContainer = (): ViewStyle => ({ 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "space-between" 
})

const $textContainer = (): ViewStyle => ({ 
  flex: 1, 
  marginRight: spacing.sm 
})

const $nameRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 2
})

const $privacyIndicator = (): ViewStyle => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  marginRight: 6
})

const $privacyLabel = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginLeft: 4
})

const $groupName = ({ colors, typography }: any): TextStyle => ({ 
  fontFamily: typography.primary.medium, 
  fontSize: 16, 
  color: colors.text,
  flex: 1
})

const $metaRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center"
})

const $memberIconContainer = (): ViewStyle => ({
  marginRight: 4
})

const $memberCount = ({ colors, typography }: any): TextStyle => ({ 
  fontFamily: typography.primary.normal, 
  fontSize: 13, 
  color: colors.textDim
})

const $memberCountValue = ({ colors, typography }: any): TextStyle => ({ 
  fontFamily: typography.primary.medium, 
  fontSize: 13, 
  color: colors.text
})

const $viewButton = ({ colors }: any): ViewStyle => ({ 
  backgroundColor: colors.cta, 
  borderRadius: 8, 
  paddingVertical: spacing.xs, 
  paddingHorizontal: spacing.md, 
  alignSelf: "center",
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.cta
})

const $viewButtonText = ({ colors, typography }: any): TextStyle => ({ 
  color: "#000000", 
  fontFamily: typography.primary.medium, 
  fontSize: 14, 
  textAlign: "center" 
})

const $buttonIconContainer = (): ViewStyle => ({
  marginLeft: 4
}) 