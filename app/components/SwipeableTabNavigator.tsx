import React, { useRef, useCallback } from "react"
import { View, StyleSheet } from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"

import { BottomTabNavigator } from "@/navigators/BottomTabNavigator"
import type { BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"

type BottomTabNavigation = BottomTabNavigationProp<BottomTabParamList>

interface SwipeableTabNavigatorProps {
  // Add any props if needed in the future
}

/**
 * SwipeableTabNavigator - Wraps BottomTabNavigator with horizontal swipe gestures
 * 
 * Features:
 * - Horizontal swipe detection for tab navigation
 * - Configurable swipe sensitivity and thresholds
 * - Prevents conflicts with vertical scrolling
 * - Maintains existing tab bar functionality
 * - Follows SOLID principles with single responsibility
 */
export const SwipeableTabNavigator: React.FC<SwipeableTabNavigatorProps> = () => {
  const { theme } = useAppTheme()
  const navigation = useNavigation<BottomTabNavigation>()
  
  // Configuration for swipe behavior
  const SWIPE_THRESHOLD = 50 // Minimum distance to trigger navigation
  const SWIPE_VELOCITY_THRESHOLD = 500 // Minimum velocity to trigger navigation
  const SWIPE_ANGLE_THRESHOLD = 30 // Maximum angle deviation from horizontal (in degrees)

  // Get current tab index and available routes
  const getCurrentTabIndex = useCallback((): number => {
    const state = navigation.getState()
    return state.index
  }, [navigation])

  const getTabRoutes = useCallback((): string[] => {
    const state = navigation.getState()
    return state.routes.map(route => route.name)
  }, [navigation])

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex()
    const routes = getTabRoutes()
    
    let targetIndex: number
    
    if (direction === 'left') {
      // Swipe left = go to next tab (higher index)
      targetIndex = Math.min(currentIndex + 1, routes.length - 1)
    } else {
      // Swipe right = go to previous tab (lower index)
      targetIndex = Math.max(currentIndex - 1, 0)
    }
    
    // Only navigate if we're actually changing tabs
    if (targetIndex !== currentIndex) {
      const targetRoute = routes[targetIndex]
      navigation.navigate(targetRoute as keyof BottomTabParamList)
    }
  }, [navigation, getCurrentTabIndex, getTabRoutes])

  // Create the swipe gesture
  const swipeGesture = Gesture.Pan()
    .onBegin((event) => {
      // Optional: Add haptic feedback or visual indicator
    })
    .onUpdate((event) => {
      // Optional: Add visual feedback during swipe
    })
    .onEnd((event) => {
      const { translationX, velocityX, translationY, velocityY } = event
      
      // Calculate the angle of the swipe to ensure it's mostly horizontal
      const angle = Math.abs(Math.atan2(translationY, translationX) * 180 / Math.PI)
      const isHorizontalSwipe = angle < SWIPE_ANGLE_THRESHOLD || angle > (180 - SWIPE_ANGLE_THRESHOLD)
      
      // Check if swipe meets the threshold criteria
      const meetsDistanceThreshold = Math.abs(translationX) > SWIPE_THRESHOLD
      const meetsVelocityThreshold = Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD
      
      // Determine swipe direction
      const isLeftSwipe = translationX < 0 && velocityX < 0
      const isRightSwipe = translationX > 0 && velocityX > 0
      
      // Trigger navigation if conditions are met
      if (isHorizontalSwipe && (meetsDistanceThreshold || meetsVelocityThreshold)) {
        if (isLeftSwipe) {
          navigateToTab('left')
        } else if (isRightSwipe) {
          navigateToTab('right')
        }
      }
    })
    .activeOffsetX([-10, 10]) // Only activate for horizontal movements
    .failOffsetY([-10, 10]) // Fail if vertical movement exceeds threshold

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <BottomTabNavigator />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}) 