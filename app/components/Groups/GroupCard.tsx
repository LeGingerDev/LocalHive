import React from "react"
import { View, ViewStyle, TouchableOpacity } from "react-native"
import { Group } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { GroupHeader } from "@/components/Groups/GroupHeader"
import { CatalogCard } from "@/components/Groups/CatalogsSection/CatalogCard"

interface GroupCardProps {
  group: Group
  navigation: any
}

export const GroupCard = ({ group, navigation }: GroupCardProps) => {
  const { themed } = useAppTheme()
  // TODO: Replace mockCatalogs with real data if available
  const mockCatalogs = [
    { id: "1", title: "General", items: 5, icon: "folder", color: "primary300" },
    { id: "2", title: "Resources", items: 3, icon: "book", color: "accent200" },
  ]
  return (
    <View style={themed($groupCard)}>
      <GroupHeader 
        data={{ 
          title: group.name, 
          description: `${group.member_count || 0} members • ${group.post_count || 0} posts` 
        }} 
      />
      <View style={themed($catalogGrid)}>
        {mockCatalogs.map((cat) => (
          <CatalogCard key={cat.id} data={{ title: cat.title, description: `${cat.items} items` }} />
        ))}
      </View>
      <View style={themed($viewGroupRow)}>
        <TouchableOpacity 
          style={themed($viewGroupButton)} 
          onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
          activeOpacity={0.8}
        >
          <Text style={themed($viewGroupButtonText)} text="View Group" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Styles (copy from GroupsScreen)
const $groupCard = ({ colors, spacing }: any) => ({ backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, shadowColor: colors.palette.neutral800, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 })
const $catalogGrid = (): ViewStyle => ({ flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 8 })
const $viewGroupRow = () => ({ alignItems: "center" as const, marginTop: 8 })
const $viewGroupButton = ({ colors, typography }: any): ViewStyle => ({ backgroundColor: colors.primary100, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24, overflow: "hidden" as "hidden" })
const $viewGroupButtonText = ({ colors, typography }: any) => ({ color: colors.tint, fontFamily: typography.primary.medium, fontSize: 15, textAlign: "center" as const }) 