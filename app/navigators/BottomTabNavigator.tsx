// NOTE: Requires @react-navigation/bottom-tabs
import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native"
import {
  createBottomTabNavigator,
  BottomTabScreenProps as NavigationBottomTabScreenProps,
} from "@react-navigation/bottom-tabs"
import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

import { AnimatedTabBar } from "@/components/AnimatedTabBar"
import { Screen } from "@/components/Screen"
import { AddScreen } from "@/screens/Main/AddScreen"
import { GroupsScreen } from "@/screens/Main/GroupsScreen"
import { HomeScreen } from "@/screens/Main/HomeScreen"
import ProfileScreen from "@/screens/Main/ProfileScreen"
import { SearchScreen } from "@/screens/Main/SearchScreen"

import { useAppTheme } from "../theme/context"

export type BottomTabParamList = {
  Home: undefined
  Search: { enableAI?: boolean } | undefined
  Add: { groupId?: string } | undefined
  Groups: { refresh?: boolean } | undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<BottomTabParamList>()

export type BottomTabScreenProps<T extends keyof BottomTabParamList> =
  NavigationBottomTabScreenProps<BottomTabParamList, T>

type TabRoute = {
  name: string
}

export function BottomTabNavigator() {
  const { theme } = useAppTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { display: "none" }, // Hide default tab bar
      }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
