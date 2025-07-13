import React, { useState, useCallback } from "react"
import { View, ViewStyle, TextStyle, Alert } from "react-native"

import { Button } from "@/components/Button"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useInvitations } from "@/hooks/useInvitations"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface InvitationFormProps {
  groupId: string
  groupName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export const InvitationForm = ({
  groupId,
  groupName,
  onSuccess,
  onCancel,
}: InvitationFormProps) => {
  const { themed } = useAppTheme()
  const { inviteByCode, loading, error } = useInvitations()
  const [personalCode, setPersonalCode] = useState("VISU-")

  // Invite by code
  const handleSendInvitation = useCallback(async () => {
    if (!personalCode.trim()) {
      Alert.alert("Missing Code", "Please enter a personal invitation code.")
      return
    }
    const result = await inviteByCode(groupId, personalCode.trim())
    if (result) {
      Alert.alert("Success", "Invitation sent successfully!")
      setPersonalCode("")
      onSuccess?.()
    } else {
      Alert.alert("Error", error || "Failed to send invitation. Please try again.")
    }
  }, [personalCode, groupId, inviteByCode, onSuccess, error])

  return (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={["top", "bottom"]}>
      <View style={themed($header)}>
        <Text style={themed($title)} text="Send Invitation" />
        <Text
          style={themed($subtitle)}
          text={`Invite someone to join "${groupName}" by their invitation code.`}
        />
      </View>
      {error && (
        <View style={themed($errorContainer)}>
          <Text style={themed($errorText)} text={error} />
        </View>
      )}
      <View style={themed($section)}>
        <Text style={themed($sectionTitle)} text="Personal Invitation Code" />
        <TextField
          label="Personal Code"
          placeholder="Enter user's invitation code"
          value={personalCode}
          onChangeText={setPersonalCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={9}
          style={[themed($input), { lineHeight: 1, height: 40 }]}
          textAlignVertical="center"
        />
        {loading ? (
          <View style={themed($loadingContainer)}>
            <LoadingSpinner text="Sending invitation..." />
          </View>
        ) : (
          <Button
            text="Send Invitation"
            onPress={handleSendInvitation}
            disabled={!personalCode.trim()}
            style={themed($sendButton)}
          />
        )}
      </View>
      <View style={themed($footer)}>
        <Button
          text="Cancel"
          onPress={onCancel}
          style={themed($cancelButton)}
          textStyle={themed($cancelButtonText)}
        />
      </View>
    </Screen>
  )
}

// Styles
const $root = (): ViewStyle => ({ flex: 1, padding: spacing.md })
const $header = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.lg })
const $title = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: colors.text,
  marginBottom: spacing.xs,
})
const $subtitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
})
const $errorContainer = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.errorBackground,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.md,
})
const $errorText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
})
const $section = ({ spacing }: any): ViewStyle => ({ marginBottom: spacing.lg })
const $sectionTitle = ({ typography, colors, spacing }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.xs,
})
const $input = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.md,
  height: 48,
})
const $sendButton = ({ spacing }: any): ViewStyle => ({ marginTop: spacing.md })
const $loadingContainer = ({ spacing }: any): ViewStyle => ({
  paddingVertical: spacing.xl,
  alignItems: "center",
})
const $footer = ({ spacing }: any): ViewStyle => ({
  marginTop: spacing.lg,
  paddingTop: spacing.md,
  borderTopWidth: 1,
  borderTopColor: "rgba(0,0,0,0.1)",
})
const $cancelButton = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.palette.neutral300,
})
const $cancelButtonText = ({ colors }: any): TextStyle => ({ color: colors.text })
