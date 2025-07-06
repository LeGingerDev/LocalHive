import React, { useEffect } from 'react';
import { Platform, StatusBar, UIManager, findNodeHandle } from 'react-native';
import { useNavigation } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Component to enable immersive mode on Android
 * This hides the navigation bar and makes it only appear on swipe
 */
const ImmersiveMode = ({ children }) => {
  const navigation = useNavigation();

  useEffect(() => {
    const setupImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        // Force immersive mode more aggressively
        try {
          // Hide the navigation bar
          await NavigationBar.setVisibilityAsync('hidden');
          
          // Make it transparent
          await NavigationBar.setBackgroundColorAsync('transparent');
          
          // Set behavior to show on swipe
          await NavigationBar.setBehaviorAsync('inset-swipe');

          // Apply these settings repeatedly to ensure they take effect
          const interval = setInterval(async () => {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBackgroundColorAsync('transparent');
          }, 1000);

          return () => clearInterval(interval);
        } catch (error) {
          console.log('Navigation bar customization error:', error);
        }
      }
    };

    setupImmersiveMode();

    // Reset when component unmounts
    return () => {
      if (Platform.OS === 'android') {
        // Don't restore visibility on unmount - we want to keep immersive mode
      }
    };
  }, []);

  return <>{children}</>;
};

export default ImmersiveMode; 