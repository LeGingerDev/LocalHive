import { useState, useEffect } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native"

import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Icon } from "@/components/Icon"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Group } from "@/services/api/types"
import { GroupService } from "@/services/supabase/groupService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface EditGroupModalProps {
  visible: boolean
  group: Group | null
  onClose: () => void
  onSuccess: (updatedGroup: Group) => void
}

export const EditGroupModal = ({ visible, group, onClose, onSuccess }: EditGroupModalProps) => {
  const { themed, theme } = useAppTheme()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "friends" as any,
    member_limit: "",
  })

  // Initialize form data when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
        category: group.category || "friends",
        member_limit: group.member_limit ? group.member_limit.toString() : "",
      })
    }
  }, [group])

  // Helper function to check if form is valid
  const isFormValid = (): boolean => {
    return !!formData.name.trim()
  }

  const handleSaveGroup = async () => {
    if (!formData.name.trim() || !group) {
      return
    }
    setLoading(true)
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        member_limit: formData.member_limit ? parseInt(formData.member_limit) : undefined,
      }

      const { data: updatedGroup, error } = await GroupService.updateGroup(group.id, updateData)

      if (error) {
        console.error("Error updating group:", error)
        // You might want to show an error alert here
        return
      }

      if (updatedGroup) {
        onSuccess(updatedGroup)
        onClose()
      }
    } catch (e) {
      console.error("Error in handleSaveGroup:", e)
    } finally {
      setLoading(false)
    }
  }

  // Dynamic gradient button style with opacity
  const getGradientButtonStyle = (): ViewStyle => {
    return {
      ...themed($gradientButton),
      opacity: isFormValid() ? 1 : 0.5,
    }
  }

  const groupCategories = [
    { value: "friends", label: "Friends" },
    { value: "family", label: "Family" },
    { value: "work", label: "Work" },
    { value: "study", label: "Study" },
    { value: "hobby", label: "Hobby" },
    { value: "other", label: "Other" },
  ]

  if (!group) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={themed($root)}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={themed($header)}>
          <TouchableOpacity style={themed($closeButton)} onPress={onClose} activeOpacity={0.7}>
            <Icon icon="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={themed($headerTitle)} text="Edit Group" />
          <View style={themed($headerSpacer)} />
        </View>

        {/* Content */}
        <View style={themed($formContent)}>
          <Text style={themed($label)} text="Group Name" />
          <TextField
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter group name"
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
          />

          <Text style={themed($label)} text="Description (Optional)" />
          <TextField
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter group description"
            multiline
            numberOfLines={3}
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
          />

          <Text style={themed($label)} text="Category" />
          <CustomDropdown
            options={groupCategories}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            placeholder="Select category"
            style={themed($pickerContainer)}
          />

          <Text style={themed($label)} text="Member Limit (Optional)" />
          <TextField
            value={formData.member_limit}
            onChangeText={(text) => setFormData({ ...formData, member_limit: text })}
            placeholder="Enter member limit"
            keyboardType="numeric"
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
          />
        </View>

        {/* Buttons */}
        <View style={themed($buttonRow)}>
          <CustomGradient preset="primary" style={getGradientButtonStyle()}>
            <TouchableOpacity
              style={themed($gradientButtonInner)}
              onPress={handleSaveGroup}
              disabled={!isFormValid() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Text style={themed($gradientButtonTextWhite)} text="Save Changes" />
              )}
            </TouchableOpacity>
          </CustomGradient>

          <TouchableOpacity style={themed($cancelButtonRed)} onPress={onClose} activeOpacity={0.8}>
            <Text style={themed($cancelButtonTextRed)} text="Cancel" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const $root = ({ colors }: any): ViewStyle => ({ flex: 1, backgroundColor: colors.background })

const $header = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
})

const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  ...typography.heading,
  color: colors.text,
  textAlign: "center",
})

const $headerSpacer = (): ViewStyle => ({ width: 40 })

const $formContent = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
})

const $label = ({ typography, colors }: any): TextStyle => ({
  ...typography.formLabel,
  color: colors.text,
  marginBottom: spacing.xs,
})

const $input = ({ typography, colors }: any): TextStyle => ({
  ...typography.formInput,
  color: colors.text,
})

const $inputContainerFlat = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.lg,
  backgroundColor: "transparent",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
})

const $pickerContainer = ({ spacing, colors }: any): ViewStyle => ({
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
  borderRadius: 8,
  backgroundColor: colors.background,
})

const $buttonRow = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
  gap: spacing.sm,
})

const $gradientButton = (): ViewStyle => ({
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 8,
})

const $gradientButtonInner = (): ViewStyle => ({
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
})

const $gradientButtonTextWhite = ({ typography }: any): TextStyle => ({
  ...typography.button,
  color: "#FFFFFF",
  fontWeight: "600",
})

const $cancelButtonRed = ({ spacing, colors }: any): ViewStyle => ({
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: colors.error,
  borderRadius: 16,
})

const $cancelButtonTextRed = ({ typography, colors }: any): TextStyle => ({
  ...typography.button,
  color: colors.error,
  fontWeight: "600",
})
