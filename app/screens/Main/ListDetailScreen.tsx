import { FC, useState, useEffect } from "react"
import { View, ViewStyle, FlatList, TouchableOpacity, TextStyle, Image, ImageStyle } from "react-native"

import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { ItemInputDisplay } from "@/components/ItemInputDisplay"
import { ItemModal } from "@/components/ItemModal"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { ItemListService, type ListItem } from "@/services/supabase/itemListService"
import { ItemWithProfile, ItemService } from "@/services/supabase/itemService"
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
  const [selectedItem, setSelectedItem] = useState<ItemWithProfile | null>(null)
  const [isItemModalVisible, setIsItemModalVisible] = useState(false)

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
        console.log("Loaded list items:", data.items)
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

  const handleLinkItem = async (item: ItemWithProfile) => {
    if (!listId || !user?.id) return

    try {
      const { data: newListItem, error } = await ItemListService.addItemToList(listId, item.id)
      if (error) {
        console.error("Error linking item:", error)
      } else if (newListItem) {
        // Add the new item to the local state immediately with the correct data
        setListItems(prevItems => [...prevItems, newListItem])
      }
    } catch (error) {
      console.error("Error linking item:", error)
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

  const handleItemImagePress = async (listItem: ListItem) => {
    if (!listItem.item_id) return

    try {
      const { data: item, error } = await ItemService.getItemById(listItem.item_id)
      if (error) {
        console.error("Error fetching item:", error)
        return
      }
      
      if (item) {
        setSelectedItem(item)
        setIsItemModalVisible(true)
      }
    } catch (error) {
      console.error("Error fetching item:", error)
    }
  }

  const handleItemModalClose = () => {
    setIsItemModalVisible(false)
    setSelectedItem(null)
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

  const renderListItem = ({ item }: { item: ListItem }) => {
    // Improved logic for detecting linked items
    const isLinkedItem = item.item_id && !item.is_text_item
    const hasImage = isLinkedItem && item.item_image_urls && item.item_image_urls.length > 0
    const itemTitle = item.item_title || item.text_content || "Unknown Item"
    
    // Debug logging to understand the data structure
    console.log('ListItem render:', {
      id: item.id,
      is_text_item: item.is_text_item,
      item_id: item.item_id,
      isLinkedItem,
      item_title: item.item_title,
      text_content: item.text_content,
      item_image_urls: item.item_image_urls,
      hasImage
    })

    return (
      <TouchableOpacity
        style={[
          themed($listItem),
          item.is_completed && themed($listItemCompleted),
        ]}
        onPress={() => handleToggleItem(item.id, item.is_completed)}
        activeOpacity={0.7}
      >
        <View style={themed($itemContent)}>
          {/* Item Image or First Letter (for linked items) */}
          {isLinkedItem && (
            <TouchableOpacity
              style={themed($itemImageContainer)}
              onPress={(e) => {
                e.stopPropagation()
                handleItemImagePress(item)
              }}
              activeOpacity={0.8}
            >
              {hasImage ? (
                <Image
                  source={{ uri: item.item_image_urls![0] }}
                  style={themed($itemImage)}
                  resizeMode="cover"
                />
              ) : (
                <View style={themed($imagePlaceholder)}>
                  <Text style={themed($imagePlaceholderText)} text={itemTitle.charAt(0).toUpperCase()} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Item Text */}
          <View style={themed($itemTextContainer)}>
            <View style={themed($itemTextRow)}>
              <Text
                style={[
                  themed($itemText),
                  item.is_completed && themed($itemTextCompleted),
                ]}
                text={itemTitle}
              />
              {isLinkedItem && (
                <View style={themed($linkedItemBadge)}>
                  <Text style={themed($linkedItemBadgeText)} text="🔗" />
                </View>
              )}
            </View>
            {item.quantity > 1 && (
              <Text style={themed($itemQuantity)} text={`×${item.quantity}`} />
            )}
          </View>

          {/* Pen Icon */}
          <TouchableOpacity
            style={themed($penIconContainer)}
            onPress={(e) => {
              e.stopPropagation()
              // TODO: Handle edit functionality
              console.log('Edit item:', item.id)
            }}
            activeOpacity={0.7}
          >
            <Icon
              icon="settings"
              size={20}
              color={themed($penIconColor).color}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

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
          onItemLink={handleLinkItem}
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

      {/* Item Modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          visible={isItemModalVisible}
          onClose={handleItemModalClose}
        />
      )}
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
  justifyContent: "flex-start",
  paddingHorizontal: 8, // Add some padding to the content area
}

const $itemImageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 50,
  height: 50,
  borderRadius: 8,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
})

const $itemImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
})

const $imagePlaceholder: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  height: "100%",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
})

const $imagePlaceholderText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 18,
})

const $itemIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $penIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.sm,
})

const $penIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $itemTextContainer: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginLeft: 12, // Add margin to separate from image
}

const $itemTextRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $linkedItemBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 8,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  marginLeft: spacing.sm,
})

const $linkedItemBadgeText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})

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
