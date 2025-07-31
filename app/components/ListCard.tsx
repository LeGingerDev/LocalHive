import React from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, ImageStyle } from "react-native"

import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { ItemList } from "@/services/supabase/itemListService"

interface ListCardProps {
  list: ItemList
  onPress?: (list: ItemList) => void
  onMenuPress?: (list: ItemList) => void
  showLockIcon?: boolean
  showMenuButton?: boolean
  groupName?: string // Optional group name to display as a tag
  style?: ViewStyle
}

export const ListCard: React.FC<ListCardProps> = ({
  list,
  onPress,
  onMenuPress,
  showLockIcon = true,
  showMenuButton = true,
  groupName,
  style,
}) => {
  const { themed, theme } = useAppTheme()

  // Calculate progress percentage
  const totalItems = list.item_count || 0
  const completedItems = list.completed_count || 0
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  const handlePress = () => {
    onPress?.(list)
  }

  const handleMenuPress = () => {
    onMenuPress?.(list)
  }

  return (
    <View style={[themed($listCard), style]}>
      <TouchableOpacity 
        style={themed($listCardContent)}
        onPress={handlePress}
        activeOpacity={0.7}
      >
                        <View style={themed($listTitleContainer)}>
                  <Text style={themed($listTitle)} text={list.name} />
                  <View style={themed($tagsContainer)}>
                    {/* Group Tag */}
                    {showLockIcon && (list.group_id ? groupName : "Personal") && (
                      <View style={themed($groupTagContainer)}>
                        <View style={themed($groupTagLine)} />
                        <View style={themed($groupTag)}>
                          <Text style={themed($groupTagText)} text={list.group_id ? groupName || "Group" : "Personal"} />
                        </View>
                      </View>
                    )}
                    {/* Creator Tag */}
                    {list.creator_name && (
                      <View style={themed($creatorTagContainer)}>
                        <View style={themed($creatorTagLine)} />
                        <View style={themed($creatorTag)}>
                          <Text style={themed($creatorTagText)} text={list.creator_name} />
                        </View>
                      </View>
                    )}
                  </View>
                </View>
        <View style={themed($listProgressContainer)}>
          <View style={themed($listProgressBarBackground)}>
            <View 
              style={[
                themed($listProgressBarFill), 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text
            style={themed($listProgressText)}
            text={`${completedItems}/${totalItems}`}
          />
        </View>
      </TouchableOpacity>
      {showMenuButton && (
        <TouchableOpacity 
          style={themed($listMenuButton)}
          onPress={handleMenuPress}
        >
          <Text style={themed($listMenuIcon)} text="⋮" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const $listCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 1,
  borderColor: colors.palette.neutral400,
})

const $listCardContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listTitleContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 8,
})

const $listTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  fontWeight: "600",
  flex: 1,
  marginRight: 8,
})

const $listProgressContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $listProgressBarBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  height: 4,
  backgroundColor: colors.border,
  borderRadius: 2,
  overflow: "hidden",
})

const $listProgressBarFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: "100%",
  backgroundColor: colors.tint,
  borderRadius: 2,
})

const $listProgressText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 12,
})

const $listMenuButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $listMenuIcon: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 24,
  fontWeight: "bold",
})

// Group Tag Styles
const $groupTagContainer: ThemedStyle<ViewStyle> = () => ({
  position: "relative",
})

const $groupTagLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 8,
  left: -4,
  width: 4,
  height: 1,
  backgroundColor: colors.border,
})

const $groupTag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})

const $groupTagText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 10,
  color: colors.textDim,
  textAlign: "center",
})

const $tagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  flexWrap: "wrap",
  marginTop: spacing.xs,
})

const $creatorTagContainer: ThemedStyle<ViewStyle> = () => ({
  position: "relative",
})

const $creatorTagLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 8,
  left: -4,
  width: 4,
  height: 1,
  backgroundColor: colors.palette.neutral300,
})

const $creatorTag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  borderRadius: 12,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})

const $creatorTagText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 10,
  color: colors.textDim,
  textAlign: "center",
}) 