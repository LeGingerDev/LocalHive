import { StyleSheet, View } from "react-native";
import React from "react";
import { Tabs, usePathname } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Redirect } from "expo-router";
import BottomTabBar from "../../components/BottomTabBar";

// Main app layout with bottom tabs
export default function AppLayout() {
  const { theme, isDarkMode } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Debug current path
  console.log("AppLayout pathname:", pathname);
  
  // If still loading, show nothing
  if (loading) {
    return null;
  }
  
  // If no user, redirect to auth flow
  if (!user) {
    return <Redirect href="/landing" />;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none', // Hide default tab bar since we're using our custom one
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "search" : "search-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarLabel: () => null,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={styles.addButton}>
                <Ionicons 
                  name={focused ? "add-circle" : "add-circle-outline"} 
                  size={size + 18} 
                  color={Colors.primary} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "person-circle" : "person-circle-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>
      
      {/* Add our custom bottom tab bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    marginBottom: -4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 