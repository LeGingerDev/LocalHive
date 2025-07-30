import React, { useState } from "react"
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TextStyle,
} from "react-native"

import { ItemInput } from "@/components/ItemInput"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ItemInputDisplayProps {
  onAddItem: (text: string) => void
  onPicturePress?: () => void
  placeholder?: string
  disabled?: boolean
}

export const ItemInputDisplay: React.FC<ItemInputDisplayProps> = ({
  onAddItem,
  onPicturePress,
  placeholder = "Shopping Item Text",
  disabled = false,
}) => {
  const { themed } = useAppTheme()
  const [isInputVisible, setIsInputVisible] = useState(false)

  const handleAddNewItem = () => {
    setIsInputVisible(true)
  }

  const handleConfirm = (text: string) => {
    onAddItem(text)
    setIsInputVisible(false)
  }

  const handleCancel = () => {
    setIsInputVisible(false)
  }

  if (isInputVisible) {
    return (
      <View style={themed($container)}>
        <ItemInput
          onConfirm={handleConfirm}
          onPicturePress={onPicturePress}
          placeholder={placeholder}
          disabled={disabled}
        />
        <TouchableOpacity
          style={themed($cancelButton)}
          onPress={handleCancel}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={themed($cancelButtonText)} text="Cancel" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={themed($addButton)}
      onPress={handleAddNewItem}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={themed($addButtonText)} text="Add New Item" />
    </TouchableOpacity>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $addButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $addButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  fontWeight: "600",
})

const $cancelButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral300,
  borderRadius: 8,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
})

const $cancelButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 14,
}) 