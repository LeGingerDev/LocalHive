import React, { useState, useRef } from "react"
import { View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Animated } from "react-native"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AnalyticsService } from "@/services/analyticsService"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"
import { typography } from "@/theme/typography"

interface Question {
  id: number
  question: string
  options: string[]
}

const questions: Question[] = [
  {
    id: 1,
    question: "What Best Describes your Group?",
    options: ["Family", "Roommates", "Friends", "Work Team", "Other"],
  },
  {
    id: 2,
    question: "How many people are in your group?",
    options: ["2-3 people", "4-6 people", "7-10 people", "More than 10"],
  },
  {
    id: 3,
    question: "What types of items do you want to catalog?",
    options: ["Kitchen & Food", "Electronics & Tech", "Clothing & Personal", "Everything"],
  },
  {
    id: 4,
    question: "How often do you plan to use this app?",
    options: ["Daily", "Weekly", "Monthly", "Occasionally"],
  },
]

export const OnboardingQuestionnaireScreen = () => {
  const navigation = useNavigation<any>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const currentQuestion = questions[currentQuestionIndex]
  const selectedAnswer = answers[currentQuestion.id]

  // Animation refs
  const questionFadeAnim = useRef(new Animated.Value(0)).current
  const questionSlideAnim = useRef(new Animated.Value(30)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current

  // Option animations - create animations for each option
  const optionAnimations = useRef<
    {
      wiggle: Animated.Value
      float: Animated.Value
      scale: Animated.Value
      scaleIn: Animated.Value
    }[]
  >(
    (() => {
      const animations = [] as {
        wiggle: Animated.Value
        float: Animated.Value
        scale: Animated.Value
        scaleIn: Animated.Value
      }[]
      for (const question of questions) {
        for (const option of question.options) {
          animations.push({
            wiggle: new Animated.Value(0),
            float: new Animated.Value(0),
            scale: new Animated.Value(1),
            scaleIn: new Animated.Value(0.8),
          })
        }
      }
      return animations
    })(),
  )

  // Track screen view on mount
  React.useEffect(() => {
    AnalyticsService.trackScreenView({ screenName: "OnboardingQuestionnaire" })
    startQuestionAnimation()
  }, [])

  // Animate when question changes
  React.useEffect(() => {
    startQuestionAnimation()
  }, [currentQuestionIndex])

  const startQuestionAnimation = () => {
    // Reset animations
    questionFadeAnim.setValue(0)
    questionSlideAnim.setValue(30)

    // Reset option animations for current question
    const startIndex = currentQuestionIndex * currentQuestion.options.length
    for (let i = 0; i < currentQuestion.options.length; i++) {
      const animIndex = startIndex + i
      if (optionAnimations.current[animIndex]) {
        optionAnimations.current[animIndex].wiggle.setValue(0)
        optionAnimations.current[animIndex].float.setValue(0)
        optionAnimations.current[animIndex].scale.setValue(1)
        optionAnimations.current[animIndex].scaleIn.setValue(0.8)
      }
    }

    // Animate question
    Animated.parallel([
      Animated.timing(questionFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(questionSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Animate each option's scale in, staggered
    for (let i = 0; i < currentQuestion.options.length; i++) {
      const animIndex = startIndex + i
      if (optionAnimations.current[animIndex]) {
        setTimeout(() => {
          Animated.timing(optionAnimations.current[animIndex].scaleIn, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start()
        }, i * 80)
      }
    }

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: (currentQuestionIndex + 1) / questions.length,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }

  const animateOptionSelection = (optionIndex: number) => {
    const animIndex = currentQuestionIndex * currentQuestion.options.length + optionIndex
    const animation = optionAnimations.current[animIndex]

    if (!animation) return

    // Wiggle animation
    const wiggleSequence = Animated.sequence([
      Animated.timing(animation.wiggle, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation.wiggle, {
        toValue: -1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation.wiggle, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ])

    // Scale animation
    const scaleSequence = Animated.sequence([
      Animated.timing(animation.scale, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation.scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ])

    // Start wiggle and scale
    Animated.parallel([wiggleSequence, scaleSequence]).start(() => {
      // After wiggle, start floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation.float, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animation.float, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    })
  }

  const handleAnswerSelect = (optionIndex: number) => {
    // Haptic feedback for selection
    ReactNativeHapticFeedback.trigger("selection")

    // Track answer selection
    AnalyticsService.trackEvent({
      name: "onboarding_question_answered",
      properties: {
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        answer_index: optionIndex,
        answer_text: currentQuestion.options[optionIndex],
        question_number: currentQuestionIndex + 1,
        total_questions: questions.length,
      },
    })

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }))

    // Animate the selected option
    animateOptionSelection(optionIndex)

    // Animate button appearance
    Animated.parallel([
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleNext = () => {
    if (selectedAnswer === undefined) return // Require an answer

    // Haptic feedback for progression
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

    if (currentQuestionIndex < questions.length - 1) {
      // Reset button animations for next question
      buttonScaleAnim.setValue(0.8)
      buttonOpacityAnim.setValue(0)

      // Track question progression
      AnalyticsService.trackEvent({
        name: "onboarding_question_progress",
        properties: {
          from_question: currentQuestionIndex + 1,
          to_question: currentQuestionIndex + 2,
          total_questions: questions.length,
          question_title: currentQuestion.question,
        },
      })

      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Haptic feedback for completing questionnaire
      ReactNativeHapticFeedback.trigger("notificationSuccess")

      // Track questionnaire completion
      AnalyticsService.trackEvent({
        name: "onboarding_questionnaire_completed",
        properties: {
          total_questions: questions.length,
          answers_provided: Object.keys(answers).length,
          completion_time: Date.now(), // You could calculate actual time if needed
        },
      })

      // Navigate to thank you screen
      navigation.navigate("OnboardingThankYou")
    }
  }

  const handleBack = () => {
    // Haptic feedback for navigation
    ReactNativeHapticFeedback.trigger("selection")

    if (currentQuestionIndex > 0) {
      // Reset button animations for previous question
      buttonScaleAnim.setValue(0.8)
      buttonOpacityAnim.setValue(0)

      // Track question navigation back
      AnalyticsService.trackEvent({
        name: "onboarding_question_navigation",
        properties: {
          direction: "back",
          from_question: currentQuestionIndex + 1,
          to_question: currentQuestionIndex,
          question_title: currentQuestion.question,
        },
      })

      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      // Track exit from questionnaire
      AnalyticsService.trackEvent({
        name: "onboarding_exit",
        properties: {
          source: "questionnaire",
          action: "back_to_slideshow",
          questions_answered: Object.keys(answers).length,
        },
      })

      navigation.goBack()
    }
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Purple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Know your needs</Text>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {questions.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.progressSegment,
                index <= currentQuestionIndex && styles.progressSegmentActive,
                {
                  transform: [
                    {
                      scale:
                        index === currentQuestionIndex
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            })
                          : 1,
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* White Content Area */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <Animated.Text
            style={[
              styles.questionText,
              {
                opacity: questionFadeAnim,
                transform: [{ translateY: questionSlideAnim }],
              },
            ]}
          >
            {currentQuestion.question}
          </Animated.Text>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const animIndex = currentQuestionIndex * currentQuestion.options.length + index
              const animation = optionAnimations.current[animIndex]
              return (
                <Animated.View
                  key={index}
                  style={{
                    transform: [
                      {
                        scale: animation?.scaleIn || 1,
                      },
                      {
                        translateX:
                          animation?.wiggle.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-5, 0, 5],
                          }) || 0,
                      },
                      {
                        translateY:
                          animation?.float.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3],
                          }) || 0,
                      },
                      {
                        scale: animation?.scale || 1,
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      selectedAnswer === index && styles.optionCardSelected,
                    ]}
                    onPress={() => handleAnswerSelect(index)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedAnswer === index && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedAnswer === undefined && styles.nextButtonDisabled,
              {
                opacity: buttonOpacityAnim,
                transform: [{ scale: buttonScaleAnim }],
              },
            ]}
            onPress={handleNext}
            disabled={selectedAnswer === undefined}
          >
            <Text
              style={[
                styles.nextButtonText,
                selectedAnswer === undefined && styles.nextButtonTextDisabled,
              ]}
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    minWidth: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.text,
    fontFamily: typography.primary.medium,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.palette.neutral100,
    marginTop: -20, // Overlap with header for rounded effect
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xl,
  },
  header: {
    backgroundColor: colors.palette.primary400,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  headerTitle: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.bold,
    fontSize: 24,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  navigationContainer: {
    alignItems: "center",
    borderTopColor: colors.palette.neutral300,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: colors.palette.primary400,
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: colors.palette.neutral300,
  },
  nextButtonText: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.medium,
    fontSize: 16,
  },
  nextButtonTextDisabled: {
    color: colors.palette.neutral500,
  },
  optionCard: {
    backgroundColor: colors.palette.neutral100,
    borderColor: colors.palette.neutral300,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardSelected: {
    backgroundColor: colors.palette.primary100,
    borderColor: colors.palette.primary400,
    shadowColor: colors.palette.primary400,
    shadowOpacity: 0.2,
  },
  optionText: {
    color: colors.text,
    fontFamily: typography.primary.medium,
    fontSize: 16,
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.palette.primary400,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  progressContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  progressSegment: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    width: 60,
  },
  progressSegmentActive: {
    backgroundColor: colors.palette.primary100,
    borderColor: colors.palette.primary100,
  },
  questionText: {
    color: colors.palette.primary400,
    fontFamily: typography.primary.bold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: spacing.xl,
    textAlign: "left",
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
})
