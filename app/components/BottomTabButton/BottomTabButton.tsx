import React from "react"
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native"

import { Icon, IconTypes } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"

export interface BottomTabButtonProps {
  icon: IconTypes
  label: string
  focused?: boolean
  onPress?: (event: any) => void
  isAddButton?: boolean
}

export function BottomTabButton({
  icon,
  label,
  focused = false,
  onPress,
  isAddButton = false,
}: BottomTabButtonProps) {
  const { theme } = useAppTheme()

  if (isAddButton) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.addButtonContainer, { shadowColor: theme.colors.palette.primary400 }]}
      >
        <View
          style={[
            styles.addButton,
            {
              backgroundColor: theme.colors.palette.primary400,
              borderColor: focused ? theme.colors.palette.accent200 : "#fff",
            },
          ]}
        >
          <Icon icon={icon} size={38} color="#fff" />
        </View>
        <Text style={[styles.addLabel, { color: theme.colors.palette.primary400 }]}>{label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.buttonContainer}
    >
      <Icon
        icon={icon}
        size={24}
        color={focused ? theme.colors.palette.primary400 : theme.colors.textDim}
      />
      <Text
        style={[
          styles.label,
          { color: focused ? theme.colors.palette.primary400 : theme.colors.textDim },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -32,
    zIndex: 10,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
})
