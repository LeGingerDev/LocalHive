import { colors as lightColors } from "./colors"
import { colors as darkColors } from "./colorsDark"

export type CategoryColorTheme = {
  light: string
  dark: string
}

export const categoryColors: Record<string, CategoryColorTheme> = {
  food: {
    light: "#FFE6E6", // Pastel red for light mode
    dark: "#8B2A2A", // Vibrant dark red for dark mode
  },
  drinks: {
    light: "#E6F3FF", // Pastel blue for light mode
    dark: "#2A4A8B", // Vibrant dark blue for dark mode
  },
  household: {
    light: "#F0E6FF", // Pastel purple for light mode
    dark: "#4A2A8B", // Vibrant dark purple for dark mode
  },
  electronics: {
    light: "#E6FFF0", // Pastel green for light mode
    dark: "#2A8B4A", // Vibrant dark green for dark mode
  },
  clothing: {
    light: "#FFF0E6", // Pastel orange for light mode
    dark: "#8B4A2A", // Vibrant dark orange for dark mode
  },
  health: {
    light: "#E6FFE6", // Pastel mint green for light mode
    dark: "#2A8B2A", // Vibrant dark mint green for dark mode
  },
  beauty: {
    light: "#FFE6F0", // Pastel pink for light mode
    dark: "#8B2A4A", // Vibrant dark pink for dark mode
  },
  books: {
    light: "#E6F0FF", // Pastel sky blue for light mode
    dark: "#2A4A8B", // Vibrant dark sky blue for dark mode
  },
  sports: {
    light: "#FFF8E6", // Pastel yellow for light mode
    dark: "#8B8B2A", // Vibrant dark yellow for dark mode
  },
  toys: {
    light: "#F0FFE6", // Pastel lime green for light mode
    dark: "#4A8B2A", // Vibrant dark lime green for dark mode
  },
  automotive: {
    light: "#E6E6FF", // Pastel indigo for light mode
    dark: "#2A2A8B", // Vibrant dark indigo for dark mode
  },
  garden: {
    light: "#E6FFF8", // Pastel teal for light mode
    dark: "#2A8B8B", // Vibrant dark teal for dark mode
  },
  office: {
    light: "#F8F8F8", // Light gray for light mode
    dark: "#4A4A4A", // Vibrant dark gray for dark mode
  },
  entertainment: {
    light: "#FFE6F8", // Pastel magenta for light mode
    dark: "#8B2A8B", // Vibrant dark magenta for dark mode
  },
  other: {
    light: "#F5F5F5", // Very light gray for light mode
    dark: "#3A3A3A", // Vibrant dark gray for dark mode
  },
}

/**
 * Get the appropriate category color based on the current theme
 * @param category - The category name
 * @param isDark - Whether the current theme is dark mode
 * @returns The color string for the category
 */
export function getCategoryColor(category: string, isDark: boolean): string {
  const categoryColor = categoryColors[category.toLowerCase()]
  if (!categoryColor) {
    // Fallback to "other" category if category not found
    return isDark ? categoryColors.other.dark : categoryColors.other.light
  }
  
  return isDark ? categoryColor.dark : categoryColor.light
}

/**
 * Get category color with opacity for overlay effects
 * @param category - The category name
 * @param isDark - Whether the current theme is dark mode
 * @param opacity - Opacity value (0-1)
 * @returns The color string with opacity
 */
export function getCategoryColorWithOpacity(
  category: string, 
  isDark: boolean, 
  opacity: number
): string {
  const baseColor = getCategoryColor(category, isDark)
  
  // Convert hex to rgba
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
} 