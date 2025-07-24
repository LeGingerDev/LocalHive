import React from "react"
import { View, ViewStyle, Modal, TouchableOpacity, ScrollView, TextStyle } from "react-native"

import { Icon } from "@/components/Icon"
import { ItemCard } from "@/components/ItemCard"
import { Text } from "@/components/Text"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { getCategoryColor } from "@/theme/categoryColors"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface CategoryItemsModalProps {
  visible: boolean
  category: string
  items: ItemWithProfile[]
  onClose: () => void
  onItemUpdated?: (updatedItem: ItemWithProfile) => void
  onItemDeleted?: (itemId: string) => void
}

export const CategoryItemsModal = ({
  visible,
  category,
  items,
  onClose,
  onItemUpdated,
  onItemDeleted,
}: CategoryItemsModalProps) => {
  const { themed, themeContext } = useAppTheme()

  const categoryColor = getCategoryColor(category, themeContext === "dark")

  // Get category display name
  const getCategoryDisplayName = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={themed($modalOverlay)}>
        <View style={themed($modalContainer)}>
          {/* Header */}
          <View
            style={[
              themed($header),
              {
                backgroundColor: categoryColor,
              },
            ]}
          >
            <View style={themed($headerContent)}>
              <Text style={themed($headerTitle)} text={getCategoryDisplayName(category)} />
              <Text style={themed($headerSubtitle)} text={`${items.length} items`} />
            </View>
            <TouchableOpacity style={themed($closeButton)} onPress={onClose} activeOpacity={0.7}>
              <Icon icon="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={themed($content)}
            contentContainerStyle={themed($contentContainer)}
            showsVerticalScrollIndicator={false}
          >
            {items.length > 0 ? (
              <View style={themed($itemsGrid)}>
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onItemUpdated={onItemUpdated}
                    onItemDeleted={onItemDeleted}
                    deletable={true}
                  />
                ))}
              </View>
            ) : (
              <View style={themed($emptyContainer)}>
                <Text style={themed($emptyText)} text="No items in this category" />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const $modalOverlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContainer = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: "90%",
  minHeight: "50%",
})

const $header = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
})

const $headerContent = (): ViewStyle => ({
  flex: 1,
})

const $headerTitle = ({ typography }: any): TextStyle => ({
  ...typography.headingMedium,
  color: "#FFFFFF",
  fontWeight: "600",
})

const $headerSubtitle = ({ typography }: any): TextStyle => ({
  ...typography.bodySmall,
  color: "#FFFFFF",
  opacity: 0.9,
  marginTop: 2,
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
})

const $content = (): ViewStyle => ({
  flex: 1,
})

const $contentContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.md,
})

const $itemsGrid = (): ViewStyle => ({
  gap: spacing.sm,
})

const $emptyContainer = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $emptyText = ({ colors, typography }: any): TextStyle => ({
  ...typography.bodyMedium,
  color: colors.textDim,
  textAlign: "center",
})
