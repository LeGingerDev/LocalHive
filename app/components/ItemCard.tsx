import React from "react"
import { View, ViewStyle, TextStyle, Image, TouchableOpacity, ImageStyle } from "react-native"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"

interface ItemCardProps {
  item: ItemWithProfile
  onPress?: (item: ItemWithProfile) => void
}

export const ItemCard = ({ item, onPress }: ItemCardProps) => {
  const { themed, theme } = useAppTheme()
  const imageUrls = item.image_urls ?? [];
  const hasImage = imageUrls.length > 0;

  return (
    <TouchableOpacity
      style={themed($card)}
      activeOpacity={0.85}
      onPress={onPress ? () => onPress(item) : undefined}
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
          <Text style={themed($category)} text={item.category} numberOfLines={1} ellipsizeMode="tail" />
          <Text
            style={themed($userText)}
            text={item.full_name || item.email || "Unknown"}
            numberOfLines={1}
            ellipsizeMode="tail"
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}

// Styles
const $card = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
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
})

const $imagePlaceholder = ({ colors }: any): ViewStyle => ({
  width: "100%",
  height: "100%",
  borderRadius: 12,
  backgroundColor: colors.cardColor,
  alignItems: "center",
  justifyContent: "center",
  
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
  maxWidth: '50%',
}) 