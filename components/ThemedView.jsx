import React from "react";
import { View, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";

const ThemedView = ({ style, ...props }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        { 
          backgroundColor: theme.backgroundColor,
          flex: 1,
        }, 
        style
      ]}
      {...props}
    />
  );
};

export default ThemedView;
