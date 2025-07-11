import React, { useEffect, useRef } from "react"
import { View, Modal, TouchableOpacity, ViewStyle, TextStyle, Animated } from "react-native"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

interface CustomAlertProps {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  confirmStyle?: "default" | "destructive" | "success"
}

export const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  confirmText = "OK", 
  cancelText = "Cancel",
  onConfirm, 
  onCancel,
  confirmStyle = "default"
}: CustomAlertProps) => {
  const { themed } = useAppTheme()
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, fadeAnim, scaleAnim])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            themed($modalContainer), 
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <View style={themed($contentContainer)}>
            <Text style={themed($title)} text={title} />
            <Text style={themed($message)} text={message} />
            
            <View style={themed($buttonContainer)}>
              {onCancel && (
                <TouchableOpacity 
                  style={themed($cancelButton)} 
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text style={themed($cancelButtonText)} text={cancelText} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  themed((theme) => $confirmButton(theme, confirmStyle)),
                  !onCancel && themed($singleButton)
                ]} 
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text 
                  style={themed($confirmButtonText)}
                  text={confirmText} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Styles
const $overlay = (): ViewStyle => ({ 
  flex: 1, 
  backgroundColor: "rgba(0, 0, 0, 0.6)", 
  justifyContent: "center", 
  alignItems: "center",
  padding: 20
})

const $modalContainer = ({ colors }: any): ViewStyle => ({ 
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: 0,
  width: "100%",
  maxWidth: 320,
  shadowColor: colors.palette?.neutral900 || "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8
})

const $contentContainer = ({ spacing }: any): ViewStyle => ({ 
  padding: 24
})

const $title = ({ typography, colors }: any): TextStyle => ({ 
  fontFamily: typography.primary.bold, 
  fontSize: 18, 
  color: colors.text, 
  textAlign: "center", 
  marginBottom: 12 
})

const $message = ({ typography, colors }: any): TextStyle => ({ 
  fontFamily: typography.primary.normal, 
  fontSize: 16, 
  color: colors.textDim, 
  textAlign: "center", 
  marginBottom: 24,
  lineHeight: 22
})

const $buttonContainer = (): ViewStyle => ({ 
  flexDirection: "row", 
  gap: 12 
})

const $cancelButton = ({ colors }: any): ViewStyle => ({ 
  flex: 1,
  backgroundColor: colors.primary100, 
  borderRadius: 12, 
  paddingVertical: 14, 
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center"
})

const $cancelButtonText = ({ colors, typography }: any): TextStyle => ({ 
  color: colors.tint, 
  fontFamily: typography.primary.medium, 
  fontSize: 16,
  textAlign: "center"
})

const $confirmButton = ({ colors }: any, confirmStyle: string) => {
  let backgroundColor = colors.primary400
  if (confirmStyle === "destructive") backgroundColor = colors.error
  else if (confirmStyle === "success") backgroundColor = colors.tint
  else if (confirmStyle === "default") backgroundColor = colors.tint
  return {
    flex: 1,
    backgroundColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const
  }
}

const $confirmButtonText = ({ typography }: any) => ({
  color: "#fff",
  fontFamily: typography.primary.bold,
  fontSize: 16,
  textAlign: "center" as const
})

const $destructiveButton = ({ colors }: any): ViewStyle => ({ 
  backgroundColor: colors.error
})

const $destructiveButtonText = ({ colors }: any): TextStyle => ({ 
  color: colors.background
})

const $successButton = ({ colors }: any): ViewStyle => ({ 
  backgroundColor: colors.tint
})

const $successButtonText = ({ colors }: any): TextStyle => ({ 
  color: colors.background
})

const $singleButton = (): ViewStyle => ({ 
  flex: 1 
}) 