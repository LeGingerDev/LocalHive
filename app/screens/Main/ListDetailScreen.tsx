import { FC, useState, useEffect } from "react"
import { View, ViewStyle, FlatList, TouchableOpacity, TextStyle } from "react-native"

import { Header } from "@/components/Header"
import { ItemInputDisplay } from "@/components/ItemInputDisplay"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { ItemListService, type ListItem } from "@/services/supabase/itemListService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ListDetailScreenProps {
  navigation: any
  route: any
}

export const ListDetailScreen: FC<ListDetailScreenProps> = ({ navigation, route }) => {
  const { themed } = useAppTheme()
  const { user } = useAuth()
  const { listName, listId } = route.params || {}
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate progress
  const completedCount = listItems.filter(item => item.is_completed).length
  const totalCount = listItems.length
  const progressText = `${completedCount}/${totalCount}`

  const handleBackPress = () => {
    navigation.goBack()
  }

  const loadListItems = async () => {
    if (!listId) return

    setLoading(true)
    try {
      const { data, error } = await ItemListService.getListWithItems(listId)
      if (error) {
        console.error("Error loading list items:", error)
      } else if (data) {
        setListItems(data.items || [])
      }
    } catch (error) {
      console.error("Error loading list items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (text: string) => {
    if (!listId || !user?.id) return

    try {
      const { error } = await ItemListService.addTextItemToList(listId, text)
      if (error) {
        console.error("Error adding item:", error)
      } else {
        // Reload the list items
        await loadListItems()
      }
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const { error } = await ItemListService.updateListItem(itemId, {
        is_completed: !isCompleted,
      })
      if (error) {
        console.error("Error updating item:", error)
      } else {
        // Update the local state
        setListItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, is_completed: !isCompleted } : item
          )
        )
      }
    } catch (error) {
      console.error("Error updating item:", error)
    }
  }

  useEffect(() => {
    loadListItems()
  }, [listId])

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadListItems()
    })

    return unsubscribe
  }, [navigation, listId])

  const renderListItem = ({ item }: { item: ListItem }) => (
    <TouchableOpacity
      style={[
        themed($listItem),
        item.is_completed && themed($listItemCompleted),
      ]}
      onPress={() => handleToggleItem(item.id, item.is_completed)}
      activeOpacity={0.7}
    >
      <View style={themed($itemContent)}>
        <Text
          style={[
            themed($itemText),
            item.is_completed && themed($itemTextCompleted),
          ]}
          text={item.item_title || "Unknown Item"}
        />
        {item.quantity > 1 && (
          <Text style={themed($itemQuantity)} text={`×${item.quantity}`} />
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <Screen
      style={themed($root)}
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($contentContainer)}
    >
      <Header title={listName || "List"} showBackButton onBackPress={handleBackPress} />

      {/* Progress Display */}
      {totalCount > 0 && (
        <View style={themed($progressContainer)}>
          <Text style={themed($progressText)} text={progressText} />
          <Text style={themed($progressLabel)} text="items completed" />
        </View>
      )}

      <View style={themed($contentArea)}>
        {/* Add New Item Button */}
        <ItemInputDisplay
          onAddItem={handleAddItem}
          placeholder="Enter item name..."
          disabled={loading}
        />

        {/* List Items */}
        <FlatList
          data={listItems}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themed($listContainer)}
          ListEmptyComponent={
            !loading ? (
              <View style={themed($emptyContainer)}>
                <Text style={themed($emptyText)} text="No items in this list yet" />
                <Text style={themed($emptySubtext)} text="Tap 'Add New Item' to get started" />
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  )
}

const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
})

const $contentArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $listContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
  paddingBottom: spacing.lg,
})

const $listItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $listItemCompleted: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
  opacity: 0.6,
})

const $itemContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $itemText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  flex: 1,
})

const $itemTextCompleted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textDecorationLine: "line-through",
})

const $itemQuantity: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  marginLeft: spacing.sm,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  textAlign: "center",
})

const $progressContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $progressText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.tint,
  fontFamily: typography.primary.bold,
  fontSize: 18,
})

const $progressLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  marginTop: 2,
})
