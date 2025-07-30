import React, { FC, useState } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, TextInput, ScrollView } from "react-native"

import { useAlert } from "@/components/Alert"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useItemLists } from "@/hooks/useItemLists"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface CreateListScreenProps {
  navigation: any
}

export const CreateListScreen: FC<CreateListScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { createList } = useItemLists()
  const { showAlert } = useAlert()
  const [listName, setListName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Get today's date in DD/MM/YYYY format
  const today = new Date()
  const todayFormatted = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const suggestions = ["Shopping", "Groceries", todayFormatted, "Weekend"]

  const handleCreateList = async () => {
    if (!listName.trim()) return

    try {
      setIsCreating(true)
      await createList({
        name: listName.trim(),
      })
      showAlert({
        title: "Success!",
        message: `List "${listName.trim()}" has been created successfully.`,
        buttons: [{ label: "OK" }],
      })
      navigation.goBack()
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create list",
        buttons: [{ label: "OK" }],
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSuggestionPress = (suggestion: string) => {
    setListName(suggestion)
  }

  const handleBackPress = () => {
    navigation.goBack()
  }

  return (
    <Screen
      style={themed($root)}
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($contentContainer)}
    >
      <Header title="New List" showBackButton onBackPress={handleBackPress} />

      {/* Scrollable Content */}
      <ScrollView
        style={themed($scrollView)}
        contentContainerStyle={themed($scrollContent)}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Field */}
        <View style={themed($inputContainer)}>
          <TextInput
            style={themed($textInput)}
            placeholder="New list"
            placeholderTextColor={themed($placeholderText).color}
            value={listName}
            onChangeText={setListName}
            autoFocus
          />
        </View>

        {/* Suggestions */}
        <View style={themed($suggestionsContainer)}>
          <Text style={themed($suggestionsLabel)} text="Suggestions" />
          <View style={themed($suggestionsRow)}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={themed($suggestionButton)}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={themed($suggestionText)} text={suggestion} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Create Button */}
      <View style={themed($buttonContainer)}>
        <TouchableOpacity
          style={themed($createButton)}
          onPress={handleCreateList}
          disabled={!listName.trim() || isCreating}
        >
          <Text style={themed($createButtonText)} text={isCreating ? "CREATING..." : "CREATE"} />
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
})

const $scrollView: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xl,
  marginBottom: spacing.xl,
})

const $textInput: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  borderWidth: 2,
  borderColor: colors.tint,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  fontSize: 16,
  fontFamily: typography.primary.normal,
  color: colors.text,
  backgroundColor: colors.background,
})

const $placeholderText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $suggestionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $suggestionsLabel: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  marginBottom: spacing.sm,
})

const $suggestionsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $suggestionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral300,
  borderRadius: 20,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $suggestionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 14,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  paddingBottom: spacing.lg,
  borderTopWidth: 1,
  borderTopColor: colors.palette.neutral200,
})

const $createButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
})

const $createButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  fontWeight: "600",
})
