import { StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import React, { useEffect } from "react";
import { Slot, Stack, useRouter, usePathname } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from 'expo-navigation-bar';

const HeaderLogo = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push("/")}>
      <Image
        source={require("../assets/local-hive-logo.png")}
        style={{ 
          width: 32, 
          height: 32, 
          marginRight: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
        }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const StackNavigator = () => {
  const { theme } = useTheme();
  const pathname = usePathname();
  
  useEffect(() => {
    // Configure navigation bar on Android
    if (Platform.OS === 'android') {
      // Make navigation bar transparent
      NavigationBar.setBackgroundColorAsync('transparent');
      // Hide navigation bar on landing page
      if (pathname === '/landing') {
        NavigationBar.setVisibilityAsync('hidden');
      } else {
        NavigationBar.setVisibilityAsync('visible');
      }
    }
  }, [pathname]);

  return (
    <>
      <StatusBar style="light" translucent={true} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.backgroundColor,
          },
          headerTintColor: theme.headerTintColor,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerRight: () => <HeaderLogo />,
          contentStyle: {
            backgroundColor: theme.backgroundColor,
          },
          // Add these properties to fix flickering
          cardStyle: { backgroundColor: theme.backgroundColor },
          animationEnabled: true, // Ensures smooth animations
          presentation: "card",
        }}
        initialRouteName="landing"
      >
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ title: "Sign In" }} />
        <Stack.Screen name="email-signup" options={{ title: "Create Account" }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

const RootLayout = () => {
  return (
    <ThemeProvider>
      <StackNavigator />
    </ThemeProvider>
  );
};

export default RootLayout;

const styles = StyleSheet.create({});
