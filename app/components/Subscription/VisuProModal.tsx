import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { Icon } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface VisuProModalProps {
  visible: boolean
  onClose: () => void
  onStartTrial: () => void
  style?: StyleProp<ViewStyle>
}

export const VisuProModal: React.FC<VisuProModalProps> = ({
  visible,
  onClose,
  onStartTrial,
  style,
}) => {
  const { themed, theme } = useAppTheme()

  const features = [
    {
      title: "AI-Powered Smart Search",
      description: "Ask in natural language, get perfect results",
    },
    {
      title: "Unlimited Searches",
      description: "No limits on AI-powered queries",
    },
    {
      title: "Smart Recommendations",
      description: "Get personalized suggestions based on your location",
    },
    {
      title: "Early Access to New Features",
      description: "Be the first to try new capabilities",
    },
  ]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={themed($overlay)}>
        <View style={[themed($modalContainer), style]}>
          {/* Close button */}
          <TouchableOpacity style={themed($closeButton)} onPress={onClose}>
            <Icon icon="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={themed($contentContainer)}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with pricing */}
            <View style={themed($headerContainer)}>
              <Text style={themed($price)}>$5.99</Text>
              <Text style={themed($pricePeriod)}>/month</Text>
            </View>
            <Text style={themed($cancelText)}>Cancel anytime</Text>

            {/* Features list */}
            <View style={themed($featuresContainer)}>
              {features.map((feature, index) => (
                <View key={index} style={themed($featureItem)}>
                  <View style={themed($featureIcon)}>
                    <Icon icon="check" size={16} color="white" />
                  </View>
                  <View style={themed($featureTextContainer)}>
                    <Text style={themed($featureTitle)}>{feature.title}</Text>
                    <Text style={themed($featureDescription)}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* CTA Button */}
          <View style={themed($buttonContainer)}>
            <TouchableOpacity style={themed($gradientButton)} onPress={onStartTrial}>
              <LinearGradient
                colors={theme.colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={themed($gradientStyle)}
              >
                <Text style={themed($buttonText)}>Start 3-Day Free Trial</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 20,
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.cardColor,
  borderRadius: 20,
  width: "100%",
  maxWidth: 400,
  maxHeight: "80%",
  position: "relative",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 10,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.md,
  right: spacing.md,
  zIndex: 1,
  padding: spacing.xs,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  paddingTop: spacing.xl + spacing.lg,
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "center",
  marginBottom: spacing.xxs,
})

const $price: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 32,
  color: colors.text,
  lineHeight: 38,
})

const $pricePeriod: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 18,
  color: colors.textDim,
  marginLeft: spacing.xxs,
})

const $cancelText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $featuresContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $featureItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.lg,
})

const $featureIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.success,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.md,
  marginTop: 2,
})

const $featureTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $featureTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $featureDescription: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  paddingTop: 0,
})

const $gradientButton: ThemedStyle<ViewStyle> = () => ({
  borderRadius: 12,
  overflow: "hidden",
})

const $gradientStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
  justifyContent: "center",
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: "white",
  textAlign: "center",
})

export default VisuProModal 