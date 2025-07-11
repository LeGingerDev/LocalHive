import React, { useCallback, useState, useEffect } from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import Animated from "react-native-reanimated"

import { BottomTabNavigator } from "@/navigators/BottomTabNavigator"
import type { BottomTabParamList } from "@/navigators/BottomTabNavigator"
import { useAppTheme } from "@/theme/context"

const { width: SCREEN_WIDTH } = Dimensions.get('window')

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
  
  // Define the tab routes in order
  const TAB_ROUTES: (keyof BottomTabParamList)[] = ['Home', 'Search', 'Add', 'Groups', 'Profile']
  
  // Track current tab index
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  
  // Animation values - simplified to prevent crashes
  const slideOffset = useSharedValue(0)
  const isAnimating = useSharedValue(false)
  
  // Configuration for swipe behavior
  const SWIPE_THRESHOLD = 80 // Increased threshold to prevent accidental swipes
  const SWIPE_VELOCITY_THRESHOLD = 400 // Increased velocity threshold

  // Simplified animated style
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: slideOffset.value * SCREEN_WIDTH * 0.3 // Increased from 0.1 to 0.3 for more movement
        }
      ]
    }
  })

  // Update current tab index when route changes
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('state', (e) => {
        try {
          const stackState = e.data.state
          const mainRoute = stackState?.routes?.find(route => (route.name as string) === 'Main')
          const bottomTabState = mainRoute?.state
          
          if (bottomTabState && bottomTabState.routes && bottomTabState.routes.length > 0 && bottomTabState.index !== undefined) {
            const currentRoute = bottomTabState.routes[bottomTabState.index]
            const tabIndex = TAB_ROUTES.indexOf(currentRoute.name as keyof BottomTabParamList)
            if (tabIndex !== -1) {
              setCurrentTabIndex(tabIndex)
            }
          }
        } catch (error) {
          console.error('Error updating tab index:', error)
        }
      })
      
      return unsubscribe
    }, [navigation])
  )

  // Also update on mount to get initial state
  useEffect(() => {
    try {
      const stackState = navigation.getState()
      const mainRoute = stackState?.routes?.find(route => (route.name as string) === 'Main')
      const bottomTabState = mainRoute?.state
      
      if (bottomTabState && bottomTabState.routes && bottomTabState.routes.length > 0 && bottomTabState.index !== undefined) {
        const currentRoute = bottomTabState.routes[bottomTabState.index]
        const tabIndex = TAB_ROUTES.indexOf(currentRoute.name as keyof BottomTabParamList)
        if (tabIndex !== -1) {
          setCurrentTabIndex(tabIndex)
        }
      }
    } catch (error) {
      console.error('Error getting initial tab index:', error)
    }
  }, [navigation])

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    try {
      const currentIndex = currentTabIndex
      let targetIndex: number
      
      if (direction === 'left') {
        targetIndex = Math.min(currentIndex + 1, TAB_ROUTES.length - 1)
      } else {
        targetIndex = Math.max(currentIndex - 1, 0)
      }
      
      // Only navigate if we're actually changing tabs
      if (targetIndex !== currentIndex) {
        const targetRoute = TAB_ROUTES[targetIndex]
        
        // Simple navigation without complex animation
        runOnJS(() => {
          try {
            ;(navigation as any).navigate('Main', { screen: targetRoute })
          } catch (error) {
            console.error('Navigation error:', error)
          }
        })()
      }
    } catch (error) {
      console.error('Error in navigateToTab:', error)
    }
  }, [navigation, currentTabIndex])

  // Simplified swipe gesture
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
    })
    .onUpdate((event) => {
      'worklet';
      // Don't allow gesture during animation
      if (isAnimating.value) return;
      
      // More responsive feedback - increased intensity
      const progress = Math.min(Math.abs(event.translationX) / SCREEN_WIDTH, 1.0); // Increased from 0.5 to 1.0
      slideOffset.value = event.translationX > 0 ? progress : -progress;
    })
    .onEnd((event) => {
      'worklet';
      // Don't process if animating
      if (isAnimating.value) return;
      
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
          runOnJS(navigateToTab)('left')
        } else if (isRightSwipe) {
          runOnJS(navigateToTab)('right')
        }
      }
      
      // Always reset slide
      slideOffset.value = withTiming(0, { duration: 200 });
    })
    .activeOffsetX([-15, 15]) // Increased activation threshold
    .failOffsetY([-30, 30]) // Increased fail threshold

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
        <Animated.View style={[styles.animatedContainer, animatedContainerStyle]}>
          <BottomTabNavigator />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
}) 