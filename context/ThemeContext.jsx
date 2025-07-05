import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme, Appearance } from "react-native";
import { Colors } from "../constants/Colors";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme || 'light');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [theme, setTheme] = useState(Colors[colorScheme] || Colors.light);

  useEffect(() => {
    // Update theme when system color scheme changes
    setColorScheme(systemColorScheme || 'light');
    setIsDarkMode(systemColorScheme === 'dark');
    setTheme(Colors[systemColorScheme] || Colors.light);
    
    // Add listener for theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme || 'light');
      setIsDarkMode(newColorScheme === 'dark');
      setTheme(Colors[newColorScheme] || Colors.light);
    });
    
    return () => {
      subscription.remove();
    };
  }, [systemColorScheme]);

  // Allow manual theme switching
  const toggleTheme = () => {
    const newColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newColorScheme);
    setIsDarkMode(newColorScheme === 'dark');
    setTheme(Colors[newColorScheme]);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme, 
      isDarkMode, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
