import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, Text, Animated } from 'react-native';
import { useRouter, SplashScreen } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import GradientBackground from '../components/GradientBackground';

// Hide the native splash screen when this component is mounted
SplashScreen.hideAsync().catch(() => {
  // It's okay if this fails
});

const SplashScreenComponent = () => {
  const router = useRouter();
  const { user, loading, rememberMe } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [nextRoute, setNextRoute] = useState('');

  // Animation values
  const fadeAnim = {
    logo: useRef(new Animated.Value(0)).current,
    activity: useRef(new Animated.Value(0)).current,
    text: useRef(new Animated.Value(0)).current,
  };

  // Start fade-in animations when component mounts
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(fadeAnim.logo, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim.activity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim.text, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Determine the next route based on auth state
  useEffect(() => {
    if (!loading) {
      const route = user ? '/' : '/landing';
      setNextRoute(route);
    }
  }, [loading, user]);

  // Handle timing and animation
  useEffect(() => {
    let timeoutId;
    
    if (!loading) {
      // Wait a minimum time to show the splash screen
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 2000); // Show splash for at least 2 seconds
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading]);

  // Handle animation and navigation
  useEffect(() => {
    if (isReady && nextRoute) {
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
        // Navigate after animation completes
        router.replace(nextRoute);
      });
    }
  }, [isReady, nextRoute]);

  // Define gradient colors
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue

  return (
    <View style={styles.container}>
      <GradientBackground
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.absoluteFill}
      />
      
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim.logo, transform: [{ scale: fadeAnim.logo }] }}>
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