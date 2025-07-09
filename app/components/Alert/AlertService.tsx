import React, { createContext, useContext, useState, ReactNode } from "react"

import { Alert, AlertProps } from "./Alert"

// Omit the 'visible' prop since it will be managed by the service
type AlertOptions = Omit<AlertProps, "visible">

interface AlertContextType {
  showAlert: (options: AlertOptions) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}

interface AlertProviderProps {
  children: ReactNode
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alertProps, setAlertProps] = useState<AlertOptions | null>(null)
  const [visible, setVisible] = useState(false)

  const showAlert = (options: AlertOptions) => {
    setAlertProps(options)
    setVisible(true)
  }

  const hideAlert = () => {
    setVisible(false)
    // We don't immediately clear the props to allow the closing animation to complete
    setTimeout(() => {
      setAlertProps(null)
    }, 300)
  }

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertProps && (
        <Alert
          {...alertProps}
          visible={visible}
          onBackdropPress={alertProps.dismissable !== false ? hideAlert : undefined}
          buttons={alertProps.buttons?.map((button) => ({
            ...button,
            onPress: () => {
              button.onPress?.()
              hideAlert()
            },
          }))}
        />
      )}
    </AlertContext.Provider>
  )
}

// Utility functions for common alert types
export const AlertService = {
  // Show a simple alert with a message and OK button
  showMessage: (title: string, message: string, onOk?: () => void) => {
    const context = useAlert()
    context.showAlert({
      title,
      message,
      buttons: [{ label: "OK", preset: "filled", onPress: onOk }],
    })
  },

  // Show a confirmation alert with Yes/No buttons
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => {
    const context = useAlert()
    context.showAlert({
      title,
      message,
      buttons: [
        { label: "No", preset: "default", onPress: onCancel },
        { label: "Yes", preset: "filled", onPress: onConfirm },
      ],
    })
  },

  // Show a success alert
  showSuccess: (message: string, onOk?: () => void) => {
    const context = useAlert()
    context.showAlert({
      title: "Success",
      message,
      buttons: [{ label: "OK", preset: "filled", onPress: onOk }],
    })
  },

  // Show an error alert
  showError: (message: string, onRetry?: () => void) => {
    const context = useAlert()
    context.showAlert({
      title: "Error",
      message,
      buttons: onRetry
        ? [
            { label: "Try Again", preset: "filled", onPress: onRetry },
            { label: "Cancel", preset: "default" },
          ]
        : [{ label: "OK", preset: "default" }],
    })
  },
}
