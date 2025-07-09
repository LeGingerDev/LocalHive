# Alert Component

A modern, customizable alert modal component for React Native applications.

## Features

- 🎨 Modern design with customizable styles
- 🔄 Smooth animations for showing and hiding
- 🔘 Support for multiple buttons with different presets
- 🖼️ Optional icon display
- 🌗 Works with both light and dark themes
- 🧩 Flexible API for various use cases
- 🔌 Service-based implementation for easy global usage

## Basic Usage

### Direct Component Usage

```tsx
import { Alert } from "@/components/Alert"
import { useState } from "react"

const MyComponent = () => {
  const [alertVisible, setAlertVisible] = useState(false)
  
  return (
    <>
      <Button text="Show Alert" onPress={() => setAlertVisible(true)} />
      
      <Alert
        visible={alertVisible}
        title="Information"
        message="This is an alert message"
        buttons={[
          { label: "OK", onPress: () => setAlertVisible(false) }
        ]}
        onBackdropPress={() => setAlertVisible(false)}
      />
    </>
  )
}
```

### Using the AlertProvider and Service

First, wrap your application with the `AlertProvider`:

```tsx
// In your app.tsx or root component
import { AlertProvider } from "@/components/Alert"

const App = () => {
  return (
    <AlertProvider>
      {/* Your app components */}
    </AlertProvider>
  )
}
```

Then use the `useAlert` hook or `AlertService` in your components:

```tsx
import { useAlert, AlertService } from "@/components/Alert"

const MyComponent = () => {
  // Using the hook directly
  const { showAlert } = useAlert()
  
  const handleShowCustomAlert = () => {
    showAlert({
      title: "Custom Alert",
      message: "This is a custom alert",
      buttons: [
        { label: "Cancel", preset: "default" },
        { label: "OK", preset: "filled", onPress: () => console.log("OK pressed") }
      ]
    })
  }
  
  // Using the service methods
  const handleShowSuccessAlert = () => {
    AlertService.showSuccess("Operation completed successfully!")
  }
  
  const handleShowErrorAlert = () => {
    AlertService.showError("Something went wrong", () => {
      // Retry logic
    })
  }
  
  return (
    <>
      <Button text="Show Custom Alert" onPress={handleShowCustomAlert} />
      <Button text="Show Success Alert" onPress={handleShowSuccessAlert} />
      <Button text="Show Error Alert" onPress={handleShowErrorAlert} />
    </>
  )
}
```

## Props

### Alert Component Props

| Prop | Type | Description |
|------|------|-------------|
| `visible` | boolean | Controls the visibility of the alert |
| `title` | string | The title text of the alert |
| `message` | string | The message text of the alert |
| `icon` | IconTypes | Optional icon to display at the top of the alert |
| `iconColor` | string | Optional color for the icon |
| `buttons` | AlertButton[] | Array of button configurations |
| `onBackdropPress` | () => void | Called when the backdrop is pressed |
| `dismissable` | boolean | Whether the alert can be dismissed by tapping outside |
| `style` | StyleProp<ViewStyle> | Optional style override for the alert container |
| `titleStyle` | StyleProp<TextStyle> | Optional style override for the title |
| `messageStyle` | StyleProp<TextStyle> | Optional style override for the message |

### AlertButton Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | string | The text to display on the button |
| `preset` | "default" \| "filled" \| "reversed" | The button style preset |
| `onPress` | () => void | Called when the button is pressed |
| `...ButtonProps` | ButtonProps | All other props from the Button component |

## AlertService Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `showMessage` | (title: string, message: string, onOk?: () => void) | Shows a simple message alert with an OK button |
| `showConfirmation` | (title: string, message: string, onConfirm: () => void, onCancel?: () => void) | Shows a confirmation alert with Yes/No buttons |
| `showSuccess` | (message: string, onOk?: () => void) | Shows a success alert with a check icon |
| `showError` | (message: string, onRetry?: () => void) | Shows an error alert with an X icon |

## Examples

Check out the following example components:

- `AlertDemo.tsx` - Shows different types of alerts using the direct component approach
- `AlertUsageExample.tsx` - Shows how to use the AlertService and useAlert hook 