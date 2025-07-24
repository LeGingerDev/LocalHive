import React, { useState, useCallback, useRef, useEffect } from "react"
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { AuthService } from "@/services/supabase/authService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface EditableProfileNameProps {
  initialName: string
  onNameChange?: (newName: string) => void
  style?: any
  showEditButton?: boolean
  onEditPress?: () => void
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export const EditableProfileName: React.FC<EditableProfileNameProps> = ({
  initialName,
  onNameChange,
  style,
  showEditButton = true,
  onEditPress,
  isEditing: externalIsEditing,
  onEditingChange,
}) => {
  const { themed } = useAppTheme()
  const { userProfile, refreshUser } = useAuth()
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<TextInput>(null)

  // Use external editing state if provided, otherwise use internal
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing
  const setIsEditing = (editing: boolean) => {
    if (onEditingChange) {
      onEditingChange(editing)
    } else {
      setInternalIsEditing(editing)
    }
  }

  // Get the current name from userProfile or fall back to initialName
  const currentName = userProfile?.full_name || initialName

  // Update name when initialName prop changes or when userProfile changes
  useEffect(() => {
    if (!isEditing) {
      setName(currentName)
    }
  }, [currentName, isEditing])

  const handleEditPress = useCallback(() => {
    if (onEditPress) {
      onEditPress()
    } else {
      setIsEditing(true)
      // Focus the input after a short delay to ensure the component is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [onEditPress])

  const handleSave = useCallback(async () => {
    if (!userProfile?.id) {
      Alert.alert("Error", "Unable to update profile. Please try again.")
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      Alert.alert("Error", "Name cannot be empty.")
      return
    }

    if (trimmedName === currentName) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await AuthService.createOrUpdateProfile(
        userProfile.id,
        {
          full_name: trimmedName,
        },
        false, // Don't preserve existing name when user explicitly updates it
      )

      if (error) {
        throw error
      }

      if (data) {
        // Update the auth context
        await refreshUser()
        // Call the callback if provided
        onNameChange?.(trimmedName)
        setIsEditing(false)
        Keyboard.dismiss()
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile name:", error)
      Alert.alert("Error", "Failed to update profile name. Please try again.")
      // Reset to original name on error
      setName(currentName)
    } finally {
      setIsLoading(false)
    }
  }, [name, currentName, userProfile?.id, refreshUser, onNameChange])

  const handleCancel = useCallback(() => {
    setName(currentName)
    setIsEditing(false)
    Keyboard.dismiss()
  }, [currentName])

  const handleSubmitEditing = useCallback(() => {
    handleSave()
  }, [handleSave])

  if (isEditing) {
    return (
      <View style={[styles.editingContainer, style]}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, themed($textInput)]}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Enter your name"
          placeholderTextColor={themed($placeholderText).color}
          maxLength={50}
          autoFocus
          returnKeyType="done"
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={themed($activityIndicator).color}
            style={styles.loadingIndicator}
          />
        )}
        <TouchableOpacity
          style={[styles.saveButton, themed($saveButton)]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Ionicons name="checkmark" size={16} color={themed($saveButtonIcon).color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, themed($cancelButton)]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Ionicons name="close" size={16} color={themed($cancelButtonIcon).color} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.displayContainer, style]}>
      <Text style={[styles.displayName, themed($displayName)]} text={name} />
      {showEditButton && (
        <TouchableOpacity
          style={[styles.editButton, themed($editButton)]}
          onPress={handleEditPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={14} color={themed($editButtonIcon).color} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cancelButton: {
    borderRadius: 16,
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  displayContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  displayName: {
    textAlign: "center",
  },
  editButton: {
    padding: spacing.xs,
    position: "absolute",
    right: -spacing.xs,
    top: -spacing.xs,
    zIndex: 1,
  },
  editingContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingIndicator: {
    marginLeft: spacing.xs,
  },
  saveButton: {
    borderRadius: 16,
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  textInput: {
    borderRadius: 8,
    maxWidth: 200,
    minWidth: 120,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center",
  },
})

const $displayName = ({ colors, typography }: any) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
})

const $editButton = ({ colors }: any) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  opacity: 0.8,
})

const $editButtonIcon = ({ colors }: any) => ({
  color: colors.textDim,
})

const $textInput = ({ colors, typography }: any) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.palette.primary300,
})

const $placeholderText = ({ colors }: any) => ({
  color: colors.textDim,
})

const $saveButton = ({ colors }: any) => ({
  backgroundColor: colors.palette.primary500,
})

const $saveButtonIcon = ({ colors }: any) => ({
  color: colors.palette.neutral100,
})

const $cancelButton = ({ colors }: any) => ({
  backgroundColor: colors.palette.neutral300,
})

const $cancelButtonIcon = ({ colors }: any) => ({
  color: colors.palette.neutral700,
})

const $activityIndicator = ({ colors }: any) => ({
  color: colors.tint,
})
