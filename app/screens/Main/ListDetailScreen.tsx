import { FC, useState, useEffect, useMemo } from "react"
import { View, ViewStyle, FlatList, TouchableOpacity, TextStyle, Image, ImageStyle, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { AllItemsModal } from "@/components/AllItemsModal"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { ItemInputDisplay } from "@/components/ItemInputDisplay"
import { ItemModal } from "@/components/ItemModal"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useSubscription } from "@/hooks/useSubscription"
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
  const subscription = useSubscription(user?.id || null)
  const { listName, listId } = route.params || {}
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listData, setListData] = useState<any>(null) // Store the full list data
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ItemWithProfile | null>(null)
  const [isItemModalVisible, setIsItemModalVisible] = useState(false)
  
  // Edit mode state
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isAllItemsModalVisible, setIsAllItemsModalVisible] = useState(false)

  // Calculate progress
  const completedCount = listItems.filter(item => item.is_completed).length
  const totalCount = listItems.length
  const progressText = `${completedCount}/${totalCount}`

  // Calculate hidden items count for group lists
  const hiddenItemsCount = useMemo(() => {
    if (!listData?.group_id || listItems.length === 0) return 0
    
    return listItems.filter(item => {
      if (item.is_text_item) return false
      return item.item_group_id !== listData.group_id
    }).length
  }, [listItems, listData])

  // Extract already linked item IDs to filter them out from AllItemsModal
  const alreadyLinkedItemIds = useMemo(() => {
    return listItems
      .filter(item => item.item_id) // Only linked items have item_id
      .map(item => item.item_id!)
  }, [listItems])

  // Filter items based on list context (personal vs group)
  const filteredListItems = useMemo(() => {
    if (listItems.length === 0) return listItems

    // If list has a group_id, filter items to only show those from that group
    // If personal list (no group_id), show all items
    if (listData?.group_id) {
      // For group lists, filter items to only show those from the same group
      const groupListItems = listItems.filter(item => {
        // Text items are always shown (they don't belong to any group)
        if (item.is_text_item) return true
        
        // For linked items, only show if they belong to the same group
        return item.item_group_id === listData.group_id
      })
      
      console.log("Group list filtering:", {
        listGroupId: listData.group_id,
        totalItems: listItems.length,
        filteredItems: groupListItems.length,
        hiddenItems: listItems.length - groupListItems.length
      })
      
      return groupListItems
    } else {
      // Personal list - show all items
      console.log("Personal list - showing all items:", listItems.length)
      return listItems
    }
  }, [listItems, listData])

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
        console.log("Loaded list data:", data)
        setListData(data) // The entire data object contains the list info
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

  const handleStartEdit = (item: ListItem) => {
    setEditingItemId(item.id)
    setEditText(item.item_title || item.text_content || "")
  }

  const handleSaveEdit = async () => {
    if (!editingItemId || !editText.trim()) return

    try {
      const itemToUpdate = listItems.find(item => item.id === editingItemId)
      if (!itemToUpdate) return

      if (itemToUpdate.is_text_item) {
        // Update text item
        const { error } = await ItemListService.updateListItemText(editingItemId, editText.trim())
        if (error) {
          console.error("Error updating text item:", error)
          return
        }
      } else {
        // For linked items, we need to update the text content
        // This might require a different approach depending on your database structure
        console.log("Updating linked item text:", editText.trim())
        // TODO: Implement linked item text update if needed
      }

      // Update local state
      setListItems(prevItems =>
        prevItems.map(item =>
          item.id === editingItemId
            ? { ...item, item_title: editText.trim(), text_content: editText.trim() }
            : item
        )
      )

      // Exit edit mode
      setEditingItemId(null)
      setEditText("")
    } catch (error) {
      console.error("Error saving edit:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditText("")
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await ItemListService.removeItemFromList(itemId)
      if (error) {
        console.error("Error deleting item:", error)
      } else {
        // Remove the item from local state
        setListItems(prevItems => prevItems.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  // Handle group change with auto-conversion of cross-group items
  const handleGroupChange = async (newGroupId: string | null) => {
    if (!listId) return

    try {
      console.log("Group change requested:", { listId, newGroupId })
      
      // 1. Identify items from other groups that need conversion
      const itemsToConvert = listItems.filter(item => {
        // Skip text items (they don't need conversion)
        if (item.is_text_item) return false
        
        // Convert items that don't belong to the new group
        return item.item_group_id !== newGroupId
      })
      
      console.log("Items to convert:", itemsToConvert.length)
      
      // 2. Convert cross-group items to text items
      for (const item of itemsToConvert) {
        try {
          // Get the item title to preserve it
          const itemTitle = item.item_title || "Unknown Item"
          
          // Remove the linked item
          await ItemListService.removeItemFromList(item.id)
          
          // Add as text item with preserved name and notes
          await ItemListService.addTextItemToList(
            listId,
            itemTitle,
            item.quantity,
            item.notes
          )
          
          console.log("Converted item:", itemTitle)
        } catch (error) {
          console.error("Error converting item:", error)
        }
      }
      
      // 3. Update the list's group assignment
      const { error } = await ItemListService.updateList(listId, {
        group_id: newGroupId,
      })
      
      if (error) {
        console.error("Error updating list group:", error)
      } else {
        // 4. Reload the list data
        await loadListItems()
        
        // 5. Show confirmation (you might want to add a toast or alert here)
        if (itemsToConvert.length > 0) {
          console.log(`Successfully converted ${itemsToConvert.length} items to text`)
          // TODO: Add user notification about conversion
        }
      }
    } catch (error) {
      console.error("Error changing list group:", error)
    }
  }

  const handleEditItemLink = async (item: ItemWithProfile) => {
    if (!editingItemId) return

    try {
      // Remove the current item
      const { error: removeError } = await ItemListService.removeItemFromList(editingItemId)
      if (removeError) {
        console.error("Error removing current item:", removeError)
        return
      }

      // Add the new linked item
      const { data: newListItem, error: addError } = await ItemListService.addItemToList(listId, item.id)
      if (addError) {
        console.error("Error adding new linked item:", addError)
        return
      }

      if (newListItem) {
        // Update local state - replace the editing item with the new linked item
        setListItems(prevItems =>
          prevItems.map(listItem =>
            listItem.id === editingItemId ? newListItem : listItem
          )
        )
      }

      // Exit edit mode and close AllItemsModal
      setEditingItemId(null)
      setEditText("")
      setIsAllItemsModalVisible(false)
    } catch (error) {
      console.error("Error linking new item:", error)
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

  const renderListItem = ({ item }: { item: ListItem }) => {
    // Improved logic for detecting linked items
    const isLinkedItem = item.item_id && !item.is_text_item
    const hasImage = isLinkedItem && item.item_image_urls && item.item_image_urls.length > 0
    const itemTitle = item.item_title || item.text_content || "Unknown Item"
    const isEditing = editingItemId === item.id
    
    // Debug logging to understand the data structure
    console.log('ListItem render:', {
      id: item.id,
      is_text_item: item.is_text_item,
      item_id: item.item_id,
      isLinkedItem,
      item_title: item.item_title,
      text_content: item.text_content,
      item_image_urls: item.item_image_urls,
      hasImage,
      isEditing
    })

    if (isEditing) {
      return (
        <View style={themed($listItem)}>
          <View style={themed($editContent)}>
            <TextInput
              style={themed($editInput)}
              value={editText}
              onChangeText={setEditText}
              placeholder="Enter item name..."
              placeholderTextColor={themed($placeholderText).color}
              autoFocus
              onSubmitEditing={handleSaveEdit}
              returnKeyType="done"
            />
            <View style={themed($editButtons)}>
              <TouchableOpacity
                style={themed($editButton)}
                onPress={handleSaveEdit}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={themed($editButtonColor).color}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($linkButton)}
                onPress={() => {
                  setIsAllItemsModalVisible(true)
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="link"
                  size={16}
                  color={themed($linkButtonColor).color}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={themed($editButton)}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={themed($editButtonColor).color}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={themed($listItemWrapper)}>
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
                  <TouchableOpacity
                    style={themed($linkedItemBadge)}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleItemImagePress(item)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={themed($linkedItemBadgeText)} text="🔗" />
                  </TouchableOpacity>
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
                handleStartEdit(item)
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil"
                size={16}
                color={themed($penIconColor).color}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={themed($deleteButton)}
          onPress={() => handleDeleteItem(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={18}
            color={themed($deleteButtonColor).color}
          />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Screen
      style={themed($root)}
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($contentContainer)}
    >
      <Header 
        title={listName || "List"} 
        showBackButton 
        onBackPress={handleBackPress}
        rightActions={[
          {
            customComponent: (
              <TouchableOpacity onPress={() => navigation.navigate("CreateList", { list: { id: listId, name: listName } })} activeOpacity={0.8}>
                <Ionicons name="pencil" size={20} color={themed($penIconColor).color} />
              </TouchableOpacity>
            ),
          },
        ]}
      />

      {/* Progress Display */}
      {totalCount > 0 && (
        <View style={themed($progressContainer)}>
          <Text style={themed($progressText)} text={progressText} />
          <Text style={themed($progressLabel)} text="items completed" />
        </View>
      )}

      <View style={themed($contentArea)}>
        {/* Upgrade Message for Item Linking */}
        {!subscription.isPro && !subscription.isTrial && (
          <View style={themed($upgradeMessageContainer)}>
            <Text style={themed($upgradeMessageText)}>
              Upgrade to Pro to link items directly from lists
            </Text>
          </View>
        )}

        {/* Hidden Items Warning for Group Lists */}
        {hiddenItemsCount > 0 && (
          <View style={themed($hiddenItemsWarningContainer)}>
            <Text style={themed($hiddenItemsWarningText)}>
              ⚠️ {hiddenItemsCount} item{hiddenItemsCount !== 1 ? 's' : ''} hidden because they're from other groups
            </Text>
          </View>
        )}

        {/* Add New Item Button */}
        <ItemInputDisplay
          onAddItem={handleAddItem}
          onItemLink={editingItemId ? handleEditItemLink : handleLinkItem}
          placeholder={editingItemId ? "Search for items to link..." : "Enter item name..."}
          disabled={loading}
          canLinkItems={subscription.isPro || subscription.isTrial}
        />

        {/* List Items */}
        <FlatList
          data={filteredListItems}
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

      {/* All Items Modal for linking during edit */}
              <AllItemsModal
          visible={isAllItemsModalVisible}
          onClose={() => setIsAllItemsModalVisible(false)}
          onItemSelect={handleEditItemLink}
          excludeItemIds={alreadyLinkedItemIds}
        />
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
  paddingHorizontal: spacing.sm, // Reduced from spacing.md
  paddingTop: spacing.sm, // Reduced from spacing.md
})

const $listContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.xs, // Reduced from spacing.md
  paddingBottom: spacing.md, // Reduced from spacing.lg
})

const $listItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 4,
  padding: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  flex: 1,
})

const $listItemCompleted: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
  opacity: 0.6,
})

const $itemContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingHorizontal: 4, // Reduced from 8
}

const $itemImageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40, // Reduced from 50
  height: 40, // Reduced from 50
  borderRadius: 4, // Reduced from 8
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
  borderRadius: 4, // Reduced from 8 to match container
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
})

const $imagePlaceholderText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 16, // Reduced from 18 to match smaller container
})

const $itemIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $penIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 28, // Reduced from 32
  height: 28, // Reduced from 32
  borderRadius: 14, // Reduced from 16
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.xs, // Reduced from spacing.sm
})

const $penIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $itemTextContainer: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginLeft: 8, // Reduced from 12
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
  color: "#FF4444", // Red color for completed text
  textDecorationLine: "line-through",
  textDecorationColor: "#FF4444", // Red color for the strikethrough line
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

const $editContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "column",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $editInput: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $editButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: spacing.xs,
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
})

const $editButtonColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $linkButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
})

const $linkButtonColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $listItemWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.xs,
  width: "100%",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.error + "20",
  borderWidth: 1,
  borderColor: colors.error,
  alignItems: "center",
  justifyContent: "center",
  marginLeft: spacing.xs,
})

const $deleteButtonColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.error,
})

const $upgradeMessageContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  alignItems: "center",
})

const $upgradeMessageText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  textAlign: "center",
})

const $hiddenItemsWarningContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.orange100 + "20",
  borderWidth: 1,
  borderColor: colors.palette.orange100,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  alignItems: "center",
})

const $hiddenItemsWarningText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.orange100,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  textAlign: "center",
})
