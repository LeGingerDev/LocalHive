import { useEffect, useRef } from "react"
import { View, StyleSheet, StatusBar, Animated, Easing } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { CustomGradient } from "@/components/CustomGradient"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AuthService } from "@/services/supabase/authService"
import googleAuthService from "@/services/supabase/googleAuthService"
import { hideNavigationBar } from "@/utils/navigationBarUtils"

export const SplashScreen = () => {
  const navigation = useNavigation<any>()

  // Animation values for the dots
  const dot1Animation = useRef(new Animated.Value(0.5)).current
  const dot2Animation = useRef(new Animated.Value(0.5)).current
  const dot3Animation = useRef(new Animated.Value(0.5)).current

  // Animation values for logo and text only
  const logoFadeAnim = useRef(new Animated.Value(0)).current
  const logoTranslateYAnim = useRef(new Animated.Value(20)).current

  // Hide navigation bar as soon as splash screen mounts
  useEffect(() => {
    hideNavigationBar()
  }, [])

  // Start the fade-in/rise animation for logo and text only
  useEffect(() => {
    Animated.parallel([
      // Logo and text fade in and rise
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(logoTranslateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start()
  }, [logoFadeAnim, logoTranslateYAnim])

  // Start the animation sequence for the dots
  useEffect(() => {
    const animateDots = () => {
      // Reset animations
      dot1Animation.setValue(0.5)
      dot2Animation.setValue(0.5)
      dot3Animation.setValue(0.5)

      // Create animation sequence
      Animated.stagger(150, [
        // Animate all dots in a staggered sequence
        Animated.timing(dot1Animation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(dot2Animation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(dot3Animation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      ]).start(() => {
        // After all dots are animated, fade them out together
        Animated.parallel([
          Animated.timing(dot1Animation, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          Animated.timing(dot2Animation, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          Animated.timing(dot3Animation, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        ]).start(() => {
          // Restart the animation
          animateDots()
        })
      })
    }

    // Start the animation
    animateDots()

    // Clean up animation when component unmounts
    return () => {
      dot1Animation.stopAnimation()
      dot2Animation.stopAnimation()
      dot3Animation.stopAnimation()
    }
  }, [dot1Animation, dot2Animation, dot3Animation])

  useEffect(() => {
    // Check for existing session and navigate accordingly
    const checkAuthAndNavigate = async () => {
      try {
        // First check for Supabase session - this is the primary source of truth
        const { session } = await AuthService.getSession()

        // Only check Google Auth if Supabase doesn't have a session
        let googleAuthResult = { isAuthenticated: false }
        if (!session) {
          googleAuthResult = await googleAuthService.checkExistingSignIn()
        }

        // Check if user is authenticated
        const isAuthenticated = !!session || googleAuthResult.isAuthenticated

        if (isAuthenticated) {
          // Skip splash entirely for authenticated users - go straight to main app
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "Main",
                state: {
                  routes: [{ name: "Home" }],
                },
              },
            ],
            key: undefined,
          })
          return undefined // Explicit return for authenticated users
        } else {
          // For new users, show splash for minimum branding time (1.5 seconds)
          const timer = setTimeout(() => {
            // Fade out animation for logo and text only
            Animated.parallel([
              Animated.timing(logoFadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
              Animated.timing(logoTranslateYAnim, {
                toValue: -20,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
            ]).start(() => {
              // Hide navigation bar again before navigating
              hideNavigationBar().then(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "OnboardingEntry" }],
                  key: undefined,
                })
              })
            })
          }, 1500) // Reduced from 3.5 seconds to 1.5 seconds

          return () => clearTimeout(timer)
        }
      } catch (error) {
        console.error("Error checking authentication status:", error)
        // Fallback to onboarding entry page if there's an error
        const timer = setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "OnboardingEntry" }],
            key: undefined,
          })
        }, 1500) // Reduced from 3.5 seconds to 1.5 seconds

        return () => clearTimeout(timer)
      }
    }

    checkAuthAndNavigate()
  }, [navigation, logoFadeAnim, logoTranslateYAnim])

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <CustomGradient
        preset="primary"
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Logo and text - animated */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFadeAnim,
              transform: [{ translateY: logoTranslateYAnim }],
            },
          ]}
        >
          <View style={styles.logoBox}>
            <View style={styles.logo}>
              <View style={styles.logoInner} />
            </View>
          </View>
          <Text style={styles.title}>Visu</Text>
          <Text style={styles.subtitle}>See what you need, share what you know.</Text>
          <Text style={styles.description}>Building communities together</Text>
        </Animated.View>

        {/* Animated dots indicator - not animated with fade/translate */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[styles.dot, { opacity: dot1Animation, transform: [{ scale: dot1Animation }] }]}
          />
          <Animated.View
            style={[styles.dot, { opacity: dot2Animation, transform: [{ scale: dot2Animation }] }]}
          />
          <Animated.View
            style={[styles.dot, { opacity: dot3Animation, transform: [{ scale: dot3Animation }] }]}
          />
        </View>

        {/* Version - not animated */}
        <Text style={styles.version}>Version 1.0</Text>
      </CustomGradient>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
  },
  dot: {
    backgroundColor: "white",
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  dotsContainer: {
    bottom: 100,
    flexDirection: "row",
    position: "absolute",
  },
  gradient: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  logo: {
    alignItems: "center",
    backgroundColor: "#7727c3",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    width: 40,
  },
  logoBox: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    height: 80,
    justifyContent: "center",
    marginBottom: 20,
    width: 80,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    backgroundColor: "#003161",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
  },
  version: {
    bottom: 30,
    color: "white",
    fontSize: 12,
    opacity: 0.7,
    position: "absolute",
  },
})
