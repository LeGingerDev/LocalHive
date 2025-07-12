import React, { useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
  withDelay,
  withRepeat,
} from "react-native-reanimated"
import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

import { useAppTheme } from "@/theme/context"

interface TabItem {
  name: string
  icon: string
  label: string
  IconComponent?: any
  iconSize?: number
}

interface AnimatedTabBarProps {
  state: any
  descriptors: any
  navigation: any
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedView = Animated.createAnimatedComponent(View)

export const AnimatedTabBar = ({ state, descriptors, navigation }: AnimatedTabBarProps) => {
  const { theme } = useAppTheme()

  const tabs: TabItem[] = [
    { name: "Home", icon: "home-outline", label: "Home", IconComponent: Ionicons, iconSize: 24 },
    {
      name: "Search",
      icon: "search-outline",
      label: "Search",
      IconComponent: Ionicons,
      iconSize: 24,
    },
    { name: "Add", icon: "add", label: "Add", IconComponent: Ionicons, iconSize: 38 },
    {
      name: "Groups",
      icon: "account-group-outline",
      label: "Groups",
      IconComponent: MaterialCommunityIcons,
      iconSize: 24,
    },
    {
      name: "Profile",
      icon: "person-outline",
      label: "Profile",
      IconComponent: Ionicons,
      iconSize: 24,
    },
  ]

  const renderTab = (tab: TabItem, index: number) => {
    const route = state.routes.find((r: any) => r.name === tab.name)
    const isFocused = state.index === index

    // Animation values
    const scale = useSharedValue(1)
    const translateY = useSharedValue(0)
    const opacity = useSharedValue(0.7)
    const iconScale = useSharedValue(1)
    const labelOpacity = useSharedValue(0.8)
    const glowOpacity = useSharedValue(0)
    const floatY = useSharedValue(0)

    // Entrance animation with staggered delay
    useEffect(() => {
      const delay = index * 100
      translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 150 }))
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
    }, [])

    // Focus animation
    useEffect(() => {
      if (isFocused) {
        scale.value = withSpring(1.05, { damping: 10, stiffness: 200 })
        iconScale.value = withSequence(
          withTiming(1.2, { duration: 150 }),
          withSpring(1, { damping: 8, stiffness: 300 }),
        )
        labelOpacity.value = withTiming(1, { duration: 200 })
        glowOpacity.value = withTiming(0.3, { duration: 300 })

        // Start floating animation for Add button
        if (tab.name === "Add") {
          floatY.value = withRepeat(
            withSequence(withTiming(-3, { duration: 1000 }), withTiming(0, { duration: 1000 })),
            -1,
            true,
          )
        }
      } else {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 })
        labelOpacity.value = withTiming(0.8, { duration: 200 })
        glowOpacity.value = withTiming(0, { duration: 200 })

        // Stop floating animation
        if (tab.name === "Add") {
          floatY.value = withTiming(0, { duration: 300 })
        }
      }
    }, [isFocused])

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { translateY: translateY.value + floatY.value }],
      opacity: opacity.value,
    }))

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: iconScale.value }],
    }))

    const animatedLabelStyle = useAnimatedStyle(() => ({
      opacity: labelOpacity.value,
    }))

    const animatedGlowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
    }))

    const onPress = () => {
      // Bounce animation on press
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.05, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 150 }),
      )

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      })

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      }
    }

    const IconComponent = tab.IconComponent || Ionicons

    // Special styling for Add button
    if (tab.name === "Add") {
      return (
        <AnimatedView key={tab.name} style={[styles.addButtonContainer, animatedContainerStyle]}>
          <AnimatedView
            style={[
              styles.addButtonGlow,
              animatedGlowStyle,
              { backgroundColor: isFocused ? theme.colors.palette.primary200 : "transparent" },
            ]}
          />
          <AnimatedTouchable
            onPress={onPress}
            style={[
              styles.addButton,
              {
                backgroundColor: isFocused
                  ? theme.colors.palette.primary500
                  : theme.colors.palette.primary400,
                borderColor: isFocused ? theme.colors.palette.accent400 : theme.colors.background,
                shadowColor: theme.colors.palette.neutral800,
              },
            ]}
            activeOpacity={0.9}
          >
            <AnimatedView style={animatedIconStyle}>
              <IconComponent name={tab.icon} size={tab.iconSize} color="#fff" />
            </AnimatedView>
          </AnimatedTouchable>
          <AnimatedText
            style={[
              styles.addButtonLabel,
              animatedLabelStyle,
              { color: isFocused ? theme.colors.palette.primary400 : theme.colors.textDim },
            ]}
          >
            {tab.label}
          </AnimatedText>
        </AnimatedView>
      )
    }

    // Add extra margin for Search and Groups buttons to create more space around Add button
    const extraMargin =
      tab.name === "Search" ? { marginRight: 20 } : tab.name === "Groups" ? { marginLeft: 20 } : {}

    return (
      <AnimatedTouchable
        key={tab.name}
        onPress={onPress}
        style={[styles.tabItem, animatedContainerStyle, extraMargin]}
        activeOpacity={0.8}
      >
        <AnimatedView style={[styles.iconContainer, animatedIconStyle]}>
          <IconComponent
            name={tab.icon}
            size={tab.iconSize}
            color={isFocused ? theme.colors.palette.primary400 : theme.colors.textDim}
          />
          {isFocused && tab.name !== "Add" && (
            <AnimatedView
              style={[styles.activeIndicator, { backgroundColor: theme.colors.palette.primary400 }]}
            />
          )}
        </AnimatedView>
        <AnimatedText
          style={[
            styles.tabLabel,
            { color: isFocused ? theme.colors.palette.primary400 : theme.colors.textDim },
            animatedLabelStyle,
          ]}
        >
          {tab.label}
        </AnimatedText>
      </AnimatedTouchable>
    )
  }

  return (
    <AnimatedView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedView
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.background,
            shadowColor: theme.colors.palette.neutral800,
          },
        ]}
      >
        {tabs.map((tab, index) => renderTab(tab, index))}
      </AnimatedView>
    </AnimatedView>
  )
}

const AnimatedText = Animated.createAnimatedComponent(Text)

const styles = StyleSheet.create({
  activeIndicator: {
    borderRadius: 2,
    height: 4,
    position: "absolute",
    top: -8,
    width: 4,
  },
  addButton: {
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 4,
    elevation: 10,
    height: 64,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 64,
  },
  addButtonContainer: {
    alignItems: "center",
    flex: 1.5,
    justifyContent: "center",
    position: "absolute",
    top: -32,
  },
  addButtonGlow: {
    backgroundColor: "transparent",
    borderRadius: 40,
    height: 80,
    opacity: 0.3,
    position: "absolute",
    width: 80,
  },
  addButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  container: {
    bottom: 0,
    left: 0,
    paddingBottom: 0,
    position: "absolute",
    right: 0,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: "relative",
  },
  tabBar: {
    alignItems: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    flexDirection: "row",
    height: 80,
    justifyContent: "space-around",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  tabItem: {
    alignItems: "center",
    flex: 1.2,
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
})
