import React, { useEffect, useState } from "react"
import { View, StyleSheet, StatusBar, TouchableOpacity, Animated, Dimensions, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"
import { LinearGradient } from "expo-linear-gradient"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"
import { spacing } from "@/theme/spacing"
import { AnalyticsService } from "@/services/analyticsService"

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
  const triggerConfetti = () => {
    console.log("🎉 Triggering confetti manually!")
    
    // Haptic feedback for celebration
    ReactNativeHapticFeedback.trigger("notificationSuccess")
    
    // Generate confetti pieces
    const pieces: ConfettiPiece[] = []
    for (let i = 0; i < 30; i++) {
      const piece = {
        id: i,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(-20),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      }
      
      console.log(`🎉 Created piece ${i}:`, {
        id: piece.id,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        scale: piece.scale,
        opacity: piece.opacity,
        color: piece.color
      })
      
      pieces.push(piece)
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
          console.log(`🎉 Piece ${index + 1} properties:`, {
            x: piece.x,
            y: piece.y,
            rotation: piece.rotation,
            scale: piece.scale,
            opacity: piece.opacity
          })
          
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
        total_screens: 4 // Entry, Slideshow, Questionnaire, ThankYou
      }
    })
    
    // Auto-trigger confetti on mount
    setTimeout(() => {
      console.log("🎉 Auto-triggering confetti...")
      triggerConfetti()
    }, 500)
  }, [])

  const handleGetStarted = () => {
    // Haptic feedback for navigation
    ReactNativeHapticFeedback.trigger("selection")
    
    // Track final onboarding action
    AnalyticsService.trackEvent({
      name: "onboarding_final_action",
      properties: {
        action: "get_started",
        destination: "landing_screen"
      }
    })
    
    navigation.navigate("Landing")
  }

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
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
                        outputRange: ['0deg', '360deg'],
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
      <View style={styles.content}>
        {/* Celebration Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require("../../../assets/Visu/Visu_Reading.png")}
            style={styles.celebrationImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>You're All Set!</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Welcome to Visu! We're excited to help you organize and share with your group.
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
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
        </View>
      </View>

      {/* Get Started Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  confettiContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  confettiPiece: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  celebrationImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 32,
    fontFamily: typography.primary.bold,
    color: colors.palette.neutral100,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: typography.primary.normal,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 300,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.palette.neutral100,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  getStartedButton: {
    backgroundColor: colors.palette.neutral100,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    color: colors.palette.primary400,
  },
}) 