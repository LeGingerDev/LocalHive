import { useState } from "react"
import { View, ViewStyle, TextStyle, Image, TouchableOpacity, ImageStyle } from "react-native"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { ItemModal } from "@/components/ItemModal"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { HapticService } from "@/services/hapticService"
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
  groupName?: string // NEW: Optional group name to display as a tag
}

export const ItemCard = ({
  item,
  onPress,
  onItemUpdated,
  onItemDeleted,
  deletable = false,
  groupName,
}: ItemCardProps) => {
  const { themed, themeContext } = useAppTheme()
  const { user } = useAuth()
  const imageUrls = item.image_urls ?? []
  const hasImage = imageUrls.length > 0
  const categoryColor = getCategoryColor(item.category, themeContext === "dark")
  
  // Check if current user is the owner of this item
  const isOwner = user?.id === item.user_id

  // Debug logs
  console.log("[ItemCard] imageUrls:", imageUrls)
  if (hasImage) {
    console.log("[ItemCard] First image URL:", imageUrls[0])
  }

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false)

  const handlePress = () => {
    HapticService.light()
    console.log("[ItemCard] Opening modal for item:", item.title)
    setModalVisible(true)
  }

  const handleLongPress = () => {
    if (!deletable) return // Only allow delete if deletable
    HapticService.medium()
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
      <View style={themed($cardContainer)}>
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
                style={[
                  themed($userText),
                  isOwner && themed($userTextOwner)
                ]}
                text={item.full_name || item.email || "Unknown user"}
                numberOfLines={1}
                ellipsizeMode="tail"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Group Name Tag */}
        {groupName && (
          <View style={themed($groupTagContainer)}>
            <View style={[themed($groupTagLine), { backgroundColor: categoryColor }]} />
            <View style={[themed($groupTag), { borderColor: categoryColor }]}>
              <Text style={themed($groupTagText)} text={groupName} />
            </View>
          </View>
        )}
      </View>

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
const $cardContainer = ({ spacing }: any): ViewStyle => ({
  position: "relative",
  marginBottom: spacing.sm,
})

const $card = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral200, // Darker background for better visibility
  borderRadius: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  shadowOffset: { width: 0, height: 6 }, // Increased height for more downward shadow
  shadowOpacity: 0.2, // Slightly increased opacity for more visible shadow
  shadowRadius: 10, // Increased radius for softer shadow
  elevation: 6, // Increased elevation for Android
  minHeight: 64, // slightly more compact
  maxHeight: 80, // slightly more compact
  paddingVertical: spacing.xxs, // less vertical padding
  paddingHorizontal: spacing.xs, // less horizontal padding
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
  backgroundColor: colors.palette.neutral300, // Slightly darker than card background
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

const $userTextOwner = ({ colors, themeContext }: any): TextStyle => ({
  color: themeContext === "dark" ? colors.palette.orange100 : colors.palette.orange500,
})

// Group Tag Styles
const $groupTagContainer = (): ViewStyle => ({
  position: "absolute",
  top: -8,
  right: 8,
  zIndex: 1,
})

const $groupTagLine = ({ colors, spacing }: any): ViewStyle => ({
  position: "absolute",
  top: 8,
  left: -4,
  width: 4,
  height: 1,
  backgroundColor: colors.border,
})

const $groupTag = ({ colors, spacing }: any): ViewStyle => ({
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

const $groupTagText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 10,
  color: colors.textDim,
  textAlign: "center",
})
