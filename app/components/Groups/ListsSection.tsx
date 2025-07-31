import React, { useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, ScrollView } from "react-native"

import { ListCard } from "@/components/ListCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Text } from "@/components/Text"
import { useItemLists } from "@/hooks/useItemLists"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { ItemList } from "@/services/supabase/itemListService"

interface ListsSectionProps {
  groupId: string
  groupName?: string // Group name to display on list cards
  onListPress?: (list: ItemList) => void
  onAddList?: () => void
}

export const ListsSection: React.FC<ListsSectionProps> = ({
  groupId,
  groupName,
  onListPress,
  onAddList,
}) => {
  const { themed, theme } = useAppTheme()
  const { lists, loading, error } = useItemLists()
  const [groupLists, setGroupLists] = useState<ItemList[]>([])

  useEffect(() => {
    // Filter lists that belong to this group
    const filteredLists = lists.filter((list) => list.group_id === groupId)
    setGroupLists(filteredLists)
  }, [lists, groupId])

  const handleListPress = (list: ItemList) => {
    onListPress?.(list)
  }

  if (loading) {
    return <LoadingSpinner text="Loading lists..." />
  }

  if (error) {
    return (
      <View style={themed($errorContainer)}>
        <Text style={themed($errorText)} text={`Error loading lists: ${error}`} />
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      {/* Lists Content */}
      {groupLists.length === 0 ? (
        <View style={themed($emptyContainer)}>
          <Text style={themed($emptyText)} text="No lists yet" />
          <Text style={themed($emptySubtext)} text="Create a list to get started" />
        </View>
      ) : (
        <ScrollView style={themed($listsContainer)} showsVerticalScrollIndicator={false}>
          {groupLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onPress={handleListPress}
              showLockIcon={false}
              showMenuButton={false}
              groupName={groupName}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})



const $listsContainer: ThemedStyle<ViewStyle> = () => ({
  maxHeight: 200,
})



const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  marginBottom: spacing.xs,
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 12,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  alignItems: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 14,
}) 