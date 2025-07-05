import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, Image, Animated } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';

const Landing = () => {
  const { isDarkMode } = useTheme();
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
  
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: statusBarHeight }]}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
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
              source={require('../../assets/local-hive-logo.png')} 
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
        </View>
        
        {/* Spacer to push buttons down */}
        <View style={styles.spacer} />
        
        {/* Sign In Options */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim.buttons }]}>
          {/* Google Button */}
          <Button
            variant="outline"
            style={styles.googleButton}
            textStyle={styles.googleButtonText}
            onPress={() => {}}
            fullWidth
          >
            <View style={styles.buttonContent}>
              <AntDesign name="google" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </Button>
          
          {/* Apple Button */}
          <Button
            variant="outline"
            style={styles.appleButton}
            textStyle={styles.appleButtonText}
            onPress={() => {}}
            fullWidth
          >
            <View style={styles.buttonContent}>
              <AntDesign name="apple1" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </View>
          </Button>
          
          {/* Email Button */}
          <Button
            variant="outline"
            style={styles.emailButton}
            textStyle={styles.emailButtonText}
            onPress={() => router.push("email-signup")}
            fullWidth
          >
            <View style={styles.buttonContent}>
              <MaterialIcons name="email" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </View>
          </Button>
        </Animated.View>
        
        {/* Sign In Link */}
        <Animated.View style={[styles.signInContainer, { opacity: fadeAnim.signIn }]}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <Link href="signin" style={styles.signInLink}>Sign In</Link>
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
  headerSection: {
    alignItems: 'center',
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
    opacity: 0.9,
  },
  spacer: {
    flex: 0.5, // This pushes the buttons down further toward the bottom
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  googleButton: {
    marginBottom: 16,
    borderColor: 'white',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    marginBottom: 16,
    borderColor: 'white',
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emailButton: {
    borderColor: 'white',
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
  },
  signInLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginTop: 'auto',
    marginBottom: 40,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
  },
});

export default Landing; 