import { useEffect } from 'react';
import { LogBox, AppState, Platform } from 'react-native';
import { SplashScreen } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync().catch(() => {
  // If this fails, it's okay to proceed
  console.log('SplashScreen.preventAutoHideAsync() failed');
});

// Ignore specific warnings that are not relevant
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed from React Native',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  '`setBackgroundColorAsync` is not supported with edge-to-edge enabled',
  '`setBehaviorAsync` is not supported with edge-to-edge enabled',
]);

export default function App({ children }) {
  useEffect(() => {
    // We'll let the splash.jsx component handle hiding the native splash screen
    // This ensures a smooth transition from native splash to our custom splash
    
    // Configure navigation bar on Android
    if (Platform.OS === 'android') {
      try {
        // Make navigation bar transparent to match our splash screen
        NavigationBar.setBackgroundColorAsync('transparent').catch(() => {});
        NavigationBar.setButtonStyleAsync('light').catch(() => {});
      } catch (error) {
        console.log('Navigation bar customization error:', error);
      }
    }
    
    // App state change listener to improve stability
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to the foreground
        // You can add additional logic here if needed
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Return the children without any additional wrappers
  return children;
} 