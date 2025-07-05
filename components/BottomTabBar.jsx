import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

// Using memo to prevent unnecessary re-renders
const BottomTabBar = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDarkMode } = useTheme();
  
  const tabs = [
    {
      name: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      path: '/',
      index: 0,
    },
    {
      name: 'Search',
      icon: 'search-outline',
      activeIcon: 'search',
      path: '/search',
      index: 1,
    },
    {
      name: 'Add',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
      path: '/add',
      isCenter: true,
      index: 2,
    },
    {
      name: 'Groups',
      icon: 'people-outline',
      activeIcon: 'people',
      path: '/groups',
      index: 3,
    },
    {
      name: 'Profile',
      icon: 'person-circle-outline',
      activeIcon: 'person-circle',
      path: '/profile',
      index: 4,
    },
  ];

  // Don't show the tab bar on splash or landing pages
  if (pathname === '/splash' || pathname === '/landing' || 
      pathname === '/signin' || pathname === '/email-signup') {
    return null;
  }

  const handleTabPress = (tab) => {
    // Don't navigate if already on this tab
    if (pathname === tab.path) return;
    
    // Use replace instead of push to avoid stacking screens
    router.replace(tab.path);
  };

  // Get the appropriate colors based on the theme
  const bgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const inactiveColor = isDarkMode ? '#888' : '#999';
  const activeColor = Colors.primary;
  const borderColor = isDarkMode ? '#333' : '#e0e0e0';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: bgColor,
        borderTopColor: borderColor,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Add extra padding for iOS devices with home indicator
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        const iconName = isActive ? tab.activeIcon : tab.icon;
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tabButton,
              tab.isCenter && styles.centerButton,
            ]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            {tab.isCenter ? (
              <View style={[
                styles.centerButtonInner, 
                { backgroundColor: Colors.primary }
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={28} 
                  color="#fff" 
                />
              </View>
            ) : (
              <>
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isActive ? activeColor : inactiveColor} 
                />
                <Text style={[
                  styles.tabText,
                  { color: isActive ? activeColor : inactiveColor }
                ]}>
                  {tab.name}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 80 : 70, // Taller for iOS with home indicator
    borderTopWidth: 1,
    paddingHorizontal: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1000,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
  },
  centerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
});

export default BottomTabBar; 