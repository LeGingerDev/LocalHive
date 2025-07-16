import { useState } from "react"
import { View, ViewStyle, TextStyle, Image, TouchableOpacity, ImageStyle } from "react-native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { ItemModal } from "@/components/ItemModal"
import { Text } from "@/components/Text"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { ItemService } from "@/services/supabase/itemService"
import { getCategoryColor } from "@/theme/categoryColors"
import { useAppTheme } from "@/theme/context"

interface ItemCardProps {
  item: ItemWithProfile
  onPress?: (item: ItemWithProfile) => void
  onItemUpdated?: (updatedItem: ItemWithProfile) => void
  onItemDeleted?: (itemId: string) => void
  deletable?: boolean // NEW
}

export const ItemCard = ({ item, onPress, onItemUpdated, onItemDeleted, deletable = false }: ItemCardProps) => {
  const { themed, themeContext } = useAppTheme()
  const imageUrls = item.image_urls ?? []
  const hasImage = imageUrls.length > 0
  const categoryColor = getCategoryColor(item.category, themeContext === "dark")

  // Debug logs
  console.log("[ItemCard] imageUrls:", imageUrls)
  if (hasImage) {
    console.log("[ItemCard] First image URL:", imageUrls[0])
  }

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false)

  const handlePress = () => {
    console.log("[ItemCard] Opening modal for item:", item.title)
    setModalVisible(true)
  }

  const handleLongPress = () => {
    if (!deletable) return // Only allow delete if deletable
    console.log("[ItemCard] Long press detected for item:", item.title)
    setDeleteAlertVisible(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      console.log("[ItemCard] Deleting item:", item.id)
      const { error } = await ItemService.deleteItem(item.id)

      if (error) {
        console.error("[ItemCard] Error deleting item:", error)
        // You might want to show an error toast here
        return
      }

      console.log("[ItemCard] Item deleted successfully:", item.id)
      onItemDeleted?.(item.id)
    } catch (error) {
      console.error("[ItemCard] Exception while deleting item:", error)
    } finally {
      setDeleteAlertVisible(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteAlertVisible(false)
  }

  return (
    <>
      <TouchableOpacity
        style={[
          themed($card),
          {
            borderColor: categoryColor,
            shadowColor: categoryColor,
          },
        ]}
        activeOpacity={0.85}
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessibilityRole={onPress ? "button" : undefined}
      >
        {/* Image section */}
        <View style={themed($imageContainer)}>
          {hasImage ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={themed($image)}
              resizeMode="cover"
              accessibilityLabel={item.title}
            />
          ) : (
            <View style={themed($imagePlaceholder)}>
              <Text style={themed($imagePlaceholderText)} text={item.title?.charAt(0) || "?"} />
            </View>
          )}
        </View>
        {/* Content section */}
        <View style={themed($content)}>
          <Text style={themed($title)} text={item.title} numberOfLines={0} />
          <View style={themed($metaRow)}>
            <Text
              style={themed($category)}
              text={item.category}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            <Text
              style={themed($userText)}
              text={item.full_name || item.email || "Unknown user"}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Item Modal */}
      <ItemModal
        item={item}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onItemUpdated={onItemUpdated}
      />

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmStyle="destructive"
      />
    </>
  )
}

// Styles
const $card = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.cardColor,
  borderRadius: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
  minHeight: 64, // slightly more compact
  maxHeight: 80, // slightly more compact
  paddingVertical: spacing.xxs, // less vertical padding
  paddingHorizontal: spacing.xs, // less horizontal padding
  marginBottom: spacing.sm,
})

const $imageContainer = ({ spacing }: any): ViewStyle => ({
  height: 48, // slightly smaller image
  width: 48,
  borderRadius: 12,
  marginRight: spacing.xs, // less space between image and content
  marginLeft: spacing.x, // add buffer from left edge
  backgroundColor: "#EEE",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
})

const $image = (): ImageStyle => ({
  width: "100%",
  height: "100%",
  borderRadius: 12,
  position: "absolute",
  top: 0,
  left: 0,
})

const $imagePlaceholder = ({ colors }: any): ViewStyle => ({
  width: "100%",
  height: "100%",
  borderRadius: 12,
  backgroundColor: colors.cardColor,
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.8,
})

const $imagePlaceholderText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 28,
  color: colors.textDim,
})

const $content = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  minWidth: 0,
  marginRight: spacing.md,
})

const $title = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: 2,
})

const $category = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
  textTransform: "capitalize",
})

const $metaRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 2,
})

const $userText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: colors.textDim,
  textAlign: "right",
  marginLeft: 8,
  flexShrink: 1,
  flexGrow: 0,
  maxWidth: "50%",
})
