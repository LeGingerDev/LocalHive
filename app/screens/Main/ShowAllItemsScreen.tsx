import React, { FC, useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  View,
  ActivityIndicator,
  FlatList,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native"

import { Header } from "@/components/Header"
import { ItemCard } from "@/components/ItemCard"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { FilterModal } from "@/components/FilterModal"
import { useAuth } from "@/context/AuthContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { navigate } from "@/navigators/navigationUtilities"
import { HapticService } from "@/services/hapticService"
import { ItemWithProfile, ItemService } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

// Tab bar height from AnimatedTabBar component
const TAB_BAR_HEIGHT = 80
const TAB_BAR_PADDING = 40 // Extra padding for visual comfort

interface ItemWithGroupName extends ItemWithProfile {
  group_name: string
}

export const ShowAllItemsScreen: FC<BottomTabScreenProps<"ShowAllItems">> = () => {
  const { themed, theme } = useAppTheme()
  const { trackEvent, events } = useAnalytics()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ItemWithGroupName[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const flatListRef = useRef<FlatList>(null)

  // Track screen view on mount
  React.useEffect(() => {
    trackEvent({
      name: events.SCREEN_VIEWED,
      properties: {
        screen_name: "ShowAllItemsScreen",
      },
    })
  }, [trackEvent, events.SCREEN_VIEWED])

  // Fetch all items from all groups
  const fetchAllItems = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await ItemService.getAllUserItemsWithGroupNames(user.id)

      if (fetchError) {
        setError(fetchError.message)
        setItems([])
      } else {
        // Sort items alphabetically by title
        const sortedItems = (data || []).sort((a: ItemWithGroupName, b: ItemWithGroupName) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
        )
        setItems(sortedItems)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items")
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Initial data fetch
  useEffect(() => {
    fetchAllItems()
  }, [fetchAllItems])

  // Filter items based on search query and categories
  const filteredItems = useMemo(() => {
    let filtered = items

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => selectedCategories.includes(item.category))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const detailsMatch = item.details?.toLowerCase().includes(query) || false
        const groupMatch = item.group_name?.toLowerCase().includes(query) || false
        
        return titleMatch || detailsMatch || groupMatch
      })
    }

    return filtered
  }, [items, searchQuery, selectedCategories])

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchAllItems()
    setIsRefreshing(false)
  }, [fetchAllItems])

  // Handle item press
  const handleItemPress = useCallback((item: ItemWithGroupName) => {
    HapticService.selection()
    navigate("EditItem", { item, returnScreen: "ShowAllItems" })
  }, [])

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  // Handle filter confirmation
  const handleFilterConfirm = useCallback((categories: string[]) => {
    setSelectedCategories(categories)
  }, [])

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: ItemWithGroupName }) => (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        style={themed($itemContainer)}
      >
        <ItemCard item={item} groupName={item.group_name} onPress={() => handleItemPress(item)} />
      </TouchableOpacity>
    ),
    [handleItemPress, themed],
  )

  // Render empty state
  const renderEmptyState = () => {
    if (searchQuery.trim() && filteredItems.length === 0) {
      return (
        <View style={themed($emptyContainer)}>
          <Text style={themed($emptyText)}>No items found for "{searchQuery}"</Text>
          <TouchableOpacity onPress={handleClearSearch} style={themed($retryButton)}>
            <Text style={themed($retryButtonText)}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={themed($emptyContainer)}>
        <Text style={themed($emptyText)}>{error ? "Failed to load items" : "No items found"}</Text>
        {error && (
          <TouchableOpacity onPress={fetchAllItems} style={themed($retryButton)}>
            <Text style={themed($retryButtonText)}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // Render loading state
  const renderLoadingState = () => (
    <View style={themed($loadingContainer)}>
      <ActivityIndicator size="large" color={themed($activityIndicator).color} />
      <Text style={themed($loadingText)}>Loading all items...</Text>
    </View>
  )

  return (
    <Screen
      contentContainerStyle={themed($root)}
      safeAreaEdges={["top"]}
      preset="fixed"
      style={themed($screenStyle)}
    >
      <Header title="All Items" showBackButton={true} onBackPress={() => navigate("Home")} />

      <View style={themed($contentContainer)}>
        {/* Search Bar */}
        <View style={themed($searchContainer)}>
          <View style={themed($searchInputWrapper)}>
            <Icon 
              icon="search" 
              size={20} 
              color={themed($searchIconColor).color}
              containerStyle={themed($searchIconContainer)}
            />
            <TextInput
              style={themed($searchInput)}
              placeholder="Search items..."
              placeholderTextColor={themed($placeholderText).color}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            <TouchableOpacity
              style={themed($filterButton)}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}
            >
              <Icon 
                icon="menu" 
                size={20} 
                color={themed($filterIconColor).color}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tags */}
        {selectedCategories.length > 0 && (
          <View style={themed($filterTagsContainer)}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themed($filterTagsScrollContent)}
            >
              {selectedCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={themed($filterTag)}
                  onPress={() => {
                    setSelectedCategories(prev => 
                      prev.filter(cat => cat !== category)
                    )
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={themed($filterTagText)}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={themed($filterTagRemoveText)}>×</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={themed($clearAllFiltersButton)}
                onPress={() => setSelectedCategories([])}
              >
                <Text style={themed($clearAllFiltersText)}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {isLoading && items.length === 0 ? (
          renderLoadingState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={themed($flatListContent)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.text}
              />
            }
            ListEmptyComponent={renderEmptyState}
            getItemLayout={(data, index) => ({
              length: 120, // Approximate item height
              offset: 120 * index,
              index,
            })}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onConfirm={handleFilterConfirm}
        currentCategories={selectedCategories}
        items={items}
      />
    </Screen>
  )
}

// Styles
const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $screenStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.lg,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  marginBottom: spacing.sm,
})

const $searchInputWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral400,
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  height: 44,
})

const $searchIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.xs,
})

const $searchIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $searchInput: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  flex: 1,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.text,
  padding: 0,
  margin: 0,
  height: 42,
  textAlignVertical: "center",
  includeFontPadding: false,
})

const $placeholderText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $filterButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: spacing.xs,
})

const $filterIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $flatListContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
})

const $itemContainer: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 2,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
  marginBottom: spacing.md,
})

const $retryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  borderRadius: 8,
})

const $retryButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 14,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  marginTop: spacing.md,
  textAlign: "center",
})

const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

// Filter Tags Styles
const $filterTagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $filterTagsScrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xs,
  gap: spacing.xs,
})

const $filterTag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  gap: spacing.xs,
})

const $filterTagText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})

const $filterTagRemoveText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 10,
  lineHeight: 16,
})

const $clearAllFiltersButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral300,
  borderRadius: 12,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $clearAllFiltersText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 12,
})
