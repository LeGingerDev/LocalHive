import React from "react"
import {
  Modal,
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextStyle,
  Animated,
} from "react-native"
import { BlurView } from "expo-blur"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface MenuOption {
  label: string
  onPress: () => void
  destructive?: boolean
}

interface ListMenuModalProps {
  visible: boolean
  onClose: () => void
  options: MenuOption[]
}

export const ListMenuModal: React.FC<ListMenuModalProps> = ({ visible, onClose, options }) => {
  const { themed, theme } = useAppTheme()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current

  React.useEffect(() => {
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

  const handleOptionPress = (option: MenuOption) => {
    option.onPress()
    onClose()
  }

  const $animatedContainerStyle = {
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={$backdrop}>
          <BlurView intensity={20} style={$blurView}>
            <TouchableWithoutFeedback>
              <Animated.View style={[themed($container), $animatedContainerStyle]}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      themed($optionButton),
                      index === 0 && themed($firstOption),
                      index === options.length - 1 && themed($lastOption),
                    ]}
                    onPress={() => handleOptionPress(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[themed($optionText), option.destructive && themed($destructiveText)]}
                      text={option.label}
                    />
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const $backdrop: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
}

const $blurView: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  overflow: "hidden",
  minWidth: 200,
  maxWidth: 280,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
})

const $optionButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0, 0, 0, 0.1)",
})

const $firstOption: ThemedStyle<ViewStyle> = () => ({
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
})

const $lastOption: ThemedStyle<ViewStyle> = () => ({
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16,
  borderBottomWidth: 0,
})

const $optionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})

const $destructiveText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})
