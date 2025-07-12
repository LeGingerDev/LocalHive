import React, { useCallback, useState, useEffect } from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated"
import Animated from "react-native-reanimated"

import { BottomTabNavigator } from "@/navigators/BottomTabNavigator"
import type { BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

type BottomTabNavigation = BottomTabNavigationProp<BottomTabParamList>

interface SwipeableTabNavigatorProps {
  // Add any props if needed in the future
}

/**
 * SwipeableTabNavigator - Wraps BottomTabNavigator with horizontal swipe gestures and edge effects
 *
 * Features:
 * - Horizontal swipe detection for tab navigation
 * - Edge effects with white fade bars that become thicker as you pull
 * - Configurable swipe sensitivity and thresholds
 * - Prevents conflicts with vertical scrolling
 * - Maintains existing tab bar functionality
 * - Follows SOLID principles with single responsibility
 * - Only handles gestures when on tab screens, not on modal screens like GroupDetail
 */
export const SwipeableTabNavigator: React.FC<SwipeableTabNavigatorProps> = () => {
  const { theme, themeContext } = useAppTheme()
  const navigation = useNavigation<BottomTabNavigation>()

  // Debug: Component mount
  useEffect(() => {
    console.log("[SwipeableTabNavigator] MOUNTED")
    return () => console.log("[SwipeableTabNavigator] UNMOUNTED")
  }, [])

  // Define the tab routes in order
  const TAB_ROUTES: (keyof BottomTabParamList)[] = ["Home", "Search", "Add", "Groups", "Profile"]

  // Track current tab index - this is our source of truth
  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  // Track if we're currently on a tab screen (not on modal screens like GroupDetail)
  const [isOnTabScreen, setIsOnTabScreen] = useState(true)

  // Animation values
  const slideOffset = useSharedValue(0)
  const isAnimating = useSharedValue(false)

  // Configuration for swipe behavior
  const SWIPE_THRESHOLD = 40 // Reduced threshold for easier navigation
  const SWIPE_VELOCITY_THRESHOLD = 200 // Reduced velocity threshold for easier navigation
  const EDGE_EFFECT_WIDTH = 18 // Width of the edge effect area (70% thinner than 60)

  // Animated style for the main container
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: slideOffset.value * SCREEN_WIDTH * 0.3,
        },
      ],
    }
  })

  // Animated style for left edge effect (appears when swiping right)
  const leftEdgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(slideOffset.value, [0, 0.3, 1], [0, 0.3, 0.8], Extrapolate.CLAMP)

    const width = interpolate(
      slideOffset.value,
      [0, 0.3, 1],
      [0, EDGE_EFFECT_WIDTH * 0.5, EDGE_EFFECT_WIDTH],
      Extrapolate.CLAMP,
    )

    return {
      opacity: slideOffset.value > 0 ? opacity : 0,
      width: slideOffset.value > 0 ? width : 0,
    }
  })

  // Animated style for right edge effect (appears when swiping left)
  const rightEdgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(-slideOffset.value, [0, 0.3, 1], [0, 0.3, 0.8], Extrapolate.CLAMP)

    const width = interpolate(
      -slideOffset.value,
      [0, 0.3, 1],
      [0, EDGE_EFFECT_WIDTH * 0.5, EDGE_EFFECT_WIDTH],
      Extrapolate.CLAMP,
    )

    return {
      opacity: slideOffset.value < 0 ? opacity : 0,
      width: slideOffset.value < 0 ? width : 0,
    }
  })

  // Check if we're currently on a tab screen
  const checkIfOnTabScreen = useCallback(() => {
    try {
      const stackState = navigation.getState()
      console.log("[SwipeableTabNavigator] checkIfOnTabScreen navigation state:", stackState)
      const currentRoute = stackState?.routes?.[stackState.index ?? 0]

      // If we're not on the Main route, we're not on a tab screen
      if ((currentRoute?.name as string) !== "Main") {
        setIsOnTabScreen(false)
        console.log("[SwipeableTabNavigator] Not on Main route, disabling swipe")
        return
      }

      // If we're on Main, check if we're on a tab screen
      const mainRoute = stackState?.routes?.find((route) => (route.name as string) === "Main")
      const bottomTabState = mainRoute?.state

      if (
        bottomTabState?.routes &&
        bottomTabState.routes.length > 0 &&
        bottomTabState.index !== undefined
      ) {
        const currentTabRoute = bottomTabState.routes[bottomTabState.index]
        const tabIndex = TAB_ROUTES.indexOf(currentTabRoute.name as keyof BottomTabParamList)

        // If we found a valid tab index, we're on a tab screen
        if (tabIndex !== -1) {
          setIsOnTabScreen(true)
          setCurrentTabIndex(tabIndex)
          console.log(
            `[SwipeableTabNavigator] On tab screen: ${currentTabRoute.name} -> index ${tabIndex}`,
          )
        } else {
          setIsOnTabScreen(false)
          console.log("[SwipeableTabNavigator] Not on a valid tab route, disabling swipe")
        }
      } else {
        setIsOnTabScreen(false)
        console.log("[SwipeableTabNavigator] No bottomTabState, disabling swipe")
      }
    } catch (error) {
      console.log(
        "[SwipeableTabNavigator] Could not determine if on tab screen, assuming not",
        error,
      )
      setIsOnTabScreen(false)
    }
  }, [navigation])

  // Initialize tab index on mount
  useEffect(() => {
    const initializeTabIndex = () => {
      try {
        const stackState = navigation.getState()
        const mainRoute = stackState?.routes?.find((route) => (route.name as string) === "Main")
        const bottomTabState = mainRoute?.state

        if (
          bottomTabState?.routes &&
          bottomTabState.routes.length > 0 &&
          bottomTabState.index !== undefined
        ) {
          const currentRoute = bottomTabState.routes[bottomTabState.index]
          const tabIndex = TAB_ROUTES.indexOf(currentRoute.name as keyof BottomTabParamList)
          if (tabIndex !== -1) {
            console.log(
              `[SwipeableTabNavigator] Initial tab index: ${currentRoute.name} -> index ${tabIndex}`,
            )
            setCurrentTabIndex(tabIndex)
            setIsOnTabScreen(true)
          }
        }
      } catch (error) {
        console.log(
          "[SwipeableTabNavigator] Could not read initial navigation state, using default index 0",
        )
        setCurrentTabIndex(0)
        setIsOnTabScreen(true)
      }
    }

    // Try to initialize immediately
    initializeTabIndex()

    // Also try after a short delay in case navigation state isn't ready yet
    const timeoutId = setTimeout(initializeTabIndex, 100)

    return () => clearTimeout(timeoutId)
  }, [navigation])

  // Update tab index when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const updateTabIndex = () => {
        checkIfOnTabScreen()
      }

      // Update after a short delay to ensure navigation state is stable
      const timeoutId = setTimeout(updateTabIndex, 50)

      return () => clearTimeout(timeoutId)
    }, [checkIfOnTabScreen]),
  )

  const navigateToTab = useCallback(
    (direction: "left" | "right") => {
      console.log(
        `[SwipeableTabNavigator] navigateToTab called, direction: ${direction}, isOnTabScreen: ${isOnTabScreen}, currentTabIndex: ${currentTabIndex}`,
      )
      // Don't navigate if we're not on a tab screen
      if (!isOnTabScreen) {
        console.log("[SwipeableTabNavigator] Not on tab screen, ignoring navigation")
        return
      }

      try {
        // Use our tracked current tab index as the source of truth
        const currentIndex = currentTabIndex
        let targetIndex: number

        if (direction === "left") {
          targetIndex = Math.min(currentIndex + 1, TAB_ROUTES.length - 1)
        } else {
          targetIndex = Math.max(currentIndex - 1, 0)
        }

        // Only navigate if we're actually changing tabs
        if (targetIndex !== currentIndex) {
          const targetRoute = TAB_ROUTES[targetIndex]

          console.log(
            `[SwipeableTabNavigator] Navigating from ${TAB_ROUTES[currentIndex]} (index ${currentIndex}) to ${targetRoute} (index ${targetIndex}) (${direction} swipe)`,
          )

          // Update our tracked index immediately to prevent multiple navigation attempts
          setCurrentTabIndex(targetIndex)

          // Navigate to the target tab
          runOnJS(() => {
            try {
              ;(navigation as any).navigate("Main", { screen: targetRoute })
              console.log(
                `[SwipeableTabNavigator] Navigation completed to: ${targetIndex} (${targetRoute})`,
              )
            } catch (error) {
              console.error("[SwipeableTabNavigator] Navigation error:", error)
              // Revert the tab index if navigation failed
              setCurrentTabIndex(currentIndex)
            }
          })()
        } else {
          console.log(
            `[SwipeableTabNavigator] Already at ${direction === "left" ? "last" : "first"} tab (${TAB_ROUTES[currentIndex]})`,
          )
        }
      } catch (error) {
        console.error("[SwipeableTabNavigator] Error in navigateToTab:", error)
      }
    },
    [navigation, currentTabIndex, isOnTabScreen],
  )

  // Enhanced swipe gesture with edge effects - only active when on tab screens
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      "worklet"
      console.log("[SwipeableTabNavigator] GESTURE onBegin, isOnTabScreen:", isOnTabScreen)
      // Don't start gesture if we're not on a tab screen
      if (!isOnTabScreen) return
    })
    .onUpdate((event) => {
      "worklet"
      console.log("[SwipeableTabNavigator] GESTURE onUpdate", event)
      // Don't allow gesture during animation or if not on tab screen
      if (isAnimating.value || !isOnTabScreen) return

      // More responsive feedback - increased intensity
      const progress = Math.min(Math.abs(event.translationX) / SCREEN_WIDTH, 1.0)
      slideOffset.value = event.translationX > 0 ? progress : -progress
    })
    .onEnd((event) => {
      "worklet"
      console.log("[SwipeableTabNavigator] GESTURE onEnd", event)
      // Don't process if animating or not on tab screen
      if (isAnimating.value || !isOnTabScreen) return

      const { translationX, velocityX, translationY } = event

      // Check if it's a horizontal swipe with enough distance
      const isHorizontalSwipe = Math.abs(translationY) < Math.abs(translationX) * 0.3
      const meetsDistanceThreshold = Math.abs(translationX) > SWIPE_THRESHOLD
      const meetsVelocityThreshold = Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD

      // Determine swipe direction
      const isLeftSwipe = translationX < 0
      const isRightSwipe = translationX > 0

      // Trigger navigation if conditions are met
      if (isHorizontalSwipe && (meetsDistanceThreshold || meetsVelocityThreshold)) {
        if (isLeftSwipe) {
          runOnJS(navigateToTab)("left")
        } else if (isRightSwipe) {
          runOnJS(navigateToTab)("right")
        }
      }

      // Always reset slide with smooth animation
      slideOffset.value = withTiming(0, { duration: 300 })
    })
    .activeOffsetX([-15, 15]) // Increased activation threshold
    .failOffsetY([-30, 30]) // Increased fail threshold
    .enabled(isOnTabScreen) // Only enable gesture when on tab screens

  // Get the appropriate edge effect color based on theme
  const getEdgeEffectColor = () => {
    if (themeContext === "dark") {
      // Dark mode - use a darker color than background
      return "#0A0A0A" // Very dark gray, darker than the background
    } else {
      // Light mode - use a darker color than background
      return theme.colors.textDim
    }
  }

  // Debug: Render
  console.log(
    "[SwipeableTabNavigator] Render, isOnTabScreen:",
    isOnTabScreen,
    "currentTabIndex:",
    currentTabIndex,
  )

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
        {/* Left edge effect (appears when swiping right) - only show when on tab screens */}
        {isOnTabScreen && (
          <Animated.View
            style={[
              styles.edgeEffect,
              styles.leftEdge,
              leftEdgeStyle,
              { backgroundColor: getEdgeEffectColor() },
            ]}
          />
        )}

        {/* Right edge effect (appears when swiping left) - only show when on tab screens */}
        {isOnTabScreen && (
          <Animated.View
            style={[
              styles.edgeEffect,
              styles.rightEdge,
              rightEdgeStyle,
              { backgroundColor: getEdgeEffectColor() },
            ]}
          />
        )}

        <Animated.View style={[styles.animatedContainer, animatedContainerStyle]}>
          <BottomTabNavigator />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  edgeEffect: {
    bottom: 0,
    position: "absolute",
    top: 0,
    zIndex: 1000,
  },
  leftEdge: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    left: 0,
  },
  rightEdge: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
    right: 0,
  },
})
