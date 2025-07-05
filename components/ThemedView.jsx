import React from "react";
import { View, StyleSheet, Platform, SafeAreaView, StatusBar } from "react-native";
import { useTheme } from "../context/ThemeContext";

// The height of the bottom tab bar (must match the height in BottomTabBar.jsx)
const BOTTOM_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 90 : 80;

// Default top padding to avoid content touching the status bar
const TOP_PADDING = Platform.OS === 'ios' ? 10 : 10;

const ThemedView = ({ 
  children, 
  style, 
  withBottomInset = true,
  withTopInset = true,
  withSafeArea = false,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const Container = withSafeArea ? SafeAreaView : View;
  
  // Calculate top padding based on platform
  const topInset = Platform.OS === 'android' 
    ? TOP_PADDING + (StatusBar.currentHeight || 0) 
    : TOP_PADDING;
  
  return (
    <Container
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor },
        withBottomInset && { paddingBottom: BOTTOM_TAB_BAR_HEIGHT },
        withTopInset && { paddingTop: topInset },
        style,
      ]}
      {...props}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ThemedView;
