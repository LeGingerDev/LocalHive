import { FC, useState, useCallback } from "react"
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TextStyle,
  FlatList,
  Image,
  ImageStyle,
  ScrollView,
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
import { useSubscription } from "@/hooks/useSubscription"
import { useAuth } from "@/context/AuthContext"
import type { BottomTabScreenProps } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ListsScreen: FC<BottomTabScreenProps<"Search">> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { user } = useAuth()
  const subscription = useSubscription(user?.id || null)
  const { lists, loading, error, deleteList, refetch } = useItemLists()
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedList, setSelectedList] = useState<any>(null)

  // Separate lists by ownership vs membership
  const myCreatedLists = lists.filter(list => list.user_id === user?.id) // Lists I created (personal + group)
  const otherPeopleLists = lists.filter(list => list.user_id !== user?.id) // Lists created by others in groups I'm in

  const handleNewList = () => {
    // Check subscription limits
    if (!subscription.canCreateListNow) {
      // Show limit warning - this will be handled by the CreateListScreen
      return
    }
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
        // console.log("[ListsScreen] Screen focused - refreshing lists data")
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
            disabled: !subscription.canCreateListNow,
          },
        ]}
      />

      {/* Main Content Area */}
      <View style={themed($mainContent)}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState heading="Error Loading Lists" content={error} />
        ) : (myCreatedLists.length === 0 && otherPeopleLists.length === 0) ? (
          <View style={themed($emptyContainer)}>
            <Image
              source={require("@assets/Visu/Visu_Searching.png")}
              style={themed($emptyImage)}
            />
            <Text style={themed($emptyTitle)} text="No Lists Yet" />
            <Text style={themed($emptyContent)} text="Create your first list to get started" />
          </View>
        ) : (
          <>
            <ScrollView 
              style={themed($scrollContainer)} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={themed($scrollContentContainer)}
            >
              {/* List Limit Warning */}
              {!subscription.canCreateListNow && (
                <View style={themed($limitWarningContainer)}>
                  <Text style={themed($limitWarningText)}>
                    ⚠️ You've reached your list limit. Upgrade to Pro for unlimited lists!
                  </Text>
                </View>
              )}
              
              {/* My Created Lists Section */}
              {myCreatedLists.length > 0 && (
                <View style={themed($sectionContainer)}>
                  <Text style={themed($sectionTitle)} text={`Private Lists (${myCreatedLists.length})`} />
                  <FlatList
                    data={myCreatedLists}
                    renderItem={renderListItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    contentContainerStyle={themed($listContainer)}
                  />
                </View>
              )}

              {/* Other People's Lists Section */}
              {otherPeopleLists.length > 0 && (
                <View style={themed($sectionContainer)}>
                  <Text style={themed($sectionTitle)} text={`Group Lists (${otherPeopleLists.length})`} />
                  <FlatList
                    data={otherPeopleLists}
                    renderItem={renderListItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    contentContainerStyle={themed($listContainer)}
                  />
                </View>
              )}
            </ScrollView>
          </>
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

const $sectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  marginBottom: spacing.sm,
  paddingHorizontal: spacing.md,
})

const $scrollContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scrollContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})
