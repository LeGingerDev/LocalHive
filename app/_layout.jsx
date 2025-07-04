import { StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Slot, Stack, useRouter } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";

const HeaderLogo = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push("/")}>
      <Image
        source={require("../assets/favicon.png")}
        style={{ width: 24, height: 24, marginRight: 16 }}
      />
    </TouchableOpacity>
  );
};

const StackNavigator = () => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar value="auto" />
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
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ title: "About Page" }} />
        <Stack.Screen name="contact" options={{ title: "Contact Page" }} />
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
