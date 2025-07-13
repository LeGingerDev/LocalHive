import { useEffect, useRef, useState } from "react"
import { View, StyleSheet, Animated, Easing, Image, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import FontAwesome from "react-native-vector-icons/FontAwesome"

import { CustomAlert } from "@/components/Alert/CustomAlert"
import { CustomGradient } from "@/components/CustomGradient"
import { RoundedButton } from "@/components/RoundedButton"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
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

export const LandingScreen = () => {
  const navigation = useNavigation<any>()
  const { refreshUser } = useAuth()
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(50)).current
  const $containerInsets = useSafeAreaInsetsStyle(["top", "bottom"])

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertConfirmStyle, setAlertConfirmStyle] = useState<"default" | "destructive" | "success">("default")

  useEffect(() => {
    hideNavigationBar()
    // Animate content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, translateYAnim])

  const showAlert = (
    title: string,
    message: string,
    confirmStyle: "default" | "destructive" | "success" = "default"
  ) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertConfirmStyle(confirmStyle)
    setAlertVisible(true)
  }

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return

    setIsGoogleSigningIn(true)
    try {
      const result = await googleAuthService.signInWithGoogle()

      if (result.success) {
        // Refresh user state to ensure it's properly updated
        await refreshUser()

        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        })
      } else {
        if (result.error === "CANCELLED") {
          return
        } else if (result.error === "PLAY_SERVICES_NOT_AVAILABLE") {
          showAlert(
            "Google Play Services Required",
            "Please update Google Play Services to use Google Sign-In."
          )
        } else {
          showAlert(
            "Sign-In Failed",
            result.message || "An error occurred during sign-in. Please try again."
          )
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      showAlert("Sign-In Error", "An unexpected error occurred. Please try again.")
    } finally {
      setIsGoogleSigningIn(false)
    }
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
                source={require("@assets/images/logo.png")}
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
                onPress={() => {}}
                style={styles.authButton}
                disabled={isGoogleSigningIn}
              />
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <FontAwesome name="users" size={16} color="white" />
                </View>
              </View>
              <Text style={styles.featureText}>Connect with your local community</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <FontAwesome name="lightbulb-o" size={16} color="white" />
                </View>
              </View>
              <Text style={styles.featureText}>Share knowledge and insights</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <View style={styles.featureIconCircle}>
                  <FontAwesome name="map-marker" size={16} color="white" />
                </View>
              </View>
              <Text style={styles.featureText}>Discover local resources and events</Text>
            </View>
          </View>
        </Animated.View>
      </CustomGradient>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        confirmStyle={alertConfirmStyle}
        onConfirm={() => setAlertVisible(false)}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  authButton: {
    paddingLeft: 45,
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
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
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
    width: "100%",
  },
  iconContainer: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    top: 16,
    width: 24,
    zIndex: 1,
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
  spacer: {
    height: height * 0.1,
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
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
})
