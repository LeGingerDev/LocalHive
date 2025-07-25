import React, { FC, memo, useState, useEffect } from "react"
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
  TouchableOpacity,
  Image,
  ImageStyle,
} from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// #region Types & Interfaces
export interface AvatarProps {
  /**
   * The URL of the avatar image
   */
  imageUrl?: string | null

  /**
   * The initials to display if no image is provided
   */
  initials?: string

  /**
   * The size of the avatar (default: 44)
   */
  size?: number

  /**
   * Whether the avatar is clickable
   */
  clickable?: boolean

  /**
   * Callback when avatar is pressed
   */
  onPress?: () => void

  /**
   * Style overrides for the container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Style overrides for the image
   */
  imageStyle?: StyleProp<ImageStyle>

  /**
   * Style overrides for the initials text
   */
  textStyle?: StyleProp<TextStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
// #endregion

// #region Component
/**
 * Avatar - A component that displays either a profile image or initials
 * 
 * Features:
 * - Displays profile image if available
 * - Falls back to initials if no image
 * - Supports different sizes
 * - Clickable with press feedback
 * - Consistent styling with theme
 */
export const Avatar: FC<AvatarProps> = memo((props) => {
  const {
    imageUrl,
    initials = "?",
    size = 44,
    clickable = false,
    onPress,
    style: styleOverride,
    imageStyle: imageStyleOverride,
    textStyle: textStyleOverride,
    testID = "avatarComponent",
  } = props

  const { themed } = useAppTheme()
  
  // State for cache-busting
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now())
  
  // Update cache buster when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setCacheBuster(Date.now())
    }
  }, [imageUrl]) // Remove cacheBuster from dependencies to prevent infinite loop

  // Generate avatar color based on initials
  const avatarColors = ["primary300", "accent200", "secondary300", "primary200", "accent300"]
  const colorIndex = initials.length % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  // Memoized styles
  const containerStyle = [
    themed($container(size)),
    themed($avatarColor(avatarColor)),
    styleOverride,
  ]

  const imageStyle = [
    themed($image(size)),
    imageStyleOverride,
  ]

  const textStyle = [
    themed($text(size)),
    textStyleOverride,
  ]

  const hasImage = !!imageUrl

  const renderContent = () => {
    if (hasImage) {
      // Add cache-busting parameter to force image reload
      const separator = imageUrl!.includes('?') ? '&' : '?'
      const cacheBustedUrl = `${imageUrl}${separator}_cb=${cacheBuster}`
      
      return (
        <Image
          key={`${imageUrl}-${cacheBuster}`} // More aggressive cache busting
          source={{ uri: cacheBustedUrl }}
          style={imageStyle}
          testID={`${testID}_image`}
        />
      )
    }

    return (
      <View style={themed($textContainer)} testID={`${testID}_initials`}>
        <Text style={textStyle} text={initials.charAt(0).toUpperCase()} />
      </View>
    )
  }

  if (clickable && onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {renderContent()}
      </TouchableOpacity>
    )
  }

  return (
    <View style={containerStyle} testID={testID}>
      {renderContent()}
    </View>
  )
})

// Set display name for debugging
Avatar.displayName = "Avatar"
// #endregion

// #region Styles
const $container = (size: number): ThemedStyle<ViewStyle> => ({ colors }) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderWidth: 2,
  borderColor: colors.palette.primary400,
})

const $avatarColor = (colorKey: string): ThemedStyle<ViewStyle> => ({ colors }) => ({
  backgroundColor: colors.palette[colorKey as keyof typeof colors.palette] || colors.palette.primary300,
})

const $image = (size: number): ThemedStyle<ImageStyle> => () => ({
  width: size,
  height: size,
  borderRadius: size / 2,
})

const $textContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
})

const $text = (size: number): ThemedStyle<TextStyle> => ({ colors, typography }) => ({
  color: colors.palette.neutral100,
  fontFamily: typography.primary.medium,
  fontSize: Math.max(12, size * 0.4), // Responsive font size
  textAlign: "center",
})
// #endregion 