import React, { FC, useState } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, TextInput, ScrollView } from "react-native"
import { Picker } from "@react-native-picker/picker"

import { useAlert } from "@/components/Alert"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useItemLists } from "@/hooks/useItemLists"
import { useGroups } from "@/hooks/useGroups"
import { useSubscription } from "@/hooks/useSubscription"
import { useAuth } from "@/context/AuthContext"
import { ItemListService } from "@/services/supabase/itemListService"
import { reviewTrackingService } from "@/services/reviewTrackingService"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface CreateListScreenProps {
  navigation: any
  route?: { params?: { groupId?: string; list?: any } }
}

export const CreateListScreen: FC<CreateListScreenProps> = ({ navigation, route }) => {
  const { themed } = useAppTheme()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const { createList } = useItemLists()
  const { groups } = useGroups()
  const { showAlert } = useAlert()
  const [listName, setListName] = useState(route?.params?.list?.name || "")
  const [selectedGroupId, setSelectedGroupId] = useState<string>(route?.params?.groupId || route?.params?.list?.group_id || "")
  const [isCreating, setIsCreating] = useState(false)
  const isEditing = !!route?.params?.list

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

    // Check subscription limits for new lists only
    if (!isEditing && !subscription.canCreateListNow) {
      showAlert({
        title: "List Limit Reached",
        message: "You've reached your list limit. Upgrade to Pro for unlimited lists!",
        buttons: [{ label: "OK" }],
      })
      return
    }

    try {
      setIsCreating(true)
      
      if (isEditing) {
        // Update existing list
        const { error } = await ItemListService.updateList(route?.params?.list?.id, {
          name: listName.trim(),
          group_id: selectedGroupId || null,
        })
        
        if (error) throw error
        
        showAlert({
          title: "Success!",
          message: `List "${listName.trim()}" has been updated successfully.`,
          buttons: [{ label: "OK" }],
        })
      } else {
        // Create new list
        await createList({
          name: listName.trim(),
          group_id: selectedGroupId || undefined,
        })
        
        // Track list creation for review prompts
        await reviewTrackingService.trackListCreated()
        
        showAlert({
          title: "Success!",
          message: `List "${listName.trim()}" has been created successfully.`,
          buttons: [{ label: "OK" }],
        })
      }
      
      navigation.goBack()
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} list`,
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
      <Header title={isEditing ? "Edit List" : "New List"} showBackButton onBackPress={handleBackPress} />

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

        {/* Group Selection */}
        <View style={themed($inputContainer)}>
          <Text style={themed($labelText)} text="Link to Group (Optional)" />
          <View style={themed($pickerContainer)}>
            <Picker
              selectedValue={selectedGroupId}
              onValueChange={(itemValue) => setSelectedGroupId(itemValue as string)}
              style={themed($picker)}
            >
              <Picker.Item label="No Group (Personal List)" value="" />
              {groups.map((group) => (
                <Picker.Item key={group.id} label={group.name} value={group.id} />
              ))}
            </Picker>
          </View>
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
          <Text style={themed($createButtonText)} text={isCreating ? (isEditing ? "UPDATING..." : "CREATING...") : (isEditing ? "UPDATE" : "CREATE")} />
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

const $labelText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  marginBottom: spacing.sm,
})

const $pickerContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 2,
  borderColor: colors.tint,
  borderRadius: 12,
  backgroundColor: colors.background,
})

const $picker: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 16,
})
