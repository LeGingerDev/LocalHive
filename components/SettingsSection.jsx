import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * A reusable settings section component
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {string} props.icon - Ionicons icon name
 * @param {React.ReactNode} props.children - Section content
 */
const SettingsSection = ({ 
  title,
  icon,
  children,
  style
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.section, 
      { backgroundColor: theme.cardColor, borderColor: theme.border },
      style
    ]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={theme.text} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      
      <View style={styles.sectionContent}>
        {children}
      </View>
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
  sectionContent: {
    width: '100%',
  }
});

export default SettingsSection; 