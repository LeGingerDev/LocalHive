import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Calculate top padding to account for status bar height
  const statusBarHeight = Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  
  return (
    <LinearGradient
      colors={['#6a5acd', '#836FFF']}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, { paddingTop: statusBarHeight }]}>
        <View style={styles.content}>
          {/* App Logo */}
          <Image 
            source={require('../assets/local-hive-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          {/* App Title and Subtitle */}
          <Text style={styles.title}>Local Hive</Text>
          <Text style={styles.subtitle}>Build shared local knowledge with your group</Text>
          
          {/* Sign In Options */}
          <View style={styles.buttonContainer}>
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
          </View>
          
          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Link href="/signin" style={styles.signInLink}>Sign In</Link>
          </View>
          
          {/* Features List */}
          <View style={styles.featuresContainer}>
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
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 20,
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