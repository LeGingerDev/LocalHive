import React from "react"
import { View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"

import { useAlert, AlertService } from "./AlertService"

export const AlertUsageExample = () => {
  // Use the hook directly for custom alerts
  const { showAlert } = useAlert()

  const handleCustomAlert = () => {
    showAlert({
      title: "Custom Alert",
      message: "This is a custom alert with multiple buttons",
      buttons: [
        {
          label: "Option 1",
          onPress: () => console.log("Option 1 selected"),
        },
        {
          label: "Option 2",
          onPress: () => console.log("Option 2 selected"),
          preset: "filled",
        },
      ],
    })
  }

  // Use the service methods for common alert types
  const handleMessageAlert = () => {
    AlertService.showMessage("Information", "This is a simple informational message.", () =>
      console.log("OK button pressed"),
    )
  }

  const handleConfirmationAlert = () => {
    AlertService.showConfirmation(
      "Confirm Action",
      "Are you sure you want to proceed with this action?",
      () => console.log("Action confirmed"),
      () => console.log("Action cancelled"),
    )
  }

  const handleSuccessAlert = () => {
    AlertService.showSuccess("Your action was completed successfully!", () =>
      console.log("Success acknowledged"),
    )
  }

  const handleErrorAlert = () => {
    AlertService.showError("Something went wrong. Please try again.", () =>
      console.log("Retry requested"),
    )
  }

  return (
    <View style={$container}>
      <Button text="Show Custom Alert" onPress={handleCustomAlert} style={$button} />

      <Button text="Show Message Alert" onPress={handleMessageAlert} style={$button} />

      <Button text="Show Confirmation Alert" onPress={handleConfirmationAlert} style={$button} />

      <Button text="Show Success Alert" onPress={handleSuccessAlert} style={$button} />

      <Button text="Show Error Alert" onPress={handleErrorAlert} style={$button} />
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
