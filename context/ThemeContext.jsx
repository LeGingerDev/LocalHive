import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme, Appearance } from "react-native";
import { Colors } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const ThemeContext = createContext();

// Keys for storing theme preferences
const THEME_PREFERENCE_KEY = 'theme_preference';
const USE_SYSTEM_THEME_KEY = 'use_system_theme';

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme || 'light');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [theme, setTheme] = useState(Colors[colorScheme] || Colors.light);
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('ThemeContext state:', { 
    colorScheme, 
    isDarkMode, 
    useSystemTheme, 
    systemColorScheme,
    userId: user?.id || 'not logged in'
  });

  // Load saved theme preferences
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        setIsLoading(true);
        
        // Get stored preferences
        const storedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        const storedUseSystemTheme = await AsyncStorage.getItem(USE_SYSTEM_THEME_KEY);
        
        console.log('Loaded theme preferences from AsyncStorage:', { storedTheme, storedUseSystemTheme });
        
        // If user is logged in, try to get preferences from their profile
        if (user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('theme_preference, use_system_theme')
              .eq('id', user.id)
              .single();
            
            if (data && !error) {
              console.log('Loaded theme preferences from Supabase:', data);
              
              // Use profile preferences if available
              if (data.theme_preference) {
                storedTheme = data.theme_preference;
              }
              
              if (data.use_system_theme !== null) {
                storedUseSystemTheme = data.use_system_theme.toString();
              }
            }
          } catch (err) {
            console.warn('Error loading theme preferences from profile:', err);
          }
        }
        
        // Parse stored values
        const useSystem = storedUseSystemTheme !== null ? storedUseSystemTheme === 'true' : true;
        setUseSystemTheme(useSystem);
        
        if (useSystem) {
          // Use system theme
          setColorScheme(systemColorScheme || 'light');
          setIsDarkMode(systemColorScheme === 'dark');
          setTheme(Colors[systemColorScheme] || Colors.light);
        } else if (storedTheme) {
          // Use stored theme preference
          setColorScheme(storedTheme);
          setIsDarkMode(storedTheme === 'dark');
          setTheme(Colors[storedTheme] || Colors.light);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [user]);

  // Update theme when system color scheme changes (only if using system theme)
  useEffect(() => {
    if (useSystemTheme) {
      setColorScheme(systemColorScheme || 'light');
      setIsDarkMode(systemColorScheme === 'dark');
      setTheme(Colors[systemColorScheme] || Colors.light);
    }
    
    // Add listener for theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      if (useSystemTheme) {
        setColorScheme(newColorScheme || 'light');
        setIsDarkMode(newColorScheme === 'dark');
        setTheme(Colors[newColorScheme] || Colors.light);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [systemColorScheme, useSystemTheme]);

  // Save theme preference when it changes
  const saveThemePreference = async (newColorScheme, useSystem) => {
    try {
      console.log('Saving theme preference:', { newColorScheme, useSystem, userId: user?.id });
      
      // Save to AsyncStorage for all users
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newColorScheme);
      await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, useSystem.toString());
      
      // If user is logged in, save to their profile directly using Supabase client
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              theme_preference: newColorScheme,
              use_system_theme: useSystem
            })
            .eq('id', user.id)
            .select();
          
          if (error) {
            console.error('Failed to update profile with theme preference:', error);
          } else {
            console.log('Successfully updated profile with theme preference:', data);
          }
        } catch (error) {
          console.error('Exception when updating profile with theme preference:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Allow manual theme switching
  const toggleTheme = () => {
    const newColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    console.log('Toggle theme from', colorScheme, 'to', newColorScheme);
    
    setColorScheme(newColorScheme);
    setIsDarkMode(newColorScheme === 'dark');
    setTheme(Colors[newColorScheme]);
    setUseSystemTheme(false);
    
    // Save the new preference
    saveThemePreference(newColorScheme, false);
  };

  // Toggle between system theme and manual theme
  const toggleUseSystemTheme = () => {
    const newUseSystemTheme = !useSystemTheme;
    console.log('Toggle use system theme:', newUseSystemTheme);
    
    setUseSystemTheme(newUseSystemTheme);
    
    if (newUseSystemTheme) {
      // Switch back to system theme
      const newColorScheme = systemColorScheme || 'light';
      setColorScheme(newColorScheme);
      setIsDarkMode(newColorScheme === 'dark');
      setTheme(Colors[newColorScheme] || Colors.light);
      
      // Save the preference to use system theme
      saveThemePreference(newColorScheme, true);
    } else {
      // Keep current theme but mark it as manually set
      saveThemePreference(colorScheme, false);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme, 
      isDarkMode, 
      toggleTheme,
      useSystemTheme,
      toggleUseSystemTheme,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
