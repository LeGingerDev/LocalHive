import { useEffect, useRef, useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Dimensions,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import Feather from "react-native-vector-icons/Feather"
import FontAwesome from "react-native-vector-icons/FontAwesome"

import { CustomGradient } from "@/components/CustomGradient"
import { RoundedButton } from "@/components/RoundedButton"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import googleAuthService from "@/services/supabase/googleAuthService"
import { hideNavigationBar } from "@/utils/navigationBarUtils"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

// Get screen dimensions
const { height } = Dimensions.get("window")

// Custom icons for auth providers
const GoogleIcon = () => (
  <View style={styles.iconContainer}>
    <FontAwesome name="google" size={20} color="#4285F4" />
  </View>
)

const AppleIcon = () => (
  <View style={styles.iconContainer}>
    <FontAwesome name="apple" size={22} color="white" />
  </View>
)

const EmailIcon = () => (
  <View style={styles.iconContainer}>
    <Feather name="mail" size={20} color="white" />
  </View>
)

// Outline icons for features
const SearchIcon = () => <Feather name="search" size={18} color="white" />

const ShareIcon = () => <Feather name="share-2" size={18} color="white" />

const DiscoverIcon = () => <Feather name="map-pin" size={18} color="white" />

export const LandingScreen = () => {
  const $containerInsets = useSafeAreaInsetsStyle(["top", "bottom"])
  const navigation = useNavigation<any>()
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

  // Animation for fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(20)).current

  // Hide navigation bar when landing screen mounts
  useEffect(() => {
    hideNavigationBar()
  }, [])

  // Fade in animation when screen mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start()
  }, [fadeAnim, translateYAnim])

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return // Prevent multiple sign-in attempts

    setIsGoogleSigningIn(true)
    try {
      const result = await googleAuthService.signInWithGoogle()

      if (result.success) {
        // Navigate to home screen on successful authentication
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      } else {
        // Handle different error cases
        if (result.error === "CANCELLED") {
          // User cancelled the sign-in, no need to show error
          return
        } else if (result.error === "PLAY_SERVICES_NOT_AVAILABLE") {
          Alert.alert(
            "Google Play Services Required",
            "Please update Google Play Services to use Google Sign-In.",
            [{ text: "OK" }],
          )
        } else {
          Alert.alert(
            "Sign-In Failed",
            result.message || "An error occurred during sign-in. Please try again.",
            [{ text: "OK" }],
          )
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      Alert.alert("Sign-In Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ])
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  const handleEmailSignIn = () => {
    navigation.navigate("Login")
  }

  const handleSignUp = () => {
    navigation.navigate("SignUp")
  }

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <CustomGradient
        preset="primary"
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.spacer} />
        <Animated.View
          style={[
            styles.content,
            $containerInsets,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* App Title and Tagline */}
          <Text style={styles.title}>Local Hive</Text>
          <Text style={styles.subtitle}>Build shared local knowledge with{"\n"}your group</Text>

          {/* Auth Buttons */}
          <View style={styles.authContainer}>
            {/* Google Sign In */}
            <View style={styles.buttonWrapper}>
              <GoogleIcon />
              <RoundedButton
                text={isGoogleSigningIn ? "Signing in..." : "Sign in with Google"}
                preset="google"
                onPress={handleGoogleSignIn}
                style={styles.authButton}
                loading={isGoogleSigningIn}
                disabled={isGoogleSigningIn}
              />
            </View>

            {/* Apple Sign In */}
            <View style={styles.buttonWrapper}>
              <AppleIcon />
              <RoundedButton
                text="Sign in with Apple"
                preset="apple"
                onPress={handleEmailSignIn}
                style={styles.authButton}
                disabled={isGoogleSigningIn}
              />
            </View>

            {/* Email Sign In */}
            <View style={styles.buttonWrapper}>
              <EmailIcon />
              <RoundedButton
                text="Sign in with Email"
                preset="email"
                onPress={handleEmailSignIn}
                style={styles.authButton}
                disabled={isGoogleSigningIn}
              />
            </View>
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity style={styles.signInLink} onPress={handleSignUp}>
            <Text style={styles.signInText}>
              Not got an account? <Text style={styles.signInBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <SearchIcon />
                </View>
              </View>
              <Text style={styles.featureText}>AI-powered smart search</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <ShareIcon />
                </View>
              </View>
              <Text style={styles.featureText}>Share knowledge with your group</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <DiscoverIcon />
                </View>
              </View>
              <Text style={styles.featureText}>Discover local gems together</Text>
            </View>
          </View>
        </Animated.View>
      </CustomGradient>
    </Screen>
  )
}

const styles = StyleSheet.create({
  authButton: {
    paddingLeft: 45, // Add space for the icon
  },
  authContainer: {
    marginBottom: 16,
    width: "100%",
  },
  background: {
    flex: 1,
  },
  buttonWrapper: {
    marginBottom: 12,
    position: "relative",
    width: "100%",
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Lighter background for outline icons
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureIconContainer: {
    marginRight: 12,
  },
  featureItem: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  featuresList: {
    marginBottom: 30,
    marginTop: "auto",
    width: "100%", // Increased margin to raise features from bottom
  },
  iconContainer: {
    position: "absolute",
    left: 16,
    top: 16, // Adjusted for taller buttons
    zIndex: 1,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: 40,
    width: 40,
  },
  logoBox: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 3,
    height: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 80,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  signInBold: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  signInLink: {
    marginBottom: 40,
    marginTop: 12,
  },
  signInText: {
    color: "white",
    fontSize: 14,
  },
  spacer: {
    height: height * 0.15, // 15% of screen height as top spacing
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
    textAlign: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
})
