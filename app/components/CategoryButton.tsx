import React from "react"
import { View, ViewStyle, TouchableOpacity, Image, ImageStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { getCategoryColor } from "@/theme/categoryColors"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface CategoryButtonProps {
  category: string
  items: ItemWithProfile[]
  onPress: (category: string, items: ItemWithProfile[]) => void
}

export const CategoryButton = ({ category, items, onPress }: CategoryButtonProps) => {
  const { themed, themeContext } = useAppTheme()

  // Don't render if no items
  if (items.length === 0) return null

  const categoryColor = getCategoryColor(category, themeContext === "dark")
  const firstItem = items[0]
  const hasImage = firstItem.image_urls && firstItem.image_urls.length > 0

  // Get category display name
  const getCategoryDisplayName = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  const handlePress = () => {
    onPress(category, items)
  }

  return (
    <TouchableOpacity
      style={[
        themed($container),
        {
          borderColor: categoryColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Background Image Section */}
      <View style={themed($imageSection)}>
        {hasImage ? (
          <Image
            source={{ uri: firstItem.image_urls![0] }}
            style={themed($backgroundImage)}
            resizeMode="cover"
          />
        ) : (
          <View style={themed($placeholderContainer)}>
            <Text style={themed($placeholderText)} text="No Image" />
          </View>
        )}
      </View>

      {/* Category Info Section */}
      <View
        style={[
          themed($infoSection),
          {
            backgroundColor: categoryColor,
          },
        ]}
      >
        <Text style={themed($categoryText)} text={getCategoryDisplayName(category)} />
        <Text style={themed($itemCountText)} text={`${items.length} items`} />
      </View>
    </TouchableOpacity>
  )
}

const $container = ({ spacing }: any): ViewStyle => ({
  borderRadius: 12,
  borderWidth: 2,
  overflow: "hidden",
  backgroundColor: "#FFFFFF",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  width: "48%", // For 2-column layout with gap
  aspectRatio: 1, // Make it square
})

const $imageSection = (): ViewStyle => ({
  flex: 1,
  minHeight: 120,
})

const $backgroundImage = (): ImageStyle => ({
  width: "100%",
  height: "100%",
})

const $placeholderContainer = ({ colors }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.border,
})

const $placeholderText = ({ colors, typography }: any): TextStyle => ({
  ...typography.bodySmall,
  color: colors.textDim,
})

const $infoSection = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xs,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $categoryText = ({ typography }: any): TextStyle => ({
  ...typography.bodyMedium,
  color: "#FFFFFF",
  fontWeight: "600",
})

const $itemCountText = ({ typography }: any): TextStyle => ({
  ...typography.bodySmall,
  color: "#FFFFFF",
  opacity: 0.9,
})
