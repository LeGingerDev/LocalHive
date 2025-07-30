import { FC } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native"

import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ListActionsModalProps {
  visible: boolean
  listName: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  isDeleting?: boolean
}

export const ListActionsModal: FC<ListActionsModalProps> = ({
  visible,
  listName,
  onClose,
  onEdit,
  onDelete,
  onShare,
  isDeleting = false,
}) => {
  const { themed } = useAppTheme()

  const handleActionPress = (action: () => void) => {
    onClose()
    action()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={themed($overlay)}>
          <TouchableWithoutFeedback>
            <View style={themed($modalContainer)}>
              {/* Header */}
              <View style={themed($header)}>
                <Text style={themed($headerTitle)} text={listName} />
                <TouchableOpacity style={themed($closeButton)} onPress={onClose}>
                  <Icon icon="x" size={24} color={themed($closeButtonText).color} />
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={themed($actionsContainer)}>
                <TouchableOpacity
                  style={themed($actionButton)}
                  onPress={() => handleActionPress(onEdit)}
                >
                  <Text style={themed($actionIcon)} text="✏️" />
                  <Text style={themed($actionText)} text="Edit List" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={themed($actionButton)}
                  onPress={() => handleActionPress(onShare)}
                >
                  <Text style={themed($actionIcon)} text="📤" />
                  <Text style={themed($actionText)} text="Share List" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={themed($actionButton)}
                  onPress={() => handleActionPress(onDelete)}
                  disabled={isDeleting}
                >
                  <Text style={themed($deleteIcon)} text="🗑️" />
                  <Text
                    style={themed($deleteText)}
                    text={isDeleting ? "Deleting..." : "Delete List"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: spacing.lg,
  maxHeight: "80%",
})

const $header: ThemedStyle<ViewStyle> = ({ spacing: _spacing, colors: _colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: _spacing.lg,
  paddingVertical: _spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0, 0, 0, 0.1)",
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 18,
  fontWeight: "600",
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $closeButtonText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $actionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  borderRadius: 8,
})

const $actionIcon: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 20,
  marginRight: spacing.md,
})

const $actionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 16,
})

const $deleteIcon: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 20,
  marginRight: spacing.md,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 16,
})
