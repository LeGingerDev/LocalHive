import React, { useState } from "react"
import { View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { useAppTheme } from "@/theme/context"

import { Alert } from "./Alert"

export const AlertDemo = () => {
  const [basicAlertVisible, setBasicAlertVisible] = useState(false)
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false)
  const [successAlertVisible, setSuccessAlertVisible] = useState(false)
  const [errorAlertVisible, setErrorAlertVisible] = useState(false)

  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <View style={$container}>
      <Button text="Show Basic Alert" onPress={() => setBasicAlertVisible(true)} style={$button} />

      <Button
        text="Show Confirm Alert"
        onPress={() => setConfirmAlertVisible(true)}
        style={$button}
      />

      <Button
        text="Show Success Alert"
        onPress={() => setSuccessAlertVisible(true)}
        style={$button}
      />

      <Button text="Show Error Alert" onPress={() => setErrorAlertVisible(true)} style={$button} />

      {/* Basic Alert */}
      <Alert
        visible={basicAlertVisible}
        title="Information"
        message="This is a basic alert with a simple message and a close button."
        buttons={[{ label: "Close", onPress: () => setBasicAlertVisible(false) }]}
        onBackdropPress={() => setBasicAlertVisible(false)}
      />

      {/* Confirm Alert */}
      <Alert
        visible={confirmAlertVisible}
        title="Confirm Action"
        message="Are you sure you want to perform this action? This cannot be undone."
        buttons={[
          {
            label: "Cancel",
            onPress: () => setConfirmAlertVisible(false),
            preset: "default",
          },
          {
            label: "Confirm",
            onPress: () => {
              // Handle confirmation
              setConfirmAlertVisible(false)
            },
            preset: "filled",
          },
        ]}
        onBackdropPress={() => setConfirmAlertVisible(false)}
      />

      {/* Success Alert */}
      <Alert
        visible={successAlertVisible}
        title="Success!"
        message="Your action was completed successfully."
        buttons={[
          {
            label: "OK",
            onPress: () => setSuccessAlertVisible(false),
            preset: "filled",
          },
        ]}
        onBackdropPress={() => setSuccessAlertVisible(false)}
      />

      {/* Error Alert */}
      <Alert
        visible={errorAlertVisible}
        title="Error"
        message="Something went wrong. Please try again later."
        buttons={[
          {
            label: "Try Again",
            onPress: () => {
              // Handle retry
              setErrorAlertVisible(false)
            },
          },
          {
            label: "Cancel",
            onPress: () => setErrorAlertVisible(false),
            preset: "default",
          },
        ]}
        onBackdropPress={() => setErrorAlertVisible(false)}
      />
    </View>
  )
}

const $container: ViewStyle = {
  padding: 16,
  gap: 12,
}

const $button: ViewStyle = {
  marginVertical: 8,
}
