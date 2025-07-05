import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const GradientBackground = ({ 
  children, 
  style, 
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  const { isDarkMode } = useTheme();
  
  // Default gradient colors based on theme
  const defaultColors = isDarkMode 
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue
  
  const gradientColors = colors || defaultColors;
  
  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.gradient, style]}
      start={start}
      end={end}
      shouldRasterizeIOS={true}
      renderToHardwareTextureAndroid={true}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default GradientBackground; 