import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import ToggleButton from './ToggleButton';

const SettingsSection = ({ 
  onToggleTheme, 
  onToggleSystemTheme, 
  isSaving = false 
}) => {
  const { theme, isDarkMode, useSystemTheme } = useTheme();
  
  return (
    <View style={[styles.section, { backgroundColor: theme.cardColor, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="settings-outline" size={20} color={theme.text} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
      </View>
      
      {/* Dark Mode Toggle */}
      <ToggleButton
        label="Dark Mode"
        icon={<Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.text} />}
        value={isDarkMode}
        onValueChange={onToggleTheme}
        loading={isSaving}
        style={styles.toggleItem}
      />
      
      {/* System Theme Toggle */}
      <ToggleButton
        label="Use System Theme"
        icon={<MaterialIcons name="phone-android" size={20} color={theme.text} />}
        value={useSystemTheme}
        onValueChange={onToggleSystemTheme}
        loading={isSaving}
        style={[styles.toggleItem, { borderBottomWidth: 0 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  toggleItem: {
    borderBottomColor: 'transparent',
  }
});

export default SettingsSection; 