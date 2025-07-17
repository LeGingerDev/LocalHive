import React, { useState, useRef } from "react"
import { View, StyleSheet, StatusBar, TouchableOpacity, Dimensions, ScrollView, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"
import { spacing } from "@/theme/spacing"

const { width: screenWidth } = Dimensions.get("window")

interface Slide {
  id: number
  title: string
  subtitle: string
  description: string
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Share What You Use",
    subtitle: "Create groups with family or roommates and catalog anything",
    description: "",
  },
  {
    id: 2,
    title: "Snap and Catalog ANYTHING ",
    subtitle: "",
    description: "Take photos or choose from gallery to instantly add things of interest to your group's catalog",
  },
  {
    id: 3,
    title: "Find Anything Instantly",
    subtitle: "",
    description: "Ask for 'Mums Shampoo' or 'Jordan's favourite restaurant' and AI will find exactly what you mean",
  },
]

export const OnboardingSlideshowScreen = () => {
  const navigation = useNavigation<any>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const isScrollingProgrammatically = useRef(false)

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      isScrollingProgrammatically.current = true
      setCurrentIndex(prevIndex)
      scrollViewRef.current?.scrollTo({
        x: prevIndex * screenWidth,
        animated: true,
      })
      // Reset flag after animation completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 300)
    } else {
      // Go back to entry screen if on first slide
      navigation.goBack()
    }
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1
      isScrollingProgrammatically.current = true
      setCurrentIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      })
      // Reset flag after animation completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 300)
    } else {
      // Last slide - navigate to questionnaire
      navigation.navigate("OnboardingQuestionnaire")
    }
  }

  const handleScroll = (event: any) => {
    // Don't update index if we're scrolling programmatically
    if (isScrollingProgrammatically.current) return
    
    const contentOffset = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffset / screenWidth)
    setCurrentIndex(index)
  }

  const renderSlide = (slide: Slide, index: number) => (
    <View key={slide.id} style={styles.slide}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={
            slide.id === 1 
              ? require("../../../assets/Visu/Onboarding_ADD_GROUPS.png")
              : slide.id === 2
              ? require("../../../assets/Visu/Onboarding_ADD_ITEMS.png")
              : require("../../../assets/Visu/Onboarding_AI_SEARCH.png")
          }
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {slide.id === 2 ? (
            <>
              Snap and Catalog{"\n"}ANYTHING
            </>
          ) : (
            slide.title
          )}
        </Text>
        {slide.subtitle && <Text style={styles.subtitle}>{slide.subtitle}</Text>}
        {slide.description && <Text style={styles.description}>{slide.description}</Text>}
      </View>
    </View>
  )

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Main gradient background */}
      <LinearGradient
        colors={["#4A90E2", "#FFFFFF"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      
      {/* Concentric circles */}
      <View style={styles.circleContainer} pointerEvents="none">
        <View style={styles.outerCircle} />
        <View style={styles.middleCircle} />
        <View style={styles.innerCircle} />
      </View>
      
      {/* Wave-like gradient bands */}
      <View style={styles.waveContainer} pointerEvents="none">
        <View style={styles.wave1} />
        <View style={styles.wave2} />
        <View style={styles.wave3} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleBack}>
          <Text style={styles.skipButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circleContainer: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 750,
    height: 750,
    borderRadius: 375,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    position: "absolute",
    shadowColor: "rgba(255, 255, 255, 0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  middleCircle: {
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    position: "absolute",
    shadowColor: "rgba(74, 144, 226, 0.4)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  innerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    position: "absolute",
    shadowColor: "rgba(255, 255, 255, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  waveContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2000,
    bottom: 0,
  },
  wave1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    borderRadius: 30,
    transform: [{ scaleY: 2 }],
  },
  wave2: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    borderRadius: 25,
    transform: [{ scaleY: 1.5 }],
  },
  wave3: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    borderRadius: 20,
    transform: [{ scaleY: 1.2 }],
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    width: screenWidth * slides.length,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  illustrationImage: {
    width: 300,
    height: 300,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.primary.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.primary.normal,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    fontFamily: typography.primary.normal,
    color: colors.text,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60, // Fixed width to prevent shifting
    alignItems: "center",
  },
  skipButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80, // Fixed width to prevent shifting
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.palette.neutral400,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.palette.primary500,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nextButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80, // Fixed width to accommodate "Get Started"
    alignItems: "center",
  },
  nextButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
  boldText: {
    fontFamily: typography.primary.bold,
  },
}) 