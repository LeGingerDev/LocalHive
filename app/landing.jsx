import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, Image, Animated } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import GradientBackground from '../components/GradientBackground';

const Landing = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  // Animation values
  const fadeAnim = {
    logo: useRef(new Animated.Value(0)).current,
    title: useRef(new Animated.Value(0)).current,
    subtitle: useRef(new Animated.Value(0)).current,
    buttons: useRef(new Animated.Value(0)).current,
    signIn: useRef(new Animated.Value(0)).current,
    features: useRef(new Animated.Value(0)).current,
  };
  
  // Scale animation for logo
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Create a staggered animation sequence
    Animated.stagger(150, [
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
      
      // Title fade in
      Animated.timing(fadeAnim.title, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      // Subtitle fade in
      Animated.timing(fadeAnim.subtitle, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      // Buttons fade in
      Animated.timing(fadeAnim.buttons, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      
      // Sign in link fade in
      Animated.timing(fadeAnim.signIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // Features fade in
      Animated.timing(fadeAnim.features, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate top padding to account for status bar height
  const statusBarHeight = Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  
  // Define gradient colors based on theme
  const gradientColors = isDarkMode
    ? ['#7928CA', '#221C35', '#003366'] // Dark theme gradient - purple to deep blue
    : ['#9900FF', '#5E17EB', '#0066FF']; // Light theme gradient - vibrant purple to blue
  
  return (
    <GradientBackground
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={[styles.safeArea, { paddingTop: statusBarHeight }]}>
        <View style={styles.content}>
          {/* App Logo */}
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
          
          {/* App Title and Subtitle */}
          <Animated.Text style={[styles.title, { opacity: fadeAnim.title }]}>
            Local Hive
          </Animated.Text>
          
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim.subtitle }]}>
            Build shared local knowledge with your group
          </Animated.Text>
          
          {/* Sign In Options */}
          <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim.buttons }]}>
            {/* Google Button */}
            <TouchableOpacity style={styles.googleButton}>
              <AntDesign name="google" size={20} color="black" style={styles.buttonIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            {/* Apple Button */}
            <TouchableOpacity style={styles.appleButton}>
              <AntDesign name="apple1" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
            
            {/* Email Button */}
            <TouchableOpacity 
              style={styles.emailButton}
              onPress={() => router.push("/email-signup")}
            >
              <MaterialIcons name="email" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Sign In Link */}
          <Animated.View style={[styles.signInContainer, { opacity: fadeAnim.signIn }]}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Link href="/signin" style={styles.signInLink}>Sign In</Link>
          </Animated.View>
          
          {/* Features List */}
          <Animated.View style={[styles.featuresContainer, { opacity: fadeAnim.features }]}>
            <View style={styles.featureItem}>
              <AntDesign name="search1" size={18} color="white" style={styles.featureIcon} />
              <Text style={styles.featureText}>AI-powered smart search</Text>
            </View>
            
            <View style={styles.featureItem}>
              <FontAwesome name="group" size={18} color="white" style={styles.featureIcon} />
              <Text style={styles.featureText}>Share knowledge with your group</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="location" size={18} color="white" style={styles.featureIcon} />
              <Text style={styles.featureText}>Discover local gems together</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 130,
    height: 130,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 16,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  signInText: {
    color: 'white',
    opacity: 0.9,
  },
  signInLink: {
    color: 'white',
    fontWeight: 'bold',
  },
  featuresContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    color: 'white',
    fontSize: 15,
  },
});

export default Landing; 