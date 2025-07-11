import React, { useEffect } from "react"
import { View, ViewStyle, TouchableOpacity } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

interface StartGroupCardProps {
  onPress: () => void
}

export const StartGroupCard = ({ onPress }: StartGroupCardProps) => {
  const { themed } = useAppTheme()

  // Animation values
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(30)
  const buttonScale = useSharedValue(1)
  const floatY = useSharedValue(0)

  // Entrance animation
  useEffect(() => {
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 })
      opacity.value = withTiming(1, { duration: 500 })
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
    }, 300) // Delay after group cards

    // Subtle floating animation
    floatY.value = withRepeat(
      withSequence(withTiming(-3, { duration: 2000 }), withTiming(3, { duration: 2000 })),
      -1,
      true,
    )
  }, [])

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
  }

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value + floatY.value }],
    opacity: opacity.value,
  }))

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  return (
    <Animated.View style={[themed($startGroupCard), animatedCardStyle]}>
      <View style={themed($plusIcon)}>
        <Text text="+" style={themed($plusIconText)} />
      </View>
      <Text style={themed($startTitle)} text="Start Your Own Group" />
      <Text
        style={themed($startDesc)}
        text="Invite friends and family to build local knowledge together"
      />
      <Animated.View style={animatedButtonStyle}>
        <TouchableOpacity
          style={themed($createGroupButton)}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Text style={themed($createGroupButtonText)} text="Create Group" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

// Styles (copy from GroupsScreen)
const $startGroupCard = ({ colors, spacing }: any) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.md,
  alignItems: "center" as const,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
})
const $plusIcon = ({ colors }: any) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.primary100,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginBottom: 8,
})
const $plusIconText = ({ colors, typography }: any) => ({
  color: colors.tint,
  fontFamily: typography.primary.bold,
  fontSize: 28,
})
const $startTitle = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  marginTop: 8,
})
const $startDesc = ({ typography, colors }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
  marginTop: 4,
  marginBottom: 12,
  textAlign: "center" as const,
})
const $createGroupButton = ({ colors, typography }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 24,
  overflow: "hidden" as const,
})
const $createGroupButtonText = ({ colors, typography }: any) => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 15,
  textAlign: "center" as const,
})
