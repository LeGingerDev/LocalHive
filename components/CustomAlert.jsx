import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  buttons = [{ text: 'OK' }], 
  onDismiss 
}) => {
  const { theme, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    setModalVisible(visible);
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.centeredView}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: fadeAnim }
            ]}
          />
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalView,
                {
                  backgroundColor: theme.cardColor,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                  shadowColor: isDarkMode ? '#000' : '#000',
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>{message}</Text>
              
              <View style={buttons.length > 1 ? styles.buttonRowContainer : styles.buttonContainer}>
                {buttons.map((button, index) => {
                  // Default button styling
                  let buttonStyle = { backgroundColor: Colors.primary };
                  let textStyle = { color: '#fff' };
                  
                  // Apply specific styles based on button type
                  if (button.style === 'cancel') {
                    buttonStyle = { backgroundColor: theme.inputBackground };
                    textStyle = { color: theme.text };
                  } else if (button.style === 'destructive') {
                    buttonStyle = { backgroundColor: theme.error || Colors.danger };
                  }
                  
                  // Override with custom colors if provided
                  if (button.backgroundColor) {
                    buttonStyle.backgroundColor = button.backgroundColor;
                  }
                  if (button.textColor) {
                    textStyle.color = button.textColor;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        buttonStyle,
                        buttons.length > 1 && { flex: 1, marginHorizontal: 5 },
                      ]}
                      onPress={() => handleButtonPress(button)}
                    >
                      <Text style={[styles.buttonText, textStyle]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  buttonRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 15,
    padding: 12,
    elevation: 2,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CustomAlert; 