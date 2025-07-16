import React, { FC, useState, useCallback, useRef } from "react"
import {
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native"

import { Header } from "@/components/Header"
import { ItemCard } from "@/components/ItemCard"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { useAnalytics } from "@/hooks/useAnalytics"
import { askAIAboutItems, AIQueryResponse } from "@/services/openaiService"
import { ItemWithProfile, ItemService } from "@/services/supabase/itemService"
import { supabase } from "@/services/supabase/supabase"
import { searchItemsByVector } from "@/services/vectorSearchService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

export const SearchScreen: FC = () => {
  const { themed } = useAppTheme()
  const { trackEvent, events } = useAnalytics()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ItemWithProfile[]>([])
  const [isAIMode, setIsAIMode] = useState(false)
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Track screen view on mount
  React.useEffect(() => {
    trackEvent({
      name: events.SCREEN_VIEWED,
      properties: {
        screen_name: "SearchScreen",
      },
    })
  }, [trackEvent, events.SCREEN_VIEWED])

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
            setResults(items)
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
      setResults(aiResponse.relatedItems || [])
    } catch (e) {
      console.error("[SearchScreen] AI error:", e)
      setError("Failed to get AI response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [query])

  // Handle search mode switch
  const handleModeSwitch = useCallback(() => {
    const newMode = !isAIMode

    // Track mode switch
    trackEvent({
      name: events.SEARCH_MODE_SWITCHED,
      properties: {
        from_mode: isAIMode ? "ai" : "vector",
        to_mode: newMode ? "ai" : "vector",
        had_query: query.length > 0,
        query_length: query.length,
      },
    })

    setIsAIMode(newMode)
    setQuery("") // Clear input
    setResults([]) // Clear results
    setError(null) // Clear any errors
    setAiResponse(null) // Clear AI response
  }, [isAIMode, query, trackEvent, events.SEARCH_MODE_SWITCHED])

  return (
    <Screen style={themed($root)} preset="fixed" safeAreaEdges={["top"]}>
      <Header
        title="Search"
        rightActions={[
          {
            text: isAIMode ? "Quick Search" : "Ask AI",
            onPress: handleModeSwitch,
          },
        ]}
      />
      <View style={themed($content)}>
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

        {isLoading && (
          <ActivityIndicator
            style={themed($loading)}
            size="small"
            color={themed($activityIndicator).color}
          />
        )}

        {error && (
          <View style={themed($errorContainer)}>
            <Text style={themed($errorText)} text={error} />
          </View>
        )}

        {/* AI Response - Hidden, just show filtered items */}

        {!isLoading && !error && results.length === 0 && query.length > 0 && !aiResponse && (
          <View style={themed($emptyContainer)}>
            <Text
              style={themed($emptyText)}
              text={isAIMode ? "No AI response available." : "No results found."}
            />
          </View>
        )}

        {!isLoading && !error && results.length > 0 && (
          <View style={themed($resultsHeader)}>
            <Text
              style={themed($resultsCount)}
              text={`${results.length} result${results.length === 1 ? "" : "s"} found`}
            />
          </View>
        )}

        <View style={themed($resultsContainer)}>
          {results.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onItemUpdated={(updatedItem) => {
                // Update the item in the local results state
                setResults((prevResults) =>
                  prevResults.map((prevItem) =>
                    prevItem.id === updatedItem.id ? updatedItem : prevItem,
                  ),
                )
              }}
              onItemDeleted={(itemId) => {
                // Remove the item from the local results state
                setResults((prevResults) =>
                  prevResults.filter((prevItem) => prevItem.id !== itemId),
                )
              }}
            />
          ))}
        </View>
      </View>
    </Screen>
  )
}

const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})
const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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
const $loading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xs,
})
const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})
const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.md,
  alignItems: "center",
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

const $resultsHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
  alignItems: "center",
})
const $resultsCount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 15,
})
const $resultsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xl,
})

const $aiResponseContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  marginVertical: spacing.sm,
  borderLeftWidth: 4,
  borderLeftColor: colors.tint,
})

const $aiResponseText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 15,
  lineHeight: 22,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginTop: spacing.md,
  marginBottom: spacing.md,
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
