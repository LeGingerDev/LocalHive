import { StyleSheet, Image, TouchableOpacity, Platform, View } from "react-native";
import React, { useEffect } from "react";
import { Slot, Stack, useRouter, usePathname } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
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
  const { theme, isDarkMode } = useTheme();
  const pathname = usePathname();
  
  // Set the background color for the entire app
  const backgroundColor = theme.backgroundColor;
  
  useEffect(() => {
    // Configure navigation bar on Android
    if (Platform.OS === 'android') {
      // Make navigation bar match theme background
      NavigationBar.setBackgroundColorAsync(backgroundColor);
      // Hide navigation bar on landing page
      if (pathname === '/landing') {
        NavigationBar.setVisibilityAsync('hidden');
      } else {
        NavigationBar.setVisibilityAsync('visible');
      }
    }
  }, [pathname, backgroundColor]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} translucent={true} />
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
          // Improve transition smoothness
          cardStyle: { backgroundColor: theme.backgroundColor },
          cardOverlayEnabled: true,
          animationEnabled: true,
          presentation: "card",
          animation: "slide_from_right",
          // Prevent white flash during transitions
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
          },
        }}
        initialRouteName="splash"
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ title: "" }} />
        <Stack.Screen name="email-signup" options={{ title: "" }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
    </View>
  );
};

const RootLayout = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StackNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
