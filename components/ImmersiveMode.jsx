import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
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
        // Hide the navigation bar
        await NavigationBar.setVisibilityAsync('hidden');
        
        // Make it transparent
        await NavigationBar.setBackgroundColorAsync('transparent');
        
        // Set behavior to show on swipe
        await NavigationBar.setBehaviorAsync('inset-swipe');
      }
    };

    setupImmersiveMode();

    // Reset when component unmounts
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, []);

  return <>{children}</>;
};

export default ImmersiveMode; 