import React from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, ImageStyle } from "react-native"
import { Text } from "@/components/Text"
import { Icon, IconTypes } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface HeaderProps {
  title: string
  showBackButton?: boolean
  onBackPress?: () => void
  rightAction?: {
    icon?: IconTypes
    text?: string
    onPress: () => void
  }
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
}) => {
  const { themed } = useAppTheme()

  return (
    <View style={themed($headerContainer)}>
      {/* First column: Title (with optional back button) */}
      <View style={themed($leftColumn)}>
        {showBackButton && (
          <TouchableOpacity
            style={themed($backButton)}
            onPress={onBackPress}
            activeOpacity={0.8}
          >
            <Icon icon="back" size={24} style={themed($backButtonIcon)} />
          </TouchableOpacity>
        )}
        <Text style={themed($headerTitle(showBackButton))} numberOfLines={1} text={title} />
      </View>
      {/* Second column: Empty (for future use, flex: 1) */}
      <View style={themed($centerColumn)} />
      {/* Third column: Right actions */}
      <View style={themed($rightColumn)}>
        {rightAction && (
          <TouchableOpacity
            style={themed($actionButton)}
            onPress={rightAction.onPress}
            activeOpacity={0.8}
          >
            {rightAction.icon ? (
              <Icon icon={rightAction.icon} size={20} style={themed($actionIcon)} />
            ) : (
              <Text style={themed($actionText)} text={rightAction.text || ""} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Styles
const $headerContainer = (theme: any): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  height: 64, // or your preferred height
  backgroundColor: theme.colors.headerBackground,
  width: "100%",
  paddingTop: 0,
  paddingBottom: 0,
  marginBottom: spacing.md,
  // Add subtle shadow and border for visual polish
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  // Platform-specific shadow
  shadowColor: theme.colors.border,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2, // Android shadow
})

const $leftColumn = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: spacing.md,
})

const $centerColumn = (): ViewStyle => ({
  flex: 1,
})

const $rightColumn = ({ spacing }: any): ViewStyle => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  paddingRight: spacing.md,
})

const $headerTitle = (showBackButton: boolean) => (theme: any): TextStyle => ({
  fontFamily: theme.typography.primary.bold,
  fontSize: 22,
  color: theme.colors.text,
  textAlign: "left",
  marginLeft: showBackButton ? theme.spacing.sm : 0,
  // Remove vertical padding for perfect centering
  paddingVertical: 0,
})

const $backButton = ({ spacing }: any): ViewStyle => ({
  marginRight: spacing.sm,
  padding: spacing.xs,
  borderRadius: 8,
  // Remove vertical padding for perfect centering
  alignSelf: "center",
})

const $backButtonIcon = ({ colors }: any): ImageStyle => ({
  tintColor: colors.text,
})

const $actionButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
  borderRadius: 8,
})

const $actionIcon = ({ colors }: any): ImageStyle => ({
  tintColor: colors.text,
})

const $actionText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.tint,
})
