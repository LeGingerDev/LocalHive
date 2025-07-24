import React, { useState, useMemo } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"

import { CategoryButton } from "@/components/CategoryButton"
import { CategoryItemsModal } from "@/components/CategoryItemsModal"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface CategoriesSectionProps {
  items: ItemWithProfile[]
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onItemUpdated?: (updatedItem: ItemWithProfile) => void
  onItemDeleted?: (itemId: string) => void
  onAddItem?: () => void
  groupId?: string
}

export const CategoriesSection = ({
  items,
  collapsed = false,
  onToggleCollapsed,
  onItemUpdated,
  onItemDeleted,
  onAddItem,
  groupId,
}: CategoriesSectionProps) => {
  const { themed } = useAppTheme()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<ItemWithProfile[]>([])

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, ItemWithProfile[]> = {}

    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })

    return grouped
  }, [items])

  // Get categories that have items
  const categoriesWithItems = useMemo(() => {
    return Object.keys(itemsByCategory).filter((category) => itemsByCategory[category].length > 0)
  }, [itemsByCategory])

  const handleCategoryPress = (category: string, categoryItems: ItemWithProfile[]) => {
    setSelectedCategory(category)
    setSelectedItems(categoryItems)
  }

  const handleCloseModal = () => {
    setSelectedCategory(null)
    setSelectedItems([])
  }

  const handleItemUpdated = (updatedItem: ItemWithProfile) => {
    onItemUpdated?.(updatedItem)
  }

  const handleItemDeleted = (itemId: string) => {
    onItemDeleted?.(itemId)
  }

  // Don't render if no items
  if (items.length === 0) {
    return (
      <View style={themed($section)}>
        <View style={themed($sectionHeader)}>
          <View style={themed($sectionHeaderContent)}>
            <View style={themed($sectionHeaderLeft)}>
              <Text style={themed($sectionHeaderTitle)} text="Categories (0)" />
            </View>
          </View>
        </View>
        <View style={themed($emptyContainer)}>
          <Text style={themed($emptyText)} text="No items yet" />
          <Text style={themed($emptySubtext)} text="Add items to see them organized by category" />
        </View>
      </View>
    )
  }

  return (
    <View style={themed($section)}>
      {/* Section Header */}
      <View style={themed($sectionHeader)}>
        <View style={themed($sectionHeaderContent)}>
          <TouchableOpacity
            style={themed($sectionHeaderLeft)}
            onPress={onToggleCollapsed}
            activeOpacity={0.7}
          >
            <Text
              style={themed($sectionHeaderTitle)}
              text={`Categories (${categoriesWithItems.length})`}
            />
          </TouchableOpacity>
          <View style={themed($sectionHeaderRight)}>
            {collapsed && (
              <Text
                style={themed($collapsedSectionSummary)}
                text={`${items.length} items in ${categoriesWithItems.length} categories`}
              />
            )}
            {!collapsed && onAddItem && (
              <TouchableOpacity
                style={themed($addItemButtonSmall)}
                onPress={onAddItem}
                activeOpacity={0.8}
              >
                <Text style={themed($addItemButtonSmallText)} text="Add" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={themed($caretButton)}
              onPress={onToggleCollapsed}
              activeOpacity={0.7}
            >
              <Icon
                icon={collapsed ? "caretRight" : "caretLeft"}
                size={20}
                color={themed($caretButtonColor).color}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Categories Grid */}
      {!collapsed && (
        <View style={themed($categoriesGrid)}>
          {categoriesWithItems.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              items={itemsByCategory[category]}
              onPress={handleCategoryPress}
            />
          ))}
        </View>
      )}

      {/* Category Items Modal */}
      <CategoryItemsModal
        visible={selectedCategory !== null}
        category={selectedCategory || ""}
        items={selectedItems}
        onClose={handleCloseModal}
        onItemUpdated={handleItemUpdated}
        onItemDeleted={handleItemDeleted}
      />
    </View>
  )
}

const $section = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.md,
})

const $sectionHeader = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.sm,
  backgroundColor: colors.primary100,
  borderRadius: 8,
  marginBottom: spacing.xs,
})

const $sectionHeaderContent = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
})

const $sectionHeaderLeft = (): ViewStyle => ({
  flex: 1,
})

const $sectionHeaderRight = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
})

const $sectionHeaderTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
})

const $sectionHeaderSubtitle = ({ typography, colors }: any): TextStyle => ({
  ...typography.bodySmall,
  color: colors.textDim,
  marginTop: 2,
})

const $addItemButtonSmall = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderRadius: 6,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $addItemButtonSmallText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})

const $collapsedSectionSummary = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
})

const $caretButton = (): ViewStyle => ({
  padding: 4,
})

const $caretButtonColor = ({ colors }: any): { color: string } => ({
  color: colors.text,
})

const $categoriesGrid = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  justifyContent: "space-between",
})

const $emptyContainer = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.lg,
  alignItems: "center",
})

const $emptyText = ({ typography, colors }: any): TextStyle => ({
  ...typography.bodyMedium,
  color: colors.textDim,
  textAlign: "center",
})

const $emptySubtext = ({ typography, colors }: any): TextStyle => ({
  ...typography.bodySmall,
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.xs,
  opacity: 0.8,
})
