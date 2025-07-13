import { useState } from "react"
import {
  View,
  ScrollView,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

import { Button } from "@/components/Button"
import { CustomDropdown } from "@/components/CustomDropdown"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useGroups } from "@/hooks/useGroups"
import type { GroupCategory } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

export const CreateGroupScreen = ({ navigation }: any) => {
  const { themed, theme } = useAppTheme()
  const { createGroup } = useGroups()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "friends" as GroupCategory,
    is_public: true,
    member_limit: "",
  })

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      return
    }
    setLoading(true)
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        is_public: formData.is_public,
        member_limit: formData.member_limit ? parseInt(formData.member_limit) : undefined,
      }
      const result = await createGroup(groupData)
      if (result) {
        navigation.goBack()
      }
    } catch (e) {
      console.log("[CreateGroupScreen] Error in handleCreateGroup:", e)
    } finally {
      setLoading(false)
    }
  }

  const groupCategories = [
    "study",
    "sports",
    "hobby",
    "social",
    "family",
    "food",
    "places",
    "shopping",
    "transport",
    "household",
    "clothing",
    "medical",
    "local_customs",
    "language",
    "emergency",
    "work",
    "entertainment",
    "services",
    "restaurants",
    "landmarks",
    "cultural",
    "daily_life",
    "travel",
    "friends",
  ]

  if (loading) {
    return (
      <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top", "bottom"]}>
        <LoadingSpinner text="Creating group..." />
      </Screen>
    )
  }

  return (
    <Screen style={themed($root)} preset="scroll" safeAreaEdges={["top", "bottom"]}>
      <Header title="Create Group" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={themed($formContent)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={themed($label)} text="Group Name" />
          <TextField
            placeholder="Enter group name"
            value={formData.name}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
            autoCapitalize="words"
            autoFocus
          />
          <Text style={themed($label)} text="Description" />
          <TextField
            placeholder="Tell others what this group is about..."
            value={formData.description}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
            multiline
            numberOfLines={3}
          />
          <Text style={themed($label)} text="Category" />
          <CustomDropdown
            options={groupCategories.map((cat) => ({
              label: cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              value: cat,
            }))}
            value={formData.category}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value as GroupCategory }))
            }
            placeholder="Select category..."
            style={themed($pickerContainer)}
            testID="categoryDropdown"
          />
          <Text style={themed($label)} text="Privacy" />
          <View style={themed($privacyRow)}>
            {[
              { value: true, label: "Public" },
              { value: false, label: "Private" },
            ].map((opt) => (
              <View key={opt.label} style={themed($privacyOption)}>
                <Button
                  style={[
                    themed($privacyRadio),
                    formData.is_public === opt.value && themed($privacyRadioActive),
                  ]}
                  textStyle={[
                    themed($privacyRadioText),
                    formData.is_public === opt.value && themed($privacyRadioTextActive),
                  ]}
                  onPress={() => setFormData((prev) => ({ ...prev, is_public: opt.value }))}
                  text={opt.label}
                  preset="filled"
                />
              </View>
            ))}
          </View>
          <Text style={themed($privacyDesc)}>
            {formData.is_public
              ? "Anyone can find and join this group"
              : "Only invited members can join"}
          </Text>
          <Text style={themed($label)} text="Member Limit (Optional)" />
          <TextField
            placeholder="e.g. 50"
            value={formData.member_limit}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, member_limit: text }))}
            keyboardType="numeric"
            style={themed($input)}
            containerStyle={themed($inputContainerFlat)}
          />
          <View style={themed($buttonRow)}>
            <CustomGradient preset="primary" style={themed($gradientButton)}>
              <Button
                text="Create Group"
                textStyle={themed($gradientButtonTextWhite)}
                style={themed($gradientButtonInner)}
                onPress={handleCreateGroup}
                preset="reversed"
              />
            </CustomGradient>
            <Button
              text="Cancel"
              style={themed($cancelButtonRed)}
              textStyle={themed($cancelButtonTextRed)}
              onPress={() => navigation.goBack()}
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
  )
}

// Styles
const $root = ({ colors }: any): ViewStyle => ({ flex: 1, backgroundColor: colors.background })

const $label = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: colors.text,
  marginBottom: 4,
})

const $input = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: colors.text,
  paddingVertical: 10,
})

const $privacyRow = (): ViewStyle => ({ flexDirection: "row", gap: 12, marginBottom: 0 })
const $privacyOption = (): ViewStyle => ({ flex: 1, minWidth: 120 })
const $privacyRadio = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: 8,
  paddingHorizontal: 14,
  marginBottom: 2,
})
const $privacyRadioActive = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})
const $privacyRadioText = ({ colors, typography }: any): TextStyle => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 15,
})
const $privacyRadioTextActive = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 15,
})
const $privacyDesc = ({ colors }: any): TextStyle => ({
  color: colors.textDim,
  fontSize: 13,
  marginLeft: 2,
})
const $buttonRow = ({ spacing }: any): ViewStyle => ({ marginTop: spacing.lg, gap: 0 })
const $gradientButton = (): ViewStyle => ({ borderRadius: 16, overflow: "hidden", marginBottom: 8 })
const $gradientButtonInner = (): ViewStyle => ({
  backgroundColor: "transparent",
  borderRadius: 16,
  minHeight: 48,
})

const $inputContainerFlat = ({ spacing }: any): ViewStyle => ({
  marginBottom: spacing.sm,
  paddingHorizontal: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
})
const $headerRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.sm,
})
const $gradientButtonTextWhite = ({ typography }: any): TextStyle => ({
  color: "#fff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
})
const $backButtonPlain = ({ spacing }: any): ViewStyle => ({
  marginRight: spacing.sm,
  paddingHorizontal: 0,
  paddingVertical: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
})
const $headerTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  flex: 1,
  textAlign: "center",
})
const $headerSpacer = (): ViewStyle => ({ width: 40 })
const $formContent = ({ spacing }: any): ViewStyle => ({
  padding: spacing.lg,
  paddingBottom: spacing.xl * 2,
})

const $formContentWithTopMargin = ({ spacing }: any): ViewStyle => ({
  flexGrow: 1,
  justifyContent: "center",
  padding: spacing.lg,
  gap: 6,
  paddingBottom: spacing.xl * 2,
})
const $cancelButtonRed = ({ spacing, colors }: any): ViewStyle => ({
  backgroundColor: colors.error || "#d32f2f",
  borderRadius: 16,
  minHeight: 48,
  marginTop: spacing.xs,
})
const $cancelButtonTextRed = ({ typography, colors }: any): TextStyle => ({
  color: "#fff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
})
const $pickerContainer = ({ spacing, colors }: any): ViewStyle => ({
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.border || colors.textDim,
  borderRadius: 12,
  backgroundColor: colors.input || colors.cardColor,
  overflow: "hidden",
  height: 56,
  justifyContent: "center",
})
