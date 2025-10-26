import { useColorScheme } from "react-native";

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors - Artifact-inspired clean aesthetic
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#1A1A1A" : "#FFFFFF",
    surfaceElevated: isDark ? "#1A1A1A" : "#FFFFFF",
    sectionBackground: isDark ? "#0A0A0A" : "#F8F9FB",

    // Text colors - high contrast for readability
    text: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#A0A0A0" : "#6B7280",
    textTertiary: isDark ? "#808080" : "#9CA3AF",

    // Brand colors - Orange CTA (Artifact-inspired)
    primary: isDark ? "#FF6B3D" : "#FF5A1F",
    primarySubtle: isDark
      ? "rgba(255, 107, 61, 0.2)"
      : "rgba(255, 90, 31, 0.15)",

    // Accent colors - Blue accent (Artifact-inspired)
    accent: isDark ? "#A0C4FF" : "#B7D4FF",
    accentSubtle: isDark
      ? "rgba(160, 196, 255, 0.2)"
      : "rgba(183, 212, 255, 0.3)",

    // Interactive colors - clean borders
    border: isDark ? "#2D2D2D" : "#E5E7EB",
    borderLight: isDark ? "#1A1A1A" : "#F3F4F6",

    // Status colors
    error: isDark ? "#FF6B6B" : "#EF4444",
    errorSubtle: isDark
      ? "rgba(255, 107, 107, 0.2)"
      : "rgba(239, 68, 68, 0.15)",
    success: isDark ? "#4ADE80" : "#10B981",
    warning: isDark ? "#FBBF24" : "#F59E0B",

    // Tab bar colors
    tabBarBackground: isDark ? "#1A1A1A" : "#FFFFFF",
    tabBarBorder: isDark ? "#2D2D2D" : "#E5E7EB",
    tabBarActive: isDark ? "#FF6B3D" : "#FF5A1F",
    tabBarInactive: isDark ? "#808080" : "#6B7280",

    // Special backgrounds
    gradient: {
      start: isDark ? "#000000" : "#FFFFFF",
      center: isDark ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.8)",
    },

    // Card and input backgrounds
    inputBackground: isDark ? "#1A1A1A" : "#F8F9FB",
    cardBackground: isDark ? "#1A1A1A" : "#FFFFFF",

    // Shadow colors - subtle elevation
    shadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.08)",
  };

  // Border radius constants (Coinbase/Artifact-inspired)
  const radius = {
    card: 8, // Cards and containers
    button: 24, // Buttons and CTAs
    input: 12, // Input fields
    avatar: 9999, // Circular avatars
    small: 6, // Small elements
  };

  return {
    colors,
    radius,
    isDark,
    colorScheme,
  };
};
