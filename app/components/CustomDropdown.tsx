import React, { useState, useRef, useEffect } from "react"
import {
  Modal,
  View,
  TouchableOpacity,
  FlatList,
  StyleProp,
  ViewStyle,
  TextStyle,
  Pressable,
  Animated,
  Easing,
} from "react-native"

import { HapticService } from "@/services/hapticService"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

export interface CustomDropdownOption {
  label: string
  value: string
}

export interface CustomDropdownProps {
  options: CustomDropdownOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  style?: StyleProp<ViewStyle>
  testID?: string
  disabled?: boolean
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  style,
  testID = "customDropdownComponent",
  disabled = false,
}) => {
  const { themed, theme } = useAppTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 120,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start()
    }
  }, [modalVisible, scaleAnim])

  const handleSelect = (val: string) => {
    if (disabled) return
    HapticService.selection()
    onChange(val)
    setModalVisible(false)
  }

  return (
    <>
      <Pressable
        style={[themed($dropdownContainer), style, disabled && themed($dropdownDisabled)]}
        onPress={() => {
          if (!disabled) {
            HapticService.light()
            setModalVisible(true)
          }
        }}
        accessibilityRole="button"
        testID={testID}
        disabled={disabled}
      >
        <Text
          style={[themed($dropdownText), disabled && themed($dropdownTextDisabled)]}
          text={selectedOption ? selectedOption.label : placeholder}
          numberOfLines={1}
        />
        <Text
          style={[themed($chevron), disabled && themed($chevronDisabled)]}
          text={modalVisible ? "▲" : "▼"}
        />
      </Pressable>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setModalVisible(false)}>
          <Animated.View style={[themed($modalContent), { transform: [{ scale: scaleAnim }] }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[themed($option), value === item.value && themed($optionSelected)]}
                  onPress={() => handleSelect(item.value)}
                  accessibilityRole="button"
                  testID={`${testID}_option_${item.value}`}
                >
                  <Text
                    style={[
                      themed($optionText),
                      value === item.value && themed($optionTextSelected),
                    ]}
                    text={item.label}
                  />
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}

const $dropdownContainer = ({ colors, spacing }: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 2,
  borderColor: "#fff",
  borderRadius: 12,
  backgroundColor: colors.input || colors.cardColor,
  paddingHorizontal: spacing.sm,
  height: 48,
  marginBottom: spacing.md,
})

const $dropdownText = ({ colors, typography }: any): TextStyle => ({
  flex: 1,
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 16,
})

const $chevron = ({ colors }: any): TextStyle => ({
  color: colors.text,
  fontSize: 18,
  marginLeft: 8,
})

const $modalOverlay = ({ colors }: any): ViewStyle => ({
  flex: 1,
  backgroundColor: colors.backgroundOverlay || "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContent = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.input || colors.cardColor,
  borderRadius: 16,
  paddingVertical: spacing.sm,
  width: "80%",
  maxWidth: 400,
  borderWidth: 1,
  borderColor: "#fff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 8,
})

const $option = ({ colors }: any): ViewStyle => ({
  paddingVertical: 14,
  paddingHorizontal: 18,
})

const $optionSelected = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 8,
})

const $optionText = ({ colors, typography }: any): TextStyle => ({
  color: colors.text,
  fontFamily: typography.primary.normal,
  fontSize: 16,
})

const $optionTextSelected = ({ colors, typography }: any): TextStyle => ({
  color: colors.orange || "#FFA500",
  fontFamily: typography.primary.bold,
})

const $dropdownDisabled = ({ colors }: any): ViewStyle => ({
  opacity: 0.5,
  backgroundColor: colors.palette?.neutral200 || colors.input,
})

const $dropdownTextDisabled = ({ colors }: any): TextStyle => ({
  color: colors.textDim || colors.text,
})

const $chevronDisabled = ({ colors }: any): TextStyle => ({
  color: colors.textDim || colors.text,
})
