import React, { useRef, useEffect } from "react"
import { View, ViewStyle, TouchableOpacity, ScrollView, Modal, Animated, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { PRIVACY_POLICY_TEXT } from "@/constants/privacyPolicy"
import { TERMS_OF_SERVICE_TEXT } from "@/constants/termsOfService"

interface LegalModalsProps {
  termsVisible: boolean
  privacyVisible: boolean
  onCloseTerms: () => void
  onClosePrivacy: () => void
}

export const LegalModals = ({ 
  termsVisible, 
  privacyVisible, 
  onCloseTerms, 
  onClosePrivacy 
}: LegalModalsProps) => {
  const { themed } = useAppTheme()
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (termsVisible || privacyVisible) {
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
  }, [termsVisible, privacyVisible, fadeAnim, scaleAnim])

  return (
    <>
      {/* Terms of Service Modal */}
      <Modal visible={termsVisible} transparent animationType="none" onRequestClose={onCloseTerms}>
        <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              themed($modalContainer),
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={themed($contentContainer)}>
              <Text style={themed($title)}>Terms of Service</Text>
              
              <ScrollView 
                style={themed($scrollContainer)} 
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                contentContainerStyle={themed($scrollContent)}
              >
                <Text style={themed($policyText)}>
                  {TERMS_OF_SERVICE_TEXT}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={themed($closeButton)}
                onPress={onCloseTerms}
                activeOpacity={0.8}
              >
                <Text style={themed($closeButtonText)}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyVisible} transparent animationType="none" onRequestClose={onClosePrivacy}>
        <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              themed($modalContainer),
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={themed($contentContainer)}>
              <Text style={themed($title)}>Privacy Policy</Text>
              
              <ScrollView 
                style={themed($scrollContainer)} 
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                contentContainerStyle={themed($scrollContent)}
              >
                <Text style={themed($policyText)}>
                  {PRIVACY_POLICY_TEXT}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={themed($closeButton)}
                onPress={onClosePrivacy}
                activeOpacity={0.8}
              >
                <Text style={themed($closeButtonText)}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  )
}

// Styles
const $overlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
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
  elevation: 8,
})

const $contentContainer = ({ spacing }: any): ViewStyle => ({
  padding: 24,
})

const $title = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  textAlign: "center",
  marginBottom: 12,
})

const $scrollContainer = ({ spacing }: any): ViewStyle => ({
  maxHeight: 300,
  marginBottom: spacing.md,
})

const $scrollContent = ({ spacing }: any): ViewStyle => ({
  paddingBottom: spacing.sm,
})

const $policyText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  lineHeight: 20,
  color: colors.text,
})

const $closeButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.md,
})

const $closeButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 16,
  textAlign: "center",
}) 