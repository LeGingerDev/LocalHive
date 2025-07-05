import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import TabSelector from './TabSelector';

// Using memo to prevent unnecessary re-renders
const BottomTabBar = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDarkMode } = useTheme();
  
  // Debug pathname
  console.log('Current pathname in BottomTabBar:', pathname);
  
  const tabs = [
    {
      name: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      path: '/(app)',
      matchPaths: ['/(app)', '/(app)/index', '/'],
      index: 0,
    },
    {
      name: 'Search',
      icon: 'search-outline',
      activeIcon: 'search',
      path: '/(app)/search',
      matchPaths: ['/(app)/search'],
      index: 1,
    },
    {
      name: 'Add',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
      path: '/(app)/add',
      matchPaths: ['/(app)/add'],
      isCenter: true,
      index: 2,
    },
    {
      name: 'Groups',
      icon: 'people-outline',
      activeIcon: 'people',
      path: '/(app)/groups',
      matchPaths: ['/(app)/groups'],
      index: 3,
    },
    {
      name: 'Profile',
      icon: 'person-circle-outline',
      activeIcon: 'person-circle',
      path: '/(app)/profile',
      matchPaths: ['/(app)/profile'],
      index: 4,
    },
  ];

  // Don't show the tab bar on splash or auth pages
  if (pathname === '/splash' || 
      pathname.startsWith('/(auth)')) {
    return null;
  }

  const handleTabPress = (tab) => {
    // Don't navigate if already on this tab
    if (isTabActive(tab)) return;
    
    // Use replace instead of push to avoid stacking screens
    router.replace(tab.path);
  };

  // Helper function to determine if a tab is active
  const isTabActive = (tab) => {
    // For exact path matching
    if (tab.matchPaths.includes(pathname)) {
      return true;
    }
    
    // For partial path matching (e.g. when pathname is /search)
    const simplePathname = pathname.replace('/(app)', '');
    
    // Check if any of the match paths ends with the simple pathname
    for (const matchPath of tab.matchPaths) {
      const simpleMatchPath = matchPath.replace('/(app)', '');
      if (simplePathname === simpleMatchPath) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.cardColor,
        borderTopColor: theme.border,
        paddingBottom: Platform.OS === 'ios' ? 25 : 15, // Add extra padding for iOS devices with home indicator
      }
    ]}>
      {tabs.map((tab) => {
        // Use the helper function to determine if tab is active
        const isActive = isTabActive(tab);
        
        // Debug active state
        console.log(`Tab ${tab.name} isActive:`, isActive, 'path:', tab.path, 'pathname:', pathname);
        
        return (
          <TabSelector
            key={tab.name}
            name={tab.name}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            isActive={isActive}
            isCenter={tab.isCenter}
            onPress={() => handleTabPress(tab)}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 90 : 80, // Taller for iOS with home indicator (increased by 10px)
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
  }
});

export default BottomTabBar; 