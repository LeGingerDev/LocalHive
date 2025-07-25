import React, { FC, useState, useCallback, useRef, useEffect } from "react"
import {
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TouchableOpacity,
  Keyboard,
  Platform,
  Image,
} from "react-native"

import { useAlert } from "@/components/Alert"
import { Header } from "@/components/Header"
import { ItemCard } from "@/components/ItemCard"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { useAuth } from "@/context/AuthContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useSubscription } from "@/hooks/useSubscription"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { askAIAboutItems, AIQueryResponse } from "@/services/openaiService"
import { ItemWithProfile, ItemService } from "@/services/supabase/itemService"
import { supabase } from "@/services/supabase/supabase"
import { searchItemsByVector } from "@/services/vectorSearchService"
import { HapticService } from "@/services/hapticService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

// Tab bar height from AnimatedTabBar component
const TAB_BAR_HEIGHT = 80
const TAB_BAR_PADDING = 40 // Extra padding for visual comfort

export const SearchScreen: FC<BottomTabScreenProps<"Search">> = ({ route }) => {
  const { themed, theme } = useAppTheme()
  const { trackEvent, events } = useAnalytics()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const { showAlert } = useAlert()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<(ItemWithProfile & { group_name?: string })[]>([])
  const [isAIMode, setIsAIMode] = useState(() => {
    // Only enable AI mode by default if user is pro and explicitly requested
    const requestedAI = route.params?.enableAI || false
    return requestedAI && subscription.isPro
  })
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const flatListRef = useRef<FlatList>(null)

  // Track screen view on mount
  React.useEffect(() => {
    trackEvent({
      name: events.SCREEN_VIEWED,
      properties: {
        screen_name: "SearchScreen",
      },
    })
  }, [trackEvent, events.SCREEN_VIEWED])

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true)
      },
    )
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false)
      },
    )

    return () => {
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [])

  // Debounced search using the vector service
  const handleChange = useCallback(
    (text: string) => {
      setQuery(text)
      setError(null)
      setAiResponse(null)

      // Only auto-search for vector search mode
      if (!isAIMode) {
        setIsLoading(true)
        setResults([])
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
        debounceTimeout.current = setTimeout(async () => {
          if (!text) {
            setResults([])
            setIsLoading(false)
            return
          }

          try {
            console.log("[SearchScreen] Searching for:", text)
            const items = await searchItemsByVector(text)
            console.log("[SearchScreen] Search results:", items)
            console.log("[SearchScreen] Number of results:", items.length)

            // Fetch group names for the search results
            const itemsWithGroupNames = await fetchGroupNamesForItems(items)
            setResults(itemsWithGroupNames)
          } catch (e) {
            console.error("[SearchScreen] Search error:", e)
            setError("Failed to search. Please try again.")
          } finally {
            setIsLoading(false)
          }
        }, 400)
      }
    },
    [isAIMode],
  )

  // Manual search for AI mode
  const handleAISearch = useCallback(async () => {
    if (!query.trim()) return

    HapticService.medium()
    setError(null)
    setAiResponse(null)
    setIsLoading(true)
    setResults([])

    try {
      console.log("[SearchScreen] AI Query:", query)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("User not authenticated")
        setIsLoading(false)
        return
      }

      const { data: allItems, error: itemsError } = await ItemService.getAllUserItemsWithProfiles(
        user.id,
      )
      if (itemsError || !allItems) {
        setError("Failed to load items for AI analysis")
        setIsLoading(false)
        return
      }

      const aiResponse = await askAIAboutItems(query, allItems)
      setAiResponse(aiResponse)

      // Fetch group names for AI search results
      const itemsWithGroupNames = await fetchGroupNamesForItems(aiResponse.relatedItems || [])
      setResults(itemsWithGroupNames)
    } catch (e) {
      console.error("[SearchScreen] AI error:", e)
      setError("Failed to get AI response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [query])

  // Handle search mode switch
  // Function to fetch group names for search results
  const fetchGroupNamesForItems = useCallback(async (items: ItemWithProfile[]) => {
    if (items.length === 0) return items

    try {
      // Get unique group IDs from the items
      const groupIds = [...new Set(items.map((item) => item.group_id))]

      // Fetch group names
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIds)

      if (groupsError) {
        console.error("Error fetching group names:", groupsError)
        return items
      }

      // Create a map of group ID to group name
      const groupMap = new Map()
      groups?.forEach((group) => {
        groupMap.set(group.id, group.name)
      })

      // Add group names to items
      return items.map((item) => ({
        ...item,
        group_name: groupMap.get(item.group_id),
      }))
    } catch (error) {
      console.error("Error fetching group names:", error)
      return items
    }
  }, [])

  const handleModeSwitch = useCallback(() => {
    const newMode = !isAIMode

    // If trying to enable AI mode and user is not pro, show upgrade modal
    if (newMode && !subscription.isPro) {
      showAlert({
        title: "AI Search Requires Pro",
        message:
          "AI-powered search is a Pro feature. Upgrade to Pro to unlock advanced AI search capabilities and get intelligent answers about your items.",
        buttons: [
          {
            label: "Maybe Later",
            preset: "default",
          },
          {
            label: "Upgrade to Pro",
            preset: "filled",
            onPress: () => {
              // Navigate to subscription management or upgrade flow
              // For now, we'll just show a message
              showAlert({
                title: "Upgrade to Pro",
                message:
                  "To upgrade to Pro, please go to your Profile screen and tap on the subscription management option.",
                buttons: [{ label: "OK", preset: "filled" }],
              })
            },
          },
        ],
      })
      return
    }

    // Track mode switch
    trackEvent({
      name: events.SEARCH_MODE_SWITCHED,
      properties: {
        from_mode: isAIMode ? "ai" : "vector",
        to_mode: newMode ? "ai" : "vector",
        had_query: query.length > 0,
        query_length: query.length,
        is_pro_user: subscription.isPro,
      },
    })

    HapticService.light()
    setIsAIMode(newMode)
    setQuery("") // Clear input
    setResults([]) // Clear results
    setError(null) // Clear any errors
    setAiResponse(null) // Clear AI response
  }, [isAIMode, query, trackEvent, events.SEARCH_MODE_SWITCHED, subscription.isPro, showAlert])

  const renderItem = useCallback(
    ({ item }: { item: ItemWithProfile & { group_name?: string } }) => {
      return <ItemCard item={item} groupName={item.group_name} />
    },
    [],
  )

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={themed($emptyContainer)}>
          <ActivityIndicator size="small" color={themed($activityIndicator).color} />
          <Text style={themed($emptyText)} text="Searching..." />
        </View>
      )
    }

    if (error) {
      return (
        <View style={themed($emptyContainer)}>
          <Text style={themed($errorText)} text={error} />
        </View>
      )
    }

    if (query.length > 0 && results.length === 0 && !aiResponse) {
      return (
        <View style={themed($emptyContainer)}>
          <Image
            source={require("../../../assets/Visu/Visu_Searching.png")}
            style={themed($emptyStateImage)}
            resizeMode="contain"
          />
          <Text style={themed($emptyText)} text="No items found" />
        </View>
      )
    }

    if (query.length === 0) {
      return (
        <View style={themed($emptyContainer)}>
          <Image
            source={require("../../../assets/Visu/Visu_Searching.png")}
            style={themed($emptyStateImage)}
            resizeMode="contain"
          />
          <Text
            style={themed($emptyText)}
            text={isAIMode ? "Ask about your items..." : "Search your items..."}
          />
        </View>
      )
    }

    return null
  }, [isLoading, error, query, results.length, aiResponse, isAIMode, themed])

  return (
    <Screen
      style={themed($root)}
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($contentContainer)}
    >
      <Header
        title="Search"
        rightActions={[
          {
            customComponent: (
              <View style={themed($aiToggleContainer)}>
                <Text style={themed($aiToggleText)}>Use AI</Text>
                <Switch
                  value={isAIMode}
                  onValueChange={handleModeSwitch}
                  disabled={!subscription.isPro}
                />
                {!subscription.isPro && <Text style={themed($proBadge)}>PRO</Text>}
              </View>
            ),
          },
        ]}
      />

      {/* Main Content Area */}
      <View style={themed($mainContent)}>
        <FlatList
          ref={flatListRef}
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={themed($flatListContent)}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* Search Input Area - Fixed at Bottom */}
      <View style={$searchInputAreaStyle(theme, isKeyboardVisible)}>
        <View style={themed($searchContainer)}>
          <View style={themed($inputWrapper)}>
            <TextInput
              placeholder={isAIMode ? "Ask about your items..." : "Search items..."}
              placeholderTextColor={themed($placeholderText).color}
              style={themed($textInput)}
              value={query}
              onChangeText={handleChange}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType={isAIMode ? "search" : "default"}
              onSubmitEditing={isAIMode ? handleAISearch : undefined}
            />
          </View>
          {isAIMode && (
            <TouchableOpacity
              style={themed($searchButton)}
              onPress={handleAISearch}
              disabled={!query.trim() || isLoading}
            >
              <Text style={themed($searchButtonText)} text="Search" />
            </TouchableOpacity>
          )}
        </View>
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

const $mainContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $inputWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral400,
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  height: 48,
  flex: 1,
  justifyContent: "center",
})

const $textInput: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.text,
  padding: 0,
  margin: 0,
  height: 46, // Slightly less than wrapper to account for border
  textAlignVertical: "center",
  includeFontPadding: false,
})

const $placeholderText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 15,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.lg,
  alignItems: "center",
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 15,
})

const $flatListContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.sm,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $searchButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  height: 48, // Match input height
  minWidth: 80,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
})

const $searchButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  fontWeight: "600",
})

const $aiToggleContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $aiToggleText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
})

const $proBadge: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 10,
  color: colors.background,
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 4,
  marginLeft: spacing.xs,
  overflow: "hidden",
})

const $searchInputArea: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.palette.neutral200,
})

const $searchInputAreaStyle = (theme: any, isKeyboardVisible: boolean) => ({
  backgroundColor: theme.colors.background,
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  paddingBottom: isKeyboardVisible ? 80 : 120,
  borderTopWidth: 1,
  borderTopColor: theme.colors.palette.neutral200,
})

const $emptyStateImage: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: spacing.xxl,
  height: spacing.xxl,
  marginBottom: spacing.md,
})
