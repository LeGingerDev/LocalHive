import React from "react"
import { View, StyleSheet, StatusBar } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { CustomGradient } from "@/components/CustomGradient"
import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"
import { spacing } from "@/theme/spacing"

export const OnboardingQuestionnaireScreen = () => {
  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Gradient Background */}
      <CustomGradient
        preset="custom"
        customColors={["#E6ECFF", "#C4D1FF"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Onboarding Questionnaire</Text>
        <Text style={styles.subtitle}>This will be implemented with progressive disclosure questions</Text>
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
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.primary.normal,
    color: colors.textDim,
    textAlign: "center",
  },
}) 