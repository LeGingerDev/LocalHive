import React, { useState, useEffect, useCallback, useRef } from "react"
import { View, ViewStyle, TextStyle, ScrollView, TouchableOpacity } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { ListCard } from "@/components/ListCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { useItemLists } from "@/hooks/useItemLists"
import { useSubscription } from "@/hooks/useSubscription"
import { useAuth } from "@/context/AuthContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { ItemList } from "@/services/supabase/itemListService"

interface ShoppingListsSectionProps {
  onListPress?: (list: ItemList) => void
  onCreateList?: () => void
}

export const ShoppingListsSection: React.FC<ShoppingListsSectionProps> = ({
  onListPress,
  onCreateList,
}) => {
  const { themed } = useAppTheme()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const { lists, loading, error, refetch } = useItemLists()
  const [shoppingLists, setShoppingLists] = useState<ItemList[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    // Filter lists to show ALL lists created by the user (personal + group lists they created)
    const userCreatedLists = lists.filter(list => list.user_id === user?.id)
    
    // Sort personal lists first, then group lists by creation date
    const sortedLists = userCreatedLists
      .sort((a, b) => {
        // Personal lists (no group_id) come first
        if (!a.group_id && b.group_id) return -1
        if (a.group_id && !b.group_id) return 1
        // Then sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    setShoppingLists(sortedLists)
  }, [lists, user?.id])

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchRef.current()
    }, []),
  )

  const handleListPress = (list: ItemList) => {
    onListPress?.(list)
  }

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  const handleCreateList = useCallback(() => {
    // Check if user can create a list
    if (!subscription.canCreateListNow) {
      // Show limit warning - this will be handled by the parent component
      return
    }
    onCreateList?.()
  }, [subscription.canCreateListNow, onCreateList])

  if (loading) {
    return <LoadingSpinner text="Loading lists..." />
  }

  if (error) {
    return (
      <View style={themed($errorContainer)}>
        <Text style={themed($errorText)} text={`Error loading lists: ${error}`} />
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      {/* Header with Gradient Background */}
      <TouchableOpacity
        style={themed($headerGradient)}
        onPress={handleToggleCollapse}
        activeOpacity={0.8}
      >
        <CustomGradient preset="primary" style={themed($gradientContainer)}>
          <View style={themed($headerContent)}>
            <View style={themed($headerTextContainer)}>
              <Icon icon="list" size={20} color="#FFFFFF" />
              <Text style={themed($headerTitle)} text={`Shopping Lists (${shoppingLists.length}/${subscription.listsLimit})`} />
            </View>
            <Icon
              icon={isCollapsed ? "caretRight" : "caretLeft"}
              size={20}
              color="#FFFFFF"
              style={themed($arrowIcon)}
            />
          </View>
        </CustomGradient>
      </TouchableOpacity>

      {/* Content */}
      {isCollapsed ? (
        <View style={themed($collapsedContainer)}>
          <Text style={themed($collapsedText)} text="Lists hidden" />
        </View>
      ) : (
        <View style={themed($contentContainer)}>
          {shoppingLists.length === 0 ? (
            <View style={themed($emptyContainer)}>
              <Text style={themed($emptyText)} text="No shopping lists yet" />
              <Text style={themed($emptySubtext)} text="Create a list to get started" />
            </View>
          ) : (
            <>
              {/* List Limit Warning */}
              {!subscription.canCreateListNow && (
                <View style={themed($limitWarningContainer)}>
                  <Text style={themed($limitWarningText)}>
                    ⚠️ You've reached your list limit. Upgrade to Pro for unlimited lists!
                  </Text>
                </View>
              )}
              <ScrollView style={themed($listsContainer)} showsVerticalScrollIndicator={false}>
                {shoppingLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onPress={handleListPress}
                    showLockIcon={true}
                    showMenuButton={false}
                    groupName={list.group_name}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  overflow: "hidden",
})

const $headerGradient: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $gradientContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $headerTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $arrowIcon: ThemedStyle<{ transform: [{ rotate: string }] }> = () => ({
  transform: [{ rotate: "90deg" }],
})

const $headerTitle: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
})

const $collapsedContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  padding: spacing.md,
  alignItems: "center",
})

const $collapsedText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
})

const $listsContainer: ThemedStyle<ViewStyle> = () => ({
  // Removed maxHeight to allow container to expand to content
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  marginBottom: spacing.xs,
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 12,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  alignItems: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.error,
  fontFamily: typography.primary.normal,
  fontSize: 14,
})

const $limitWarningContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error + "20",
  borderWidth: 1,
  borderColor: colors.error,
  padding: spacing.sm,
  borderRadius: 8,
  marginBottom: spacing.sm,
})

const $limitWarningText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.error,
  textAlign: "center",
}) 