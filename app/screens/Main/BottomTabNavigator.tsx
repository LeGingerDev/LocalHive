// NOTE: Requires @react-navigation/bottom-tabs
import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

import { useAppTheme } from "../../theme/context"
import { BottomTabButton } from "@/components/BottomTabButton"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import { AppearanceSection } from "@/components/profiles/AppearanceSection"
import { AuthService } from "@/services/supabase/authService"
import { useNavigation } from "@react-navigation/native"
import ProfileScreen from "@/screens/Main/ProfileScreen"

const Tab = createBottomTabNavigator()

type TabRoute = {
  name: string
}

function PlaceholderScreen({ label }: { label: string }) {
  const { theme } = useAppTheme()
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: 20 }}>{label}</Text>
    </View>
  )
}

function AddButton({ onPress, focused }: { onPress: (event: any) => void; focused: boolean }) {
  const { theme } = useAppTheme()
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.addButtonContainer}
      accessibilityLabel="Add"
      accessibilityRole="button"
    >
      <View
        style={[
          styles.addButton,
          { backgroundColor: theme.colors.palette.primary400 },
          focused && styles.addButtonFocused,
        ]}
      >
        <Ionicons name="add" size={38} color="#fff" />
      </View>
    </TouchableOpacity>
  )
}

export function BottomTabNavigator() {
  const { theme } = useAppTheme()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 80,
          position: "absolute",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: theme.colors.palette.neutral900,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = ""
          let IconComponent = Ionicons
          let iconSize = 24
          switch (route.name) {
            case "Home":
              iconName = "home-outline"
              break
            case "Search":
              iconName = "search-outline"
              break
            case "Add":
              iconName = "add"
              iconSize = 38
              break
            case "Groups":
              IconComponent = MaterialCommunityIcons
              iconName = "account-group-outline"
              break
            case "Profile":
              iconName = "person-outline"
              break
            default:
              break
          }
          if (route.name === "Add") {
            return (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: focused ? theme.colors.palette.accent400 : "#fff",
                    width: 64,
                    height: 64,
                    backgroundColor: theme.colors.palette.primary400,
                    shadowColor: focused ? theme.colors.palette.accent400 : undefined,
                    shadowOffset: focused ? { width: 0, height: 0 } : undefined,
                    shadowOpacity: focused ? 0.6 : 0,
                    shadowRadius: focused ? 10 : 0,
                  }}
                >
                  <Ionicons name="add" size={38} color="#fff" />
                </View>
              </View>
            )
          }
          return (
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
              <IconComponent name={iconName} size={iconSize} color={color} />
            </View>
          )
        },
        tabBarLabel: ({ focused, color }) => {
          let label = route.name
          if (route.name === "Add") {
            return (
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: theme.colors.palette.primary400, textAlign: "center" }}>Add</Text>
            )
          }
          return (
            <Text style={{ fontSize: 12, fontWeight: focused ? "700" : "500", color, textAlign: "center", marginTop: 2 }}>{label}</Text>
          )
        },
        tabBarActiveTintColor: theme.colors.palette.primary400,
        tabBarInactiveTintColor: theme.colors.textDim,
      })}
    >
      <Tab.Screen name="Home" children={() => <PlaceholderScreen label="Home" />} />
      <Tab.Screen name="Search" children={() => <PlaceholderScreen label="Search" />} />
      <Tab.Screen
        name="Add"
        children={() => null}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add"
              activeOpacity={0.85}
              onPress={props.onPress}
              style={{
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                top: -32,
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: "transparent",
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 32,
                  borderWidth: 4,
                  borderColor: props.accessibilityState?.selected ? theme.colors.palette.accent400 : "#fff",
                  width: 64,
                  height: 64,
                  backgroundColor: theme.colors.palette.primary400,
                  shadowColor: props.accessibilityState?.selected ? theme.colors.palette.accent400 : undefined,
                  shadowOffset: props.accessibilityState?.selected ? { width: 0, height: 0 } : undefined,
                  shadowOpacity: props.accessibilityState?.selected ? 0.6 : 0,
                  shadowRadius: props.accessibilityState?.selected ? 10 : 0,
                }}
              >
                <Ionicons name="add" size={38} color="#fff" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: theme.colors.palette.primary400, textAlign: "center" }}>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen name="Groups" children={() => <PlaceholderScreen label="Groups" />} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    borderColor: "#fff",
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  addButtonContainer: {
    alignSelf: "center",
    elevation: 20,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    top: -32,
    zIndex: 10,
  },
  addButtonFocused: {
    borderColor: "#FFD45C",
    borderWidth: 4,
  },
  tabBarBackground: {
    ...Platform.select({
      ios: {
        height: 80,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      },
      android: {
        height: 80,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      },
    }),
    bottom: 0,
    left: 0,
    position: "absolute",
    width: "100%",
  },
})
