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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

import { Header } from "@/components/Header"
import { ItemCard } from "@/components/ItemCard"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { FilterModal } from "@/components/FilterModal"
import { useAuth } from "@/context/AuthContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import { HapticService } from "@/services/hapticService"
import { ItemWithProfile, ItemService } from "@/services/supabase/itemService"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

interface ItemWithGroupName extends ItemWithProfile {
  group_name: string
}

interface AllItemsModalProps {
  visible: boolean
  onClose: () => void
  onItemSelect?: (item: ItemWithProfile & { group_name?: string }) => void
}

export const AllItemsModal: FC<AllItemsModalProps> = ({ 
  visible, 
  onClose, 
  onItemSelect 
}) => {
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

  // Track modal open
  React.useEffect(() => {
    if (visible) {
      trackEvent({
        name: events.SCREEN_VIEWED,
        properties: {
          screen_name: "AllItemsModal",
        },
      })
    }
  }, [visible, trackEvent, events.SCREEN_VIEWED])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery("")
      setSelectedCategories([])
      setError(null)
    } else {
      fetchAllItems()
    }
  }, [visible])

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
    if (onItemSelect) {
      onItemSelect(item)
    }
  }, [onItemSelect])

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
      <View style={themed($itemContainer)}>
        <View style={themed($itemCardContainer)}>
          <ItemCard item={item} groupName={item.group_name} />
        </View>
        {onItemSelect && (
          <TouchableOpacity
            style={themed($linkButton)}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <Text style={themed($linkButtonText)}>Link</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleItemPress, themed, onItemSelect],
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={themed($root)}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <Header
          title={onItemSelect ? "Link Item" : "All Items"}
          showBackButton
          onBackPress={onClose}
        />

        {/* Search and Filter Bar */}
        <View style={themed($searchContainer)}>
          <View style={themed($searchInputWrapper)}>
            <View style={themed($searchIconContainer)}>
              <Icon icon="search" size={20} color={themed($searchIconColor).color} />
            </View>
            <TextInput
              style={themed($searchInput)}
              placeholder="Search items..."
              placeholderTextColor={themed($placeholderText).color}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={themed($filterButton)}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Icon icon="settings" size={20} color={themed($filterIconColor).color} />
          </TouchableOpacity>
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
                <View key={category} style={themed($filterTag)}>
                  <Text style={themed($filterTagText)}>{category}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                  >
                    <Text style={themed($filterTagRemoveText)}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setSelectedCategories([])}
                style={themed($clearAllFiltersButton)}
              >
                <Text style={themed($clearAllFiltersText)}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View style={themed($contentContainer)}>
          {isLoading && !isRefreshing ? (
            renderLoadingState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={themed($flatListContent)}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={themed($activityIndicator).color}
                />
              }
              keyboardShouldPersistTaps="handled"
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
      </KeyboardAvoidingView>
    </Modal>
  )
}

const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.sm,
})

const $searchInputWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  height: 40,
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
  height: 38,
  textAlignVertical: "center",
  includeFontPadding: false,
})

const $placeholderText: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $filterButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $filterIconColor: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.textDim,
})

const $flatListContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $itemContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $itemCardContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
})

const $linkButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  minWidth: 60,
  alignItems: "center",
  justifyContent: "center",
})

const $linkButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  fontWeight: "600",
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  textAlign: "center",
  marginBottom: spacing.md,
})

const $retryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
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
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  marginTop: spacing.md,
})

const $activityIndicator: ThemedStyle<{ color: string }> = ({ colors }) => ({
  color: colors.tint,
})

const $filterTagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.sm,
})

const $filterTagsScrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingRight: spacing.md,
})

const $filterTag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral300,
  borderRadius: 16,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  marginRight: spacing.xs,
})

const $filterTagText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 12,
  marginRight: spacing.xs,
})

const $filterTagRemoveText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.bold,
  fontSize: 14,
})

const $clearAllFiltersButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral400,
  borderRadius: 16,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $clearAllFiltersText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 12,
}) 