import { useColorScheme } from "react-native";

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors - now properly respects dark mode
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#1E1E1E" : "#FFFFFF",
    surfaceElevated: isDark ? "#262626" : "#FFFFFF",

    // Text colors
    text: isDark ? "#FFFFFF" : "#0E0C0C",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.7)" : "#4A4A4A",
    textTertiary: isDark ? "rgba(255, 255, 255, 0.6)" : "#6B6B6B",

    // Brand colors (adjusted for dark mode)
    primary: isDark ? "#FF6B47" : "#E75424",
    primarySubtle: isDark ? "rgba(255, 107, 71, 0.2)" : "#FBCFCC",

    // Accent colors
    accent: isDark ? "#8B7FA3" : "#695D87",

    // Interactive colors
    border: isDark ? "#2D2D2D" : "#EAEAEA",
    borderLight: isDark ? "#1A1A1A" : "#F0F0F0",

    // Status colors (adjusted)
    error: isDark ? "#FF6B6B" : "#CE4315",

    // Tab bar colors
    tabBarBackground: isDark ? "#1E1E1E" : "#FFFFFF",
    tabBarBorder: isDark ? "#2D2D2D" : "#EFEFEF",
    tabBarActive: isDark ? "#FF6B47" : "#E75424",
    tabBarInactive: isDark ? "rgba(255, 255, 255, 0.6)" : "#695D87",

    // Special backgrounds
    gradient: {
      start: isDark ? "#1A1A1A" : "#FFFFFF",
      center: isDark ? "rgba(46, 46, 46, 0.8)" : "rgba(255, 255, 255, 0.8)",
    },

    // Card and input backgrounds
    inputBackground: isDark ? "#2D2D2D" : "#F5F5F5",
    cardBackground: isDark ? "#1E1E1E" : "#FFFFFF",

    // Shadow colors
    shadow: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.1)",
  };

  return {
    colors,
    isDark,
    colorScheme,
  };
};