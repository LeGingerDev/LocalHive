import { StyleSheet, View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Redirect } from "expo-router";

// Main app layout with bottom tabs
export default function AppLayout() {
  const { theme, isDarkMode } = useTheme();
  const { user, loading } = useAuth();
  
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
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: isDarkMode ? '#888' : '#999',
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
            tabBarIcon: ({ color, size, focused }) => (
              <View style={styles.addButton}>
                <Ionicons 
                  name={focused ? "add-circle" : "add-circle-outline"} 
                  size={size + 12} 
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    marginBottom: -4,
  },
}); 