import { StyleSheet, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import GradientBackground from "../../components/GradientBackground";

// Auth layout for landing, signin, and signup screens
export default function AuthLayout() {
  const { theme, isDarkMode } = useTheme();
  
  // Define gradient colors for auth screens
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue
  
  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <GradientBackground
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.absoluteFill}
      />
      
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: 'transparent',
          },
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: true,
          animation: "fade",
          animationDuration: 150,
        }}
      >
        <Stack.Screen 
          name="landing" 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="signin" 
          options={{ 
            title: "",
            animation: "slide_from_right" 
          }} 
        />
        <Stack.Screen 
          name="email-signup" 
          options={{ 
            title: "",
            animation: "slide_from_right" 
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
}); 