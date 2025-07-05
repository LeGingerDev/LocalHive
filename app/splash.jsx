import React, { useEffect } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import GradientBackground from '../components/GradientBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
  const router = useRouter();
  const { user, loading, rememberMe } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // Define gradient colors based on theme - same as landing page
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Wait a minimum time to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!loading) {
        // Check if the user is authenticated and remember me is enabled
        if (user) {
          console.log('User is authenticated, remember me:', rememberMe);
          // User is authenticated, go to home screen
          router.replace('/');
        } else {
          console.log('User is not authenticated or remember me is disabled');
          // User is not authenticated, go to landing screen
          router.replace('/landing');
        }
      }
    };

    checkAuthAndNavigate();
  }, [loading, user, router, rememberMe]);

  return (
    <GradientBackground
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/local-hive-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color="white"
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
  },
});

export default SplashScreen; 