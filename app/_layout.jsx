import { StyleSheet, Image, TouchableOpacity, Platform, View } from "react-native";
import React, { useEffect, useRef } from "react";
import { Slot, Stack, useRouter, usePathname } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from 'expo-navigation-bar';
import GradientBackground from "../components/GradientBackground";
import BottomTabBar from "../components/BottomTabBar";

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
  const router = useRouter();
  const pathname = usePathname();
  
  // Set the background color for the entire app
  const backgroundColor = theme.backgroundColor;
  
  // Check if current screen is splash, landing, or auth screen
  const isGradientScreen = pathname === '/splash' || pathname === '/landing' || 
                          pathname === '/signin' || pathname === '/email-signup';
  const isAuthScreen = pathname === '/splash' || pathname === '/landing' || 
                      pathname === '/signin' || pathname === '/email-signup';
  
  // Check if current screen is a tab screen
  const isTabScreen = pathname === '/' || pathname === '/search' || 
                     pathname === '/add' || pathname === '/groups' || 
                     pathname === '/profile';
  
  // Check if current screen is the splash screen
  const isSplashScreen = pathname === '/splash';
  
  useEffect(() => {
    // Configure navigation bar on Android
    if (Platform.OS === 'android') {
      try {
        // Set button style based on theme
        NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
      } catch (error) {
        console.log('Navigation bar customization error:', error);
      }
    }
  }, [isDarkMode]);

  // Define gradient colors for splash and landing screens
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue

  // For splash screen, use a simplified layout
  if (isSplashScreen) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Slot />
      </View>
    );
  }
  
  // Use Slot for tab navigation to avoid animation issues
  if (isTabScreen) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={[styles.container, { backgroundColor }]}>
          <Slot />
          <BottomTabBar />
        </View>
      </View>
    );
  }
  
  // Use Stack for auth screens and other non-tab screens
  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[
        styles.container, 
        { backgroundColor: isGradientScreen ? 'transparent' : backgroundColor }
      ]}>
        {isGradientScreen && (
          <GradientBackground
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.absoluteFill}
          />
        )}
        
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: isGradientScreen ? 'transparent' : theme.backgroundColor,
            },
            headerTintColor: theme.headerTintColor,
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "600",
            },
            headerRight: () => <HeaderLogo />,
            contentStyle: {
              backgroundColor: isGradientScreen ? 'transparent' : theme.backgroundColor,
            },
            cardStyle: { backgroundColor: isGradientScreen ? 'transparent' : theme.backgroundColor },
            cardOverlayEnabled: true,
            animation: "fade",
            animationDuration: 150,
          }}
          initialRouteName="splash"
        >
          <Stack.Screen 
            name="splash" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="landing" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen name="signin" options={{ title: "", animation: "slide_from_right" }} />
          <Stack.Screen name="email-signup" options={{ title: "", animation: "slide_from_right" }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ title: "" }} />
          <Stack.Screen name="search" options={{ title: "" }} />
          <Stack.Screen name="add" options={{ title: "" }} />
          <Stack.Screen name="groups" options={{ title: "" }} />
        </Stack>
      </View>
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
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
