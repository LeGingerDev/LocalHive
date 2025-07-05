import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, Text, Animated } from 'react-native';
import { useRouter, SplashScreen } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import GradientBackground from '../components/GradientBackground';
import { StatusBar } from 'expo-status-bar';

const SplashScreenComponent = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  // Animation values
  const fadeAnim = {
    logo: useRef(new Animated.Value(0)).current,
    activity: useRef(new Animated.Value(0)).current,
    text: useRef(new Animated.Value(0)).current,
  };

  // Scale animation for logo
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Hide the native splash screen when this component is mounted and ready
  useEffect(() => {
    const hideSplash = async () => {
      try {
        // Hide the native splash screen
        await SplashScreen.hideAsync();
        console.log('Native splash screen hidden');
        setNativeSplashHidden(true);
      } catch (e) {
        // It's okay if this fails
        console.log('Error hiding native splash:', e);
        setNativeSplashHidden(true); // Continue anyway
      }
    };
    
    // Small delay to ensure component is mounted before hiding splash
    setTimeout(hideSplash, 100);
  }, []);

  // Start fade-in animations when native splash is hidden
  useEffect(() => {
    if (nativeSplashHidden) {
      console.log('Starting splash animations');
      
      Animated.stagger(200, [
        // Logo animation with scale and fade
        Animated.parallel([
          Animated.timing(fadeAnim.logo, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        
        // Activity indicator fade in
        Animated.timing(fadeAnim.activity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        
        // Text fade in
        Animated.timing(fadeAnim.text, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Wait a minimum time to show the splash screen
      const timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 3000); // Show splash for at least 3 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [nativeSplashHidden]);

  // Handle animation and navigation
  useEffect(() => {
    if (isReady && nativeSplashHidden && !loading) {
      console.log('Splash screen ready, starting exit animations');
      
      // Start fade-out animations
      Animated.parallel([
        Animated.timing(fadeAnim.logo, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim.activity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim.text, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('Navigating after splash screen');
        // Navigate to main app if authenticated, landing if not
        try {
          if (user) {
            console.log('User is authenticated, navigating to main app');
            router.replace('/(app)');
          } else {
            console.log('User is not authenticated, navigating to landing');
            router.replace('/(auth)/landing');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback to landing page
          router.replace('/(auth)/landing');
        }
      });
    }
  }, [isReady, nativeSplashHidden, user, loading, router]);

  // Define gradient colors
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GradientBackground
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.absoluteFill}
      />
      
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: fadeAnim.logo,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Image
            source={require('../assets/local-hive-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeAnim.activity }}>
          <ActivityIndicator
            size="large"
            color="white"
            style={styles.loader}
          />
        </Animated.View>
        
        <Animated.Text style={[styles.loadingText, { opacity: fadeAnim.text }]}>
          Loading...
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7928CA', // Match the native splash background color
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
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
    fontWeight: 'bold',
    color: 'white',
  },
});

export default SplashScreenComponent; 