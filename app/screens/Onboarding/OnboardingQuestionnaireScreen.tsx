import React, { useState } from "react"
import { View, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"
import { spacing } from "@/theme/spacing"
import { AnalyticsService } from "@/services/analyticsService"

interface Question {
  id: number
  question: string
  options: string[]
}

const questions: Question[] = [
  {
    id: 1,
    question: "What Best Describes your Group?",
    options: [
      "Family",
      "Roommates",
      "Friends",
      "Work Team",
      "Other"
    ]
  },
  {
    id: 2,
    question: "How many people are in your group?",
    options: [
      "2-3 people",
      "4-6 people", 
      "7-10 people",
      "More than 10"
    ]
  },
  {
    id: 3,
    question: "What types of items do you want to catalog?",
    options: [
      "Kitchen & Food",
      "Electronics & Tech",
      "Clothing & Personal",
      "Everything"
    ]
  },
  {
    id: 4,
    question: "How often do you plan to use this app?",
    options: [
      "Daily",
      "Weekly",
      "Monthly",
      "Occasionally"
    ]
  }
]

export const OnboardingQuestionnaireScreen = () => {
  const navigation = useNavigation<any>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const currentQuestion = questions[currentQuestionIndex]
  const selectedAnswer = answers[currentQuestion.id]

  // Track screen view on mount
  React.useEffect(() => {
    AnalyticsService.trackScreenView({ screenName: "OnboardingQuestionnaire" })
  }, [])

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
        total_questions: questions.length
      }
    })
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }))
  }

  const handleNext = () => {
    if (selectedAnswer === undefined) return // Require an answer
    
    // Haptic feedback for progression
    ReactNativeHapticFeedback.trigger("selection")
    
    if (currentQuestionIndex < questions.length - 1) {
      // Track question progression
      AnalyticsService.trackEvent({
        name: "onboarding_question_progress",
        properties: {
          from_question: currentQuestionIndex + 1,
          to_question: currentQuestionIndex + 2,
          total_questions: questions.length,
          question_title: currentQuestion.question
        }
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
          completion_time: Date.now() // You could calculate actual time if needed
        }
      })
      
      // Navigate to thank you screen
      navigation.navigate("OnboardingThankYou")
    }
  }

  const handleBack = () => {
    // Haptic feedback for navigation
    ReactNativeHapticFeedback.trigger("selection")
    
    if (currentQuestionIndex > 0) {
      // Track question navigation back
      AnalyticsService.trackEvent({
        name: "onboarding_question_navigation",
        properties: {
          direction: "back",
          from_question: currentQuestionIndex + 1,
          to_question: currentQuestionIndex,
          question_title: currentQuestion.question
        }
      })
      
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      // Track exit from questionnaire
      AnalyticsService.trackEvent({
        name: "onboarding_exit",
        properties: {
          source: "questionnaire",
          action: "back_to_slideshow",
          questions_answered: Object.keys(answers).length
        }
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
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= currentQuestionIndex && styles.progressSegmentActive
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
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  selectedAnswer === index && styles.optionCardSelected
                ]}
                onPress={() => handleAnswerSelect(index)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
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
              selectedAnswer === undefined && styles.nextButtonDisabled
            ]} 
            onPress={handleNext}
            disabled={selectedAnswer === undefined}
          >
            <Text style={[
              styles.nextButtonText,
              selectedAnswer === undefined && styles.nextButtonTextDisabled
            ]}>
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </Text>
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
  header: {
    backgroundColor: colors.palette.primary400,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.palette.neutral100,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressSegment: {
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  progressSegmentActive: {
    backgroundColor: colors.palette.primary100,
    borderColor: colors.palette.primary100,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.palette.neutral100,
    marginTop: -20, // Overlap with header for rounded effect
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  questionText: {
    fontSize: 20,
    fontFamily: typography.primary.bold,
    color: colors.palette.primary400,
    textAlign: "left",
    marginBottom: spacing.xl,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.palette.neutral100,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.palette.neutral300,
    shadowColor: colors.palette.neutral800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: colors.palette.primary100,
    borderColor: colors.palette.primary400,
    shadowColor: colors.palette.primary400,
    shadowOpacity: 0.2,
  },
  optionText: {
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.text,
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.palette.primary400,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.palette.neutral300,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60,
    alignItems: "center",
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
  nextButton: {
    backgroundColor: colors.palette.primary400,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: colors.palette.neutral300,
  },
  nextButtonText: {
    color: colors.palette.neutral100,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
  nextButtonTextDisabled: {
    color: colors.palette.neutral500,
  },
}) 