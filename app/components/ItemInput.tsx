import React, { useState } from "react"
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TextInput,
  TextStyle,
  ImageStyle,
} from "react-native"

import { Icon } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ItemInputProps {
  onConfirm: (text: string) => void
  onPicturePress?: () => void
  placeholder?: string
  initialValue?: string
  disabled?: boolean
}

export const ItemInput: React.FC<ItemInputProps> = ({
  onConfirm,
  onPicturePress,
  placeholder = "Shopping Item Text",
  initialValue = "",
  disabled = false,
}) => {
  const { themed } = useAppTheme()
  const [text, setText] = useState(initialValue)

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm(text.trim())
      setText("")
    }
  }

  const handlePicturePress = () => {
    if (onPicturePress) {
      onPicturePress()
    }
  }

  return (
    <View style={themed($container)}>
      <TextInput
        style={themed($textInput)}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={themed($placeholderText).color}
        onSubmitEditing={handleConfirm}
        returnKeyType="done"
        editable={!disabled}
        multiline={false}
      />
      <View style={themed($buttonContainer)}>
        <TouchableOpacity
          style={themed($pictureButton)}
          onPress={handlePicturePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Icon
            icon="view"
            size={20}
            color={themed($pictureButtonIcon).color}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            themed($confirmButton),
            !text.trim() && themed($confirmButtonDisabled),
          ]}
          onPress={handleConfirm}
          disabled={disabled || !text.trim()}
          activeOpacity={0.7}
        >
          <Icon
            icon="check"
            size={20}
            color={themed($confirmButtonIcon).color}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 25,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $textInput: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  flex: 1,
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  paddingVertical: spacing.xs,
  paddingHorizontal: 0,
})

const $placeholderText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $pictureButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: "transparent",
  alignItems: "center",
  justifyContent: "center",
})

const $pictureButtonIcon: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.text,
})

const $confirmButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.tint,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $confirmButtonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  borderColor: colors.palette.neutral400,
})

const $confirmButtonIcon: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.background,
}) 