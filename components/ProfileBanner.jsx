import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const ProfileBanner = ({ user = { name: 'Sarah Johnson', email: 'sarah.johnson@email.com' } }) => {
  const { theme, isDarkMode } = useTheme();
  
  // Get first letter of name for avatar
  const initial = user.name.charAt(0).toUpperCase();
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.cardColor, 
      borderColor: theme.border 
    }]}>
      <View style={[styles.avatarContainer, { backgroundColor: Colors.primary }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  email: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default ProfileBanner; 