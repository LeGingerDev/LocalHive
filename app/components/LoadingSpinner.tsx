import React, { useEffect } from "react"
import { View, ActivityIndicator, ViewStyle } from "react-native"
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

interface LoadingSpinnerProps {
  size?: "small" | "large"
  text?: string
  style?: ViewStyle
}

export const LoadingSpinner = ({ size = "large", text, style }: LoadingSpinnerProps) => {
  const { themed } = useAppTheme()

  // Animation values
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  // Entrance animation
  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 })
    opacity.value = withTiming(1, { duration: 400 })

    // Subtle pulse animation
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    )
  }, [])

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { scale: pulseScale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[themed($container), style, animatedContainerStyle]}>
      <ActivityIndicator size={size} color={themed($spinner).color} />
      {text && <Text style={themed($text)} text={text} />}
    </Animated.View>
  )
}

const $container = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})

const $spinner = ({ colors }: any) => ({
  color: colors.tint,
})

const $text = ({ typography, colors, spacing }: any) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  marginTop: spacing.sm,
  textAlign: "center" as const,
})
