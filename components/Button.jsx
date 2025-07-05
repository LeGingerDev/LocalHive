import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable Button component with multiple variants and states
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, text, danger)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {boolean} [props.fullWidth=false] - Whether button should take full width
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  
  // Define base colors
  const getColors = () => {
    const baseColors = {
      primary: {
        background: Colors.primary,
        text: '#fff',
        border: Colors.primary,
      },
      secondary: {
        background: isDarkMode ? '#333' : '#e0e0e0',
        text: isDarkMode ? '#fff' : '#333',
        border: isDarkMode ? '#444' : '#ccc',
      },
      outline: {
        background: 'transparent',
        text: Colors.primary,
        border: Colors.primary,
      },
      text: {
        background: 'transparent',
        text: Colors.primary,
        border: 'transparent',
      },
      danger: {
        background: Colors.danger || '#dc3545',
        text: '#fff',
        border: Colors.danger || '#dc3545',
      },
    };
    
    // If disabled, adjust colors
    if (disabled) {
      const disabledColors = {
        background: isDarkMode ? '#333' : '#e0e0e0',
        text: isDarkMode ? '#555' : '#999',
        border: isDarkMode ? '#444' : '#ccc',
      };
      
      // For text and outline variants when disabled
      if (variant === 'text' || variant === 'outline') {
        disabledColors.background = 'transparent';
      }
      
      return disabledColors;
    }
    
    return baseColors[variant] || baseColors.primary;
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    const sizeStyles = {
      small: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        fontSize: 14,
      },
      medium: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 16,
      },
      large: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        fontSize: 18,
      },
    };
    
    return sizeStyles[size] || sizeStyles.medium;
  };
  
  const colors = getColors();
  const sizeStyles = getSizeStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'text' ? Colors.primary : '#fff'} 
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: colors.text,
              fontSize: sizeStyles.fontSize,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button; 