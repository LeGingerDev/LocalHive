import React, { useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Text as RNText,
  Animated,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { CustomGradient } from "@/components/CustomGradient"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AnalyticsService } from "@/services/analyticsService"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"
import { typography } from "@/theme/typography"

export const OnboardingEntryScreen = () => {
  const navigation = useNavigation<any>()

  // Animation refs
  const meerkatFloatAnim = useRef(new Animated.Value(0)).current
  const contentFadeAnim = useRef(new Animated.Value(0)).current
  const textSlideAnim = useRef(new Animated.Value(50)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current

  // Start floating animation and track screen view
  useEffect(() => {
    // Track screen view
    AnalyticsService.trackScreenView({ screenName: "OnboardingEntry" })

    // Start floating animation
    const startFloating = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(meerkatFloatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(meerkatFloatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    }

    // Start content animations
    const startContentAnimations = () => {
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()

      // Stagger button animations
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
      }, 400)
    }

    startFloating()
    startContentAnimations()
  }, [meerkatFloatAnim, contentFadeAnim, textSlideAnim, buttonScaleAnim, buttonOpacityAnim])

  const handleGetStarted = () => {
    // Haptic feedback for primary action
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

    // Track analytics event
    AnalyticsService.trackEvent({
      name: "onboarding_started",
      properties: {
        source: "entry_screen",
        action: "get_started",
      },
    })

    // Navigate to slideshow flow
    navigation.navigate("OnboardingSlideshow")
  }

  const handleExistingAccount = () => {
    // Haptic feedback for secondary action
    ReactNativeHapticFeedback.trigger("selection")

    // Track analytics event
    AnalyticsService.trackEvent({
      name: "onboarding_skipped",
      properties: {
        source: "entry_screen",
        action: "existing_account",
      },
    })

    // Navigate to existing account flow (could be a slide-up modal or separate screen)
    navigation.navigate("Landing")
  }

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Gradient Background */}
      <CustomGradient
        preset="custom"
        customColors={["#4A90E2", "#FFFFFF"]} // Blue at top, white at bottom
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration Section */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: contentFadeAnim,
              transform: [
                {
                  translateY: contentFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.meerkatContainer,
              {
                transform: [
                  {
                    translateY: meerkatFloatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10], // Move up 10 pixels
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../../assets/Visu/Visu_Searching_Faded.png")}
              style={styles.meerkatImage}
              resizeMode="contain"
              onError={(error) => console.error("Image loading error:", error)}
            />
          </Animated.View>
        </Animated.View>

        {/* Text Content Section */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: contentFadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.mainHeading}>We've All Been There</Text>
          <RNText style={styles.problemStatement}>
            "Get the usual one," no idea what they mean{" "}
          </RNText>
          <RNText style={styles.valueProposition}>
            Create visual guides so groups <RNText style={styles.boldText}>ALWAYS</RNText> know
            exactly what to get
          </RNText>
        </Animated.View>

        {/* Call-to-Action Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacityAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleExistingAccount}>
            <Text style={styles.secondaryButtonText}>I Already Have An Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  boldText: {
    fontFamily: typography.primary.bold,
  },
  boldTextItalic: {
    fontFamily: typography.primary.bold,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md, // Reduced from lg to md
    justifyContent: "space-between",
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    minHeight: 0, // Ensure flex works properly
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  illustrationContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: spacing.lg,
  },
  mainHeading: {
    color: colors.text,
    fontFamily: typography.primary.bold,
    fontSize: 32,
    lineHeight: 38,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  meerkatContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  meerkatImage: {
    height: 450,
    width: 450,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.palette.primary500,
    borderRadius: 12,
    elevation: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 18,
  },
  problemStatement: {
    color: colors.text,
    flexWrap: "wrap",
    fontFamily: typography.primary.normal,
    fontSize: 18,
    fontStyle: "italic",
    lineHeight: 24,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
    textAlign: "center", // Ensure text wraps properly
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.palette.primary500,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.palette.primary500,
    fontFamily: typography.primary.medium,
    fontSize: 16,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs, // Reduced from sm to xs
    flexShrink: 1, // Allow text container to shrink if needed
  },
  valueProposition: {
    color: colors.text,
    flexWrap: "wrap",
    fontFamily: typography.primary.normal,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center", // Ensure text wraps properly
  },
})
