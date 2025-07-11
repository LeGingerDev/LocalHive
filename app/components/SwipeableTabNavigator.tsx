import React, { useRef, useCallback, useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { runOnJS } from "react-native-reanimated"

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
  
  // Define the tab routes in order
  const TAB_ROUTES: (keyof BottomTabParamList)[] = ['Home', 'Search', 'Add', 'Groups', 'Profile']
  
  // Track current tab index
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  
  // Debug logging on mount
  useEffect(() => {
    console.log('SwipeableTabNavigator mounted with TAB_ROUTES:', TAB_ROUTES);
    console.log('Initial currentTabIndex:', currentTabIndex);
  }, []);
  
  // Configuration for swipe behavior
  const SWIPE_THRESHOLD = 30 // Minimum distance to trigger navigation (lowered from 50)
  const SWIPE_VELOCITY_THRESHOLD = 200 // Minimum velocity to trigger navigation (lowered from 500)
  const SWIPE_ANGLE_THRESHOLD = 45 // Maximum angle deviation from horizontal (increased from 30)

  // Update current tab index when route changes
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('state', (e) => {
        // Get the bottom tab navigator state from the nested structure
        const stackState = e.data.state
        const mainRoute = stackState?.routes?.find(route => (route.name as string) === 'Main')
        const bottomTabState = mainRoute?.state
        
        if (bottomTabState && bottomTabState.routes && bottomTabState.routes.length > 0 && bottomTabState.index !== undefined) {
          const currentRoute = bottomTabState.routes[bottomTabState.index]
          console.log('Bottom tab state changed, current route:', currentRoute.name);
          const tabIndex = TAB_ROUTES.indexOf(currentRoute.name as keyof BottomTabParamList)
          if (tabIndex !== -1) {
            console.log('Setting currentTabIndex to:', tabIndex);
            setCurrentTabIndex(tabIndex)
          }
        }
      })
      
      return unsubscribe
    }, [navigation])
  )

  // Also update on mount to get initial state
  useEffect(() => {
    const stackState = navigation.getState()
    const mainRoute = stackState?.routes?.find(route => (route.name as string) === 'Main')
    const bottomTabState = mainRoute?.state
    
    if (bottomTabState && bottomTabState.routes && bottomTabState.routes.length > 0 && bottomTabState.index !== undefined) {
      const currentRoute = bottomTabState.routes[bottomTabState.index]
      console.log('Initial bottom tab route on mount:', currentRoute.name);
      const tabIndex = TAB_ROUTES.indexOf(currentRoute.name as keyof BottomTabParamList)
      if (tabIndex !== -1) {
        console.log('Setting initial currentTabIndex to:', tabIndex);
        setCurrentTabIndex(tabIndex)
      }
    }
  }, [navigation])

  // Get current tab index and available routes
  const getCurrentTabIndex = useCallback((): number => {
    return currentTabIndex
  }, [currentTabIndex])

  const getTabRoutes = useCallback((): string[] => {
    console.log('getTabRoutes called, returning:', TAB_ROUTES);
    return TAB_ROUTES
  }, [])

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    console.log('navigateToTab called with direction:', direction);
    
    const currentIndex = getCurrentTabIndex()
    const routes = getTabRoutes()
    
    console.log('Current state:', { currentIndex, routes });
    
    let targetIndex: number
    
    if (direction === 'left') {
      // Swipe left = go to next tab (higher index)
      targetIndex = Math.min(currentIndex + 1, routes.length - 1)
    } else {
      // Swipe right = go to previous tab (lower index)
      targetIndex = Math.max(currentIndex - 1, 0)
    }
    
    console.log('Target index:', targetIndex);
    
    // Only navigate if we're actually changing tabs
    if (targetIndex !== currentIndex) {
      const targetRoute = routes[targetIndex]
      console.log('Navigating to route:', targetRoute);
      // Use nested navigator syntax for bottom tabs
      ;(navigation as any).navigate('Main', { screen: targetRoute })
    } else {
      console.log('No navigation needed - already at target index');
    }
  }, [navigation, getCurrentTabIndex, getTabRoutes])

  // Create the swipe gesture
  const swipeGesture = Gesture.Pan()
    .onBegin((event) => {
      'worklet';
      console.log('Swipe gesture began');
    })
    .onUpdate((event) => {
      'worklet';
      // Optional: Add visual feedback during swipe
    })
    .onEnd((event) => {
      'worklet';
      const { translationX, velocityX, translationY, velocityY } = event
      
      console.log('Swipe ended:', { translationX, velocityX, translationY, velocityY });
      
      // Simplified logic: just check if it's a horizontal swipe with enough distance
      const isHorizontalSwipe = Math.abs(translationY) < Math.abs(translationX) * 0.5
      const meetsDistanceThreshold = Math.abs(translationX) > SWIPE_THRESHOLD
      const meetsVelocityThreshold = Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD
      
      console.log('Swipe conditions:', { isHorizontalSwipe, meetsDistanceThreshold, meetsVelocityThreshold });
      
      // Determine swipe direction
      const isLeftSwipe = translationX < 0
      const isRightSwipe = translationX > 0
      
      // Trigger navigation if conditions are met
      if (isHorizontalSwipe && (meetsDistanceThreshold || meetsVelocityThreshold)) {
        console.log('Triggering navigation:', isLeftSwipe ? 'left' : 'right');
        if (isLeftSwipe) {
          runOnJS(navigateToTab)('left')
        } else if (isRightSwipe) {
          runOnJS(navigateToTab)('right')
        }
      }
    })
    .activeOffsetX([-5, 5]) // Only activate for horizontal movements (lowered from 10)
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds threshold (increased from 10)

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