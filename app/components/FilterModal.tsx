import React, { FC, useState, useEffect, useMemo } from "react"
import {
  View,
  Modal,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ScrollView,
} from "react-native"

import { Header } from "@/components/Header"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (selectedCategories: string[]) => void
  currentCategories?: string[]
  items?: Array<{ category: string }> // Add items prop
}

interface CategoryOption {
  value: string
  label: string
}

export const FilterModal: FC<FilterModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentCategories = [],
  items = [],
}) => {
  const { themed } = useAppTheme()
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories)

  // Update selected categories when currentCategories prop changes
  useEffect(() => {
    setSelectedCategories(currentCategories)
  }, [currentCategories])

  // Dynamically generate categories from items
  const categories = useMemo(() => {
    if (!items || items.length === 0) return []

    // Get unique categories from items
    const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))]
    
    // Convert to CategoryOption format and sort alphabetically
    return uniqueCategories
      .map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1)
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [items])

  const handleConfirm = () => {
    onConfirm(selectedCategories)
    onClose()
  }

  const handleClearFilter = () => {
    setSelectedCategories([])
  }

  const handleToggleCategory = (categoryValue: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryValue)) {
        return prev.filter(cat => cat !== categoryValue)
      } else {
        return [...prev, categoryValue]
      }
    })
  }

  const renderCategoryOption = (category: CategoryOption) => {
    const isSelected = selectedCategories.includes(category.value)

    return (
      <TouchableOpacity
        key={category.value}
        style={themed([
          $categoryOption,
          isSelected && $categoryOptionSelected,
        ])}
        onPress={() => handleToggleCategory(category.value)}
        activeOpacity={0.7}
      >
        <Text
          style={themed([
            $categoryText,
            isSelected && $categoryTextSelected,
          ])}
        >
          {category.label}
        </Text>
        {isSelected && (
          <View style={themed($checkmark)}>
            <Text style={themed($checkmarkText)}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={themed($root)}>
        <Header
          title="Filter by Category"
          showBackButton
          onBackPress={onClose}
        />

        <View style={themed($content)}>
          <Text style={themed($description)}>
            Select a category to filter your items
          </Text>

          <ScrollView
            style={themed($scrollView)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={themed($scrollContent)}
          >
            {categories.length > 0 ? (
              categories.map(renderCategoryOption)
            ) : (
              <View style={themed($emptyState)}>
                <Text style={themed($emptyStateText)}>
                  No categories available
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={themed($buttonContainer)}>
            <TouchableOpacity
              style={themed($clearButton)}
              onPress={handleClearFilter}
              activeOpacity={0.7}
            >
              <Text style={themed($clearButtonText)}>Clear Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={themed($confirmButton)}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={themed($confirmButtonText)}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Styles
const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
})

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  textAlign: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $categoryOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: colors.cardColor,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.xs,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $categoryOptionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})

const $categoryText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
})

const $categoryTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
})

const $checkmark: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  width: 24,
  height: 24,
  alignItems: "center",
  justifyContent: "center",
})

const $checkmarkText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.tint,
  fontFamily: typography.primary.bold,
  fontSize: 14,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.md,
  borderTopWidth: 1,
  borderTopColor: "rgba(0, 0, 0, 0.1)",
})

const $clearButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral200,
  paddingVertical: spacing.md,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
})

const $clearButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
})

const $confirmButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.tint,
  paddingVertical: spacing.md,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
})

const $confirmButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 16,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $emptyStateText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  textAlign: "center",
}) 