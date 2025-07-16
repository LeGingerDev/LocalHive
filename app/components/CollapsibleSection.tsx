import React, { useRef, useEffect, useState } from "react"
import { View, Animated, Easing, ViewStyle } from "react-native"

interface CollapsibleSectionProps {
  collapsed: boolean
  onAnimationComplete?: () => void
  children: React.ReactNode
  style?: ViewStyle
  animationDuration?: number
  renderCollapsedContent?: () => React.ReactNode
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  collapsed,
  onAnimationComplete,
  children,
  style,
  animationDuration = 300,
  renderCollapsedContent,
}) => {
  const opacityAnim = useRef(new Animated.Value(1)).current
  const [isContentVisible, setIsContentVisible] = useState(!collapsed)
  const [isCollapsedContentVisible, setIsCollapsedContentVisible] = useState(collapsed)

  useEffect(() => {
    const easing = Easing.out(Easing.cubic)

    if (collapsed) {
      // Fade out the main content
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: animationDuration,
        easing,
        useNativeDriver: true,
      }).start(() => {
        // After fade out, hide the content and show collapsed content
        setIsContentVisible(false)
        setIsCollapsedContentVisible(true)
        onAnimationComplete?.()
      })
    } else {
      // Hide collapsed content immediately and show main content
      setIsCollapsedContentVisible(false)
      setIsContentVisible(true)

      // Fade in the main content
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: animationDuration,
        easing,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.()
      })
    }
  }, [collapsed, opacityAnim, animationDuration, onAnimationComplete])

  return (
    <View style={style}>
      {/* Main content */}
      {isContentVisible && (
        <Animated.View style={{ opacity: opacityAnim }}>{children}</Animated.View>
      )}

      {/* Collapsed content */}
      {isCollapsedContentVisible && renderCollapsedContent && (
        <Animated.View
          style={{
            opacity: opacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          {renderCollapsedContent()}
        </Animated.View>
      )}
    </View>
  )
}
