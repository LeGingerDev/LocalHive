import React from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

/**
 * A reusable toggle button component
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the toggle
 * @param {React.ReactNode} props.icon - Icon component to display before the label
 * @param {boolean} props.value - Current value of the toggle (on/off)
 * @param {Function} props.onValueChange - Function to call when toggle value changes
 * @param {boolean} [props.loading=false] - Whether the toggle is in loading state
 * @param {boolean} [props.disabled=false] - Whether the toggle is disabled
 * @param {Object} [props.style] - Additional styles for the container
 */
const ToggleButton = ({
  label,
  icon,
  value,
  onValueChange,
  loading = false,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { borderBottomColor: theme.border },
      style
    ]}>
      <View style={styles.labelContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: Colors.primary }}
          thumbColor={value ? Colors.primary : '#f4f3f4'}
          ios_backgroundColor="#e9e9ea"
          disabled={disabled || loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
  },
});

export default ToggleButton; 