import React, { useEffect } from "react"
import {
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from "react-native"
import { BlurView } from "expo-blur"

import { Button, ButtonProps } from "@/components/Button"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface AlertButton extends Omit<ButtonProps, "tx" | "text"> {
  /**
   * Text to display for the button
   */
  label: string
  /**
   * Button preset - primary, secondary, or tertiary
   */
  preset?: "default" | "filled" | "reversed"
  /**
   * Optional callback when button is pressed
   */
  onPress?: () => void
}

export interface AlertProps {
  /**
   * Is the modal visible?
   */
  visible: boolean
  /**
   * Alert title
   */
  title?: string
  /**
   * Alert message
   */
  message?: string
  /**
   * Array of buttons to display
   */
  buttons?: AlertButton[]
  /**
   * Called when the user taps outside of the alert
   */
  onBackdropPress?: () => void
  /**
   * Should the alert close when the backdrop is pressed
   */
  dismissable?: boolean
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
  /**
   * An optional style override for the title.
   */
  titleStyle?: StyleProp<TextStyle>
  /**
   * An optional style override for the message.
   */
  messageStyle?: StyleProp<TextStyle>
}

/**
 * A modern alert modal component with customizable content and buttons
 */
export const Alert = (props: AlertProps) => {
  const {
    visible,
    title,
    message,
    buttons = [],
    onBackdropPress,
    dismissable = true,
    style,
    titleStyle,
    messageStyle,
  } = props

  const {
    themed,
    themeContext,
    theme: { colors, spacing },
  } = useAppTheme()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const handleBackdropPress = () => {
    if (dismissable && onBackdropPress) {
      onBackdropPress()
    }
  }

  // Calculate max width based on screen dimensions
  const maxWidth = Math.min(400, width * 0.85)

  // Use theme-aware container style
  const $themedContainer: ViewStyle = {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: maxWidth,
    minWidth: 280,
    alignItems: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.palette.neutral800,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  }

  const $containerStyle = [$themedContainer, style]

  const $animatedContainerStyle = {
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  }

  // Theme-aware text styles
  const $themedTitle: TextStyle = {
    marginBottom: spacing.sm,
    textAlign: "center",
    color: colors.text,
    flexShrink: 1,
  }

  const $themedMessage: TextStyle = {
    marginBottom: buttons.length > 0 ? spacing.md : 0,
    textAlign: "center",
    color: colors.textDim,
    flexShrink: 1,
  }

  const $textContainer: ViewStyle = {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onBackdropPress}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={$backdrop}>
          <BlurView
            intensity={20}
            style={$blurView}
            tint={themeContext === "dark" ? "dark" : "light"}
          >
            <TouchableWithoutFeedback>
              <Animated.View style={[$containerStyle, $animatedContainerStyle]}>
                <View style={$textContainer}>
                  {title && (
                    <Text
                      weight="bold"
                      size="lg"
                      style={[$themedTitle, titleStyle]}
                      text={title}
                      adjustsFontSizeToFit={false}
                    />
                  )}

                  {message && (
                    <Text
                      weight="normal"
                      size="md"
                      style={[$themedMessage, messageStyle]}
                      text={message}
                      numberOfLines={0}
                    />
                  )}
                </View>

                {buttons.length > 0 && (
                  <View
                    style={[
                      buttons.length > 1 ? $buttonRowContainer : $buttonContainer,
                      { width: "100%" },
                    ]}
                  >
                    {buttons.map((button, index) => {
                      const {
                        label,
                        preset = "default",
                        style: buttonStyle,
                        onPress,
                        ...rest
                      } = button

                      return (
                        <Button
                          key={`alert-button-${index}`}
                          preset={preset}
                          text={label}
                          onPress={() => {
                            onPress?.()
                            if (onBackdropPress) onBackdropPress()
                          }}
                          style={[
                            buttons.length > 1 ? $buttonRow : $button,
                            buttonStyle,
                            index > 0 && buttons.length > 1 && { marginLeft: spacing.sm },
                          ]}
                          {...rest}
                        />
                      )
                    })}
                  </View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const { width } = Dimensions.get("window")
const isIOS = Platform.OS === "ios"

const $backdrop: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $blurView: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
}

const $buttonContainer: ViewStyle = {
  width: "100%",
}

const $buttonRowContainer: ViewStyle = {
  flexDirection: "row",
  width: "100%",
}

const $button: ViewStyle = {
  flex: 1,
  marginTop: 8,
}

const $buttonRow: ViewStyle = {
  flex: 1,
  marginTop: 8,
}
