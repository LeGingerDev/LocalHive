import { FC, useState, useCallback } from "react"
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TextStyle,
  FlatList,
  Image,
  ImageStyle,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { EmptyState } from "@/components/EmptyState"
import { Header } from "@/components/Header"
import { ListCard } from "@/components/ListCard"
import { ListMenuModal } from "@/components/ListMenuModal"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useItemLists } from "@/hooks/useItemLists"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ListsScreen: FC<BottomTabScreenProps<"Search">> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { lists, loading, error, deleteList, refetch } = useItemLists()
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedList, setSelectedList] = useState<any>(null)

  const handleNewList = () => {
    navigation.navigate("CreateList" as any)
  }

  const handleMenuPress = (list: any) => {
    setSelectedList(list)
    setMenuVisible(true)
  }

  const handleMenuClose = () => {
    setMenuVisible(false)
    setSelectedList(null)
  }

  const handleEditList = () => {
    if (selectedList) {
      // Navigate to edit list screen
      navigation.navigate("CreateList" as any, { list: selectedList })
    }
    handleMenuClose()
  }

  const handleDeleteList = async () => {
    if (selectedList) {
      try {
        await deleteList(selectedList.id)
        // List will be automatically removed from the state by the hook
      } catch (error) {
        console.error("Failed to delete list:", error)
        // You might want to show an error toast here
      }
    }
    handleMenuClose()
  }

  const handleViewList = () => {
    if (selectedList) {
      // Navigate to list detail screen
      navigation.navigate("ListDetail" as any, { 
        listId: selectedList.id,
        listName: selectedList.name 
      })
    }
    handleMenuClose()
  }

  // Refresh data when screen comes into focus (with throttling)
  useFocusEffect(
    useCallback(() => {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        console.log("[ListsScreen] Screen focused - refreshing lists data")
        refetch()
      }, 100)

      return () => clearTimeout(timeoutId)
    }, []), // Remove refetch from dependencies to prevent infinite loops
  )

  const renderListItem = ({ item }: { item: any }) => (
    <ListCard
      list={item}
      onPress={(list) => navigation.navigate("ListDetail" as any, { 
        listId: list.id,
        listName: list.name 
      })}
      onMenuPress={handleMenuPress}
      showLockIcon={true}
      showMenuButton={true}
      groupName={item.group_name}
    />
  )

  return (
    <Screen
      style={themed($root)}
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($contentContainer)}
    >
      <Header
        title="Lists"
        rightActions={[
          {
            text: "New List",
            onPress: handleNewList,
          },
        ]}
      />

      {/* Main Content Area */}
      <View style={themed($mainContent)}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState heading="Error Loading Lists" content={error} />
        ) : lists.length === 0 ? (
          <View style={themed($emptyContainer)}>
            <Image
              source={require("@assets/Visu/Visu_Searching.png")}
              style={themed($emptyImage)}
            />
            <Text style={themed($emptyTitle)} text="No Lists Yet" />
            <Text style={themed($emptyContent)} text="Create your first list to get started" />
          </View>
        ) : (
          <FlatList
            data={lists}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={themed($listContainer)}
          />
        )}
      </View>



      {/* List Menu Modal */}
      <ListMenuModal
        visible={menuVisible}
        onClose={handleMenuClose}
        options={[
          {
            label: "View List",
            onPress: handleViewList,
          },
          {
            label: "Edit List",
            onPress: handleEditList,
          },
          {
            label: "Delete List",
            onPress: handleDeleteList,
            destructive: true,
          },
        ]}
      />
    </Screen>
  )
}

const $root: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing: _spacing }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
})

const $mainContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.lg,
  paddingTop: spacing.md,
})

const $newListButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  fontWeight: "600",
})

const $listContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})



const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.lg,
})

const $emptyImage: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: 120,
  height: 120,
  marginBottom: spacing.lg,
  resizeMode: "contain",
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing: _spacing }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 18,
  fontWeight: "600",
  marginBottom: _spacing.sm,
  textAlign: "center",
})

const $emptyContent: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.textDim,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  textAlign: "center",
  lineHeight: 20,
})
