import { useState } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Image,
  TouchableOpacity,
  ImageStyle,
  Modal,
  Pressable,
} from "react-native"

import { Text } from "@/components/Text"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { getCategoryColor } from "@/theme/categoryColors"
import { useAppTheme } from "@/theme/context"

interface ItemCardProps {
  item: ItemWithProfile
  onPress?: (item: ItemWithProfile) => void
}

export const ItemCard = ({ item, onPress }: ItemCardProps) => {
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

  const handlePress = () => {
    setModalVisible(true)
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
              text={item.full_name || item.email || "Unknown"}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </View>
      </TouchableOpacity>
      {/* Modal for item details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setModalVisible(false)}>
          <View style={themed($modalContainer)}>
            <Pressable onPress={() => {}} style={themed($modalContent)}>
              {/* Header with close button */}
              <View style={themed($modalHeader)}>
                <Text style={themed($modalTitle)} text="Item Details" />
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={themed($closeButton)}
                >
                  <Text style={themed($closeButtonText)} text="✕" />
                </TouchableOpacity>
              </View>

              {/* Image section */}
              {hasImage && (
                <View style={themed($modalImageContainer)}>
                  <Image
                    source={{ uri: imageUrls[0] }}
                    style={themed($modalImage)}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Content section */}
              <View style={themed($modalDetailsContainer)}>
                {/* Title */}
                <View style={themed($detailRow)}>
                  <Text style={themed($detailLabel)} text="Title" />
                  <Text style={themed($detailValue)} text={item.title} />
                </View>

                {/* Category */}
                <View style={themed($detailRow)}>
                  <Text style={themed($detailLabel)} text="Category" />
                  <View style={[themed($categoryBadge), { backgroundColor: categoryColor }]}>
                    <Text style={themed($categoryBadgeText)} text={item.category} />
                  </View>
                </View>

                {/* Location */}
                {item.location && (
                  <View style={themed($detailRow)}>
                    <Text style={themed($detailLabel)} text="Location" />
                    <Text style={themed($detailValue)} text={item.location} />
                  </View>
                )}

                {/* Notes/Details */}
                {item.details && (
                  <View style={themed($detailRow)}>
                    <Text style={themed($detailLabel)} text="Notes" />
                    <Text style={themed($detailValue)} text={item.details} />
                  </View>
                )}

                {/* Added by */}
                <View style={themed($detailRow)}>
                  <Text style={themed($detailLabel)} text="Added by" />
                  <Text
                    style={themed($detailValue)}
                    text={item.full_name || item.email || "Unknown"}
                  />
                </View>

                {/* Date */}
                <View style={themed($detailRow)}>
                  <Text style={themed($detailLabel)} text="Added on" />
                  <Text
                    style={themed($detailValue)}
                    text={new Date(item.created_at).toLocaleDateString()}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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

const $metaRow = ({ spacing }: any): ViewStyle => ({
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

// Modal styles
const $modalOverlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.7)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContainer = ({ spacing }: any): ViewStyle => ({
  maxWidth: "90%",
  maxHeight: "85%",
  width: "100%",
})

const $modalContent = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: spacing.lg,
  overflow: "hidden",
  maxHeight: "100%",
})

const $modalHeader = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $modalTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
  borderRadius: spacing.xs,
})

const $closeButtonText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.textDim,
})

const $modalImageContainer = ({ spacing }: any): ViewStyle => ({
  height: 300,
  width: 300,
  alignSelf: "center",
  margin: spacing.sm,
  borderRadius: spacing.md,
  overflow: "hidden",
})

const $modalImage = (): ImageStyle => ({
  width: "100%",
  height: "100%",
  borderRadius: 12,
})

const $modalDetailsContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.sm,
})

const $detailRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.xs,
  paddingVertical: spacing.xxs,
})

const $detailLabel = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.textDim,
  flex: 1,
})

const $detailValue = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.text,
  flex: 2,
  textAlign: "right",
})

const $categoryBadge = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
})

const $categoryBadgeText = ({ typography }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: "#fff",
  textTransform: "capitalize",
})
