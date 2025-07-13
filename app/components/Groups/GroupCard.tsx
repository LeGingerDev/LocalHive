import React, { useEffect } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle, Image, ImageStyle } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated"

import { CustomGradient } from "@/components/Gradient/CustomGradient"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { Group } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface GroupCardProps {
  group: Group
  navigation: any
  index?: number // For staggered animations
}

export const GroupCard = ({ group, navigation, index = 0 }: GroupCardProps) => {
  const { themed, theme } = useAppTheme()

  // Animation values
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(50)
  const buttonScale = useSharedValue(1)

  // Calculate member and item display text
  const memberCount = group.member_count || 0
  const memberText = group.member_limit ? `${memberCount}/${group.member_limit}` : `${memberCount}`
  const itemCount = group.item_count || 0

  // Determine privacy label
  const privacyLabel = group.is_public ? "Public" : "Private"

  // Entrance animation
  useEffect(() => {
    const delay = index * 100 // Staggered entrance
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 })
      opacity.value = withTiming(1, { duration: 400 })
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
    }, delay)
  }, [])

  const handleViewGroup = () => {
    navigation.navigate("GroupDetail", { groupId: group.id })
  }

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
  }

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  return (
    <Animated.View style={[themed($groupCard), animatedCardStyle]}>
      <TouchableOpacity
        style={themed($touchableContainer)}
        onPress={handleViewGroup}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={themed($contentContainer)}>
          <View style={themed($textContainer)}>
            <View style={themed($nameRow)}>
              {/* Privacy indicator with pulse animation */}
              <Animated.View
                style={[
                  themed($privacyIndicator),
                  { backgroundColor: group.is_public ? theme.colors.success : theme.colors.error },
                ]}
              />

              <Text
                style={themed($groupName)}
                text={group.name}
                numberOfLines={1}
                ellipsizeMode="tail"
              />

              {/* Privacy label - only show in development */}
              {__DEV__ && <Text style={themed($privacyLabel)} text={privacyLabel} />}
            </View>

            <View style={themed($metaRow)}>
              <View style={themed($metaItem)}>
                <Icon
                  icon="menu"
                  size={14}
                  color={theme.colors.textDim}
                  containerStyle={themed($memberIconContainer)}
                />
                <Text style={themed($memberCount)} text="Members: " />
                <Text style={themed($memberCountValue)} text={memberText} />
              </View>
              <View style={themed($metaItem)}>
                <Icon
                  icon="view"
                  size={14}
                  color={theme.colors.textDim}
                  containerStyle={themed($itemIconContainer)}
                />
                <Text style={themed($itemCount)} text="Items: " />
                <Text style={themed($itemCountValue)} text={itemCount.toString()} />
              </View>
            </View>
          </View>

          <Animated.View style={animatedButtonStyle}>
            <CustomGradient preset="primary" style={themed($viewButton)}>
              <TouchableOpacity
                style={themed($viewButtonInner)}
                onPress={handleViewGroup}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                activeOpacity={1}
              >
                <Text style={themed($viewButtonText)} text="View" />
              </TouchableOpacity>
            </CustomGradient>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Compact styles
const $groupCard = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.cardColor,
  borderRadius: 12,
  padding: spacing.sm,
  paddingVertical: spacing.sm + 2,
  marginBottom: spacing.sm,
  shadowColor: colors.palette.neutral800,
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
  borderWidth: 1,
  borderColor: colors.border,
  height: 70,
})

const $touchableContainer = (): ViewStyle => ({
  flex: 1,
})

const $contentContainer = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $textContainer = (): ViewStyle => ({
  flex: 1,
  marginRight: spacing.sm,
})

const $nameRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 2,
})

const $privacyIndicator = (): ViewStyle => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  marginRight: 6,
})

const $privacyLabel = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: colors.textDim,
  marginLeft: 4,
})

const $groupName = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
  flex: 1,
})

const $metaRow = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
})

const $metaItem = (): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
})

const $memberIconContainer = (): ViewStyle => ({
  marginRight: 4,
})

const $memberCount = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
})

const $memberCountValue = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: colors.text,
})

const $itemIconContainer = (): ViewStyle => ({
  marginRight: 4,
})

const $itemCount = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: colors.textDim,
})

const $itemCountValue = ({ colors, typography }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: colors.text,
})

const $viewButton = ({ colors }: any): ViewStyle => ({
  borderRadius: 8,
  overflow: "hidden",
  alignSelf: "center",
  // Remove flex: 1 if inherited from CustomGradient
  flex: undefined,
})
const $viewButtonInner = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: "transparent",
  borderRadius: 8,
  paddingVertical: spacing.sm, // Increased for better vertical centering
  paddingHorizontal: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})

const $viewButtonText = ({ colors, typography }: any): TextStyle => ({
  color: "#ffffff",
  fontFamily: typography.primary.medium,
  fontSize: 14,
  lineHeight: 16, // Match or slightly exceed fontSize for centering
  textAlign: "center",
})

const $buttonIconContainer = (): ViewStyle => ({
  marginLeft: 4,
})
