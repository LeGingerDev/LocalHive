import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const ThemeToggle = ({ style, showLabel = true, iconSize = 20, showSystemOption = false }) => {
  const { isDarkMode, toggleTheme, theme, useSystemTheme, toggleUseSystemTheme } = useTheme();

  // Debug logging
  console.log('ThemeToggle rendering with:', { isDarkMode, useSystemTheme });

  const handleThemeToggle = () => {
    console.log('Theme toggle pressed');
    toggleTheme();
  };

  const handleSystemToggle = () => {
    console.log('System toggle pressed');
    toggleUseSystemTheme();
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {useSystemTheme ? 'System Theme' : (isDarkMode ? 'Dark Mode' : 'Light Mode')}
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
          onValueChange={handleThemeToggle}
          trackColor={{ false: '#e9e9ea', true: Colors.primaryLight }}
          thumbColor={isDarkMode ? Colors.primary : '#f4f3f4'}
          ios_backgroundColor="#e9e9ea"
          style={styles.switch}
          testID="theme-toggle-switch"
        />
        
        <Ionicons 
          name="moon" 
          size={iconSize} 
          color={isDarkMode ? Colors.primary : theme.textTertiary} 
          style={styles.icon}
        />
      </View>
      
      {showSystemOption && (
        <View style={styles.systemOptionContainer}>
          <Text style={[styles.systemOptionText, { color: theme.textSecondary }]}>
            Use device settings
          </Text>
          <Switch
            value={useSystemTheme}
            onValueChange={handleSystemToggle}
            trackColor={{ false: '#e9e9ea', true: Colors.primaryLight }}
            thumbColor={useSystemTheme ? Colors.primary : '#f4f3f4'}
            ios_backgroundColor="#e9e9ea"
            style={styles.switch}
            testID="system-theme-toggle-switch"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  systemOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  systemOptionText: {
    fontSize: 14,
  },
  icon: {
    marginHorizontal: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default ThemeToggle; 