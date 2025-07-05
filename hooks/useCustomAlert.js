import { useState, useCallback } from 'react';

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((title, message, buttons = [{ text: 'OK' }]) => {
    // Make sure all buttons have an onPress handler that hides the alert
    const buttonsWithDismiss = buttons.map(button => ({
      ...button,
      onPress: () => {
        hideAlert();
        if (button.onPress) {
          button.onPress();
        }
      }
    }));

    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttonsWithDismiss,
    });
  }, [hideAlert]);

  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
}; 