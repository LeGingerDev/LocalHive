import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const TabSelector = ({ 
  name, 
  icon, 
  activeIcon, 
  isActive, 
  onPress, 
  isCenter = false 
}) => {
  const { isDarkMode } = useTheme();
  
  // Determine colors based on active state and theme
  const activeColor = Colors.primary;
  const inactiveColor = isDarkMode ? '#777' : '#999';
  
  // Explicitly set colors based on active state
  const iconColor = isActive ? activeColor : inactiveColor;
  const textColor = isActive ? activeColor : inactiveColor;
  
  // Always use the appropriate icon based on active state
  const iconToUse = isActive ? activeIcon : icon;
  
  // Debug output to verify active state
  console.log(`TabSelector: ${name} isActive=${isActive}, iconColor=${iconColor}, using icon=${iconToUse}`);
  
  // Render special center button (Add button)
  if (isCenter) {
    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.centerButtonContainer}>
          <View style={[
            styles.centerButtonInner,
            { backgroundColor: isActive ? Colors.primaryLight : Colors.primary }
          ]}>
            <Ionicons 
              name={iconToUse} 
              size={36} 
              color="#fff" 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  // Render regular tab button
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isActive && styles.activeTabButton
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Active indicator bar at top */}
      {isActive && <View style={styles.activeIndicator} />}
      
      {/* Icon with background highlight when active */}
      <View style={[
        styles.iconContainer,
        isActive && styles.activeIconContainer
      ]}>
        <Ionicons 
          name={iconToUse} 
          size={24} 
          color={iconColor} 
        />
      </View>
      
      {/* Tab text with color change when active */}
      <Text style={[
        styles.tabText, 
        { color: textColor },
        isActive && styles.activeTabText
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    position: 'relative',
    paddingVertical: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(67, 97, 238, 0.12)',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: '60%',
    height: 4,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(67, 97, 238, 0.2)',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    fontWeight: '700',
  },
  centerButtonContainer: {
    position: 'relative',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: '50%',
    marginLeft: -35,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    zIndex: 10,
  },
  centerButtonActive: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.6,
  },
});

export default TabSelector; 