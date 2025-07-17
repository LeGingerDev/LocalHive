import React, { useEffect, useRef } from "react"
import { View, StyleSheet, StatusBar, TouchableOpacity, Image, Text as RNText, Animated } from "react-native"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { CustomGradient } from "@/components/CustomGradient"
import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"
import { spacing } from "@/theme/spacing"
import { AnalyticsService } from "@/services/analyticsService"

export const OnboardingEntryScreen = () => {
  const navigation = useNavigation<any>()
  

  
  // Animation for floating meerkat
  const meerkatFloatAnim = useRef(new Animated.Value(0)).current

  // Start floating animation and track screen view
  useEffect(() => {
    // Track screen view
    AnalyticsService.trackScreenView({ screenName: "OnboardingEntry" })
    
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
        ])
      ).start()
    }

    startFloating()
  }, [meerkatFloatAnim])

  const handleGetStarted = () => {
    // Haptic feedback for primary action
    ReactNativeHapticFeedback.trigger("selection")
    
    // Track analytics event
    AnalyticsService.trackEvent({
      name: "onboarding_started",
      properties: {
        source: "entry_screen",
        action: "get_started"
      }
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
        action: "existing_account"
      }
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
        <View style={styles.illustrationContainer}>
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
        </View>

        {/* Text Content Section */}
        <View style={styles.textContainer}>
          <Text style={styles.mainHeading}>We've All Been There</Text>
          <RNText style={styles.problemStatement}>"Get the usual one," no idea what they mean </RNText>
          <RNText style={styles.valueProposition}>
            Create visual guides so groups <RNText style={styles.boldText}>ALWAYS</RNText> know exactly what to get
          </RNText>
        </View>

        {/* Call-to-Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleExistingAccount}>
            <Text style={styles.secondaryButtonText}>I Already Have An Account</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md, // Reduced from lg to md
    justifyContent: "space-between",
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    minHeight: 0, // Ensure flex works properly
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  meerkatContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  meerkatImage: {
    width: 450,
    height: 450, 
  },
  textContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs, // Reduced from sm to xs
    flexShrink: 1, // Allow text container to shrink if needed
  },
  mainHeading: {
    fontSize: 32,
    fontFamily: typography.primary.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  problemStatement: {
    fontSize: 18,
    fontFamily: typography.primary.normal,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
    lineHeight: 24,
    fontStyle: "italic",
    flexWrap: "wrap", // Ensure text wraps properly
  },
  valueProposition: {
    fontSize: 16,
    fontFamily: typography.primary.normal,
    color: colors.text,
    textAlign: "center",
    lineHeight: 22,
    flexWrap: "wrap", // Ensure text wraps properly
  },
  boldText: {
    fontFamily: typography.primary.bold,
  },
  boldTextItalic: {
    fontFamily: typography.primary.bold,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.palette.primary500,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.palette.primary500,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: colors.palette.neutral100,
    fontSize: 18,
    fontFamily: typography.primary.semiBold,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.palette.primary500,
  },
  secondaryButtonText: {
    color: colors.palette.primary500,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
}) 