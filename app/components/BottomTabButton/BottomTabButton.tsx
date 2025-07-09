import React from "react"
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native"
import { useAppTheme } from "@/theme/context"
import { Icon, IconTypes } from "@/components/Icon"

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
        style={[
          styles.addButtonContainer,
          { shadowColor: theme.colors.palette.primary400 },
        ]}
      >
        <View
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.palette.primary400, borderColor: focused ? theme.colors.palette.accent200 : "#fff" },
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
      <Icon icon={icon} size={24} color={focused ? theme.colors.palette.primary400 : theme.colors.textDim} />
      <Text style={[styles.label, { color: focused ? theme.colors.palette.primary400 : theme.colors.textDim }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -32,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  addButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    borderWidth: 4,
    width: 64,
    height: 64,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
}) 