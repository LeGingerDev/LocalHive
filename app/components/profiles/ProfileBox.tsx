import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "@/components/Text"

export interface ProfileBoxProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
}

/**
 * Describe your component here
 */
export const ProfileBox = (props: ProfileBoxProps) => {
  const { style } = props
  const $styles = [$container, style]
  const { themed, theme } = useAppTheme();

  return (
    <View style={$styles}>
      <View style={themed($avatar)}>
        <Text style={themed($avatarInitial)}>S</Text>
      </View>
      <Text style={themed($name)}>Sarah Johnson</Text>
      <Text style={themed($email)}>sarah.johnson@email.com</Text>
    </View>
  )
}

const $container: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 24,
}

const $avatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.primary200,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
})

const $avatarInitial: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.palette.primary600,
  fontFamily: typography.primary.bold,
  fontSize: 32,
})

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: colors.text,
  marginBottom: 4,
})

const $email: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: colors.textDim,
})
