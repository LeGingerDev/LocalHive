import React, { useEffect, useState, useRef } from "react"
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AnalyticsService } from "@/services/analyticsService"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"
import { typography } from "@/theme/typography"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface ConfettiPiece {
  id: number
  x: Animated.Value
  y: Animated.Value
  rotation: Animated.Value
  scale: Animated.Value
  opacity: Animated.Value
  color: string
}

const confettiColors = [
  colors.palette.primary400,
  colors.palette.secondary400,
  colors.palette.accent400,
  colors.palette.orange400,
  colors.palette.primary100,
]

export const OnboardingThankYouScreen = () => {
  const navigation = useNavigation<any>()
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])

  // Animation refs
  const contentFadeAnim = useRef(new Animated.Value(0)).current
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current
  const imageRotateAnim = useRef(new Animated.Value(0)).current
  const titleSlideAnim = useRef(new Animated.Value(50)).current
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current
  const featuresAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current

  const triggerConfetti = () => {
    console.log("🎉 Triggering confetti manually!")

    // Haptic feedback for celebration
    ReactNativeHapticFeedback.trigger("notificationSuccess")

    // Generate confetti pieces
    const pieces: ConfettiPiece[] = []
    for (let i = 0; i < 30; i++) {
      pieces.push({
        id: i,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(-20),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      })
    }

    console.log(`🎉 Generated ${pieces.length} confetti pieces`)
    setConfettiPieces(pieces)

    // Animate confetti
    setTimeout(() => {
      console.log("🎉 Starting confetti animations...")

      pieces.forEach((piece, index) => {
        const delay = index * 50 // Stagger the animations

        setTimeout(() => {
          console.log(`🎉 Animating piece ${index + 1}/${pieces.length}`)

          // Create parallel animations
          const animations = [
            // Fall down
            Animated.timing(piece.y, {
              toValue: screenHeight + 100,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            // Rotate
            Animated.timing(piece.rotation, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            // Scale up then down
            Animated.sequence([
              Animated.timing(piece.scale, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(piece.scale, {
                toValue: 0,
                duration: 2000,
                delay: 1000,
                useNativeDriver: true,
              }),
            ]),
            // Fade out
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: 3000,
              delay: 2000,
              useNativeDriver: true,
            }),
          ]

          Animated.parallel(animations).start(() => {
            console.log(`🎉 Animation completed for piece ${index + 1}`)
          })
        }, delay)
      })
    }, 100)
  }

  useEffect(() => {
    console.log("🎉 OnboardingThankYouScreen mounted")

    // Track screen view
    AnalyticsService.trackScreenView({ screenName: "OnboardingThankYou" })

    // Track onboarding completion
    AnalyticsService.trackEvent({
      name: "onboarding_completed",
      properties: {
        completion_time: Date.now(),
        total_screens: 4, // Entry, Slideshow, Questionnaire, ThankYou
      },
    })

    // Start content animations
    const startContentAnimations = () => {
      // Animate content fade in
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()

      // Animate image with bounce effect
      Animated.sequence([
        Animated.timing(imageScaleAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(imageScaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Animate image rotation
      Animated.timing(imageRotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // After rotation completes, animate back to center
        Animated.timing(imageRotateAnim, {
          toValue: 0.5, // Center position (0.5 = no rotation)
          duration: 500,
          useNativeDriver: true,
        }).start()
      })

      // Animate title slide in
      setTimeout(() => {
        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start()
      }, 200)

      // Animate subtitle fade in
      setTimeout(() => {
        Animated.timing(subtitleFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      }, 400)

      // Animate features
      setTimeout(() => {
        Animated.timing(featuresAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start()
      }, 600)

      // Animate button
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start()
      }, 800)
    }

    // Start animations after a short delay
    setTimeout(() => {
      startContentAnimations()
    }, 300)

    // Auto-trigger confetti on mount
    setTimeout(() => {
      console.log("🎉 Auto-triggering confetti...")
      triggerConfetti()
    }, 500)
  }, [
    contentFadeAnim,
    imageScaleAnim,
    imageRotateAnim,
    titleSlideAnim,
    subtitleFadeAnim,
    featuresAnim,
    buttonScaleAnim,
    buttonOpacityAnim,
  ])

  const handleGetStarted = () => {
    // Haptic feedback for navigation
    ReactNativeHapticFeedback.trigger("selection")

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    // Track final onboarding action
    AnalyticsService.trackEvent({
      name: "onboarding_final_action",
      properties: {
        action: "get_started",
        destination: "landing_screen",
      },
    })

    navigation.navigate("Landing")
  }

  return (
    <Screen preset="scroll" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.palette.primary400, colors.palette.primary500]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Confetti */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiPieces.map((piece) => {
          // Safety check to ensure all Animated.Value properties exist
          if (!piece.x || !piece.y || !piece.rotation || !piece.scale || !piece.opacity) {
            console.log(`🎉 Skipping piece ${piece.id} - missing Animated.Value properties`)
            return null
          }

          return (
            <Animated.View
              key={piece.id}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: piece.color,
                  transform: [
                    { translateX: piece.x },
                    { translateY: piece.y },
                    {
                      rotate: piece.rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                    { scale: piece.scale },
                  ],
                  opacity: piece.opacity,
                },
              ]}
            />
          )
        })}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentFadeAnim,
          },
        ]}
      >
        {/* Celebration Image */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { scale: imageScaleAnim },
                {
                  rotate: imageRotateAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ["-5deg", "0deg", "5deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require("../../../assets/Visu/Visu_Reading.png")}
            style={styles.celebrationImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              transform: [{ translateY: titleSlideAnim }],
            },
          ]}
        >
          You're All Set!
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleFadeAnim,
            },
          ]}
        >
          Welcome to Visu! We're excited to help you organize and share with your group.
        </Animated.Text>

        {/* Features List */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: featuresAnim,
              transform: [
                {
                  translateY: featuresAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Snap photos to catalog items instantly</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureText}>Find anything with AI-powered search</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Share catalogs with your group</Text>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacityAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  celebrationImage: {
    height: "100%",
    width: "100%",
  },
  confettiContainer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 999,
  },
  confettiPiece: {
    borderRadius: 5,
    height: 10,
    position: "absolute",
    width: 10,
  },
  container: {
    minHeight: screenHeight,
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  featureItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  featureText: {
    color: colors.palette.neutral100,
    flex: 1,
    fontFamily: typography.primary.medium,
    fontSize: 16,
  },
  featuresContainer: {
    gap: spacing.md,
    maxWidth: 300,
    width: "100%",
  },
  getStartedButton: {
    alignItems: "center",
    backgroundColor: colors.palette.neutral100,
    borderRadius: 12,
    elevation: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  getStartedButtonText: {
    color: colors.palette.primary400,
    fontFamily: typography.primary.bold,
    fontSize: 18,
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  imageContainer: {
    alignItems: "center",
    height: 250,
    justifyContent: "center",
    marginBottom: spacing.xl,
    marginTop: 50,
    width: "100%",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: typography.primary.normal,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    textAlign: "center",
  },
  title: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 32,
    marginBottom: spacing.md,
    textAlign: "center",
  },
})
