import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const ThemeToggle = ({ style, showLabel = true, iconSize = 20 }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}
      
      <View style={styles.toggleContainer}>
        <Ionicons 
          name="sunny" 
          size={iconSize} 
          color={isDarkMode ? theme.textTertiary : Colors.primary} 
          style={styles.icon}
        />
        
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#e9e9ea', true: Colors.primaryLight }}
          thumbColor={isDarkMode ? Colors.primary : '#f4f3f4'}
          ios_backgroundColor="#e9e9ea"
          style={styles.switch}
        />
        
        <Ionicons 
          name="moon" 
          size={iconSize} 
          color={isDarkMode ? Colors.primary : theme.textTertiary} 
          style={styles.icon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default ThemeToggle; 