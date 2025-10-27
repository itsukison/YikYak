import { useColorScheme } from "react-native";

/**
 * Artifact-inspired theme system
 * Clean, modern, spacious design with bold typography
 * Color palette: Black, White, Pale Blue (#B7D4FF), Orange (#FF5A1F)
 */

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors - Artifact-inspired clean aesthetic
    background: isDark ? "#000000" : "#F8F9FA", // Light gray for app background
    surface: isDark ? "#1A1A1A" : "#FFFFFF", // White for cards
    surfaceElevated: isDark ? "#1A1A1A" : "#FFFFFF",
    sectionBackground: isDark ? "#0A0A0A" : "#F8F9FA",

    // Text colors - high contrast for readability
    text: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#A0A0A0" : "#6B7280",
    textTertiary: isDark ? "#808080" : "#9CA3AF",

    // Primary CTA - Black (Artifact-inspired)
    primary: isDark ? "#FFFFFF" : "#000000",
    primaryText: isDark ? "#000000" : "#FFFFFF",
    primarySubtle: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",

    // Secondary CTA - Orange (Artifact-inspired)
    secondary: isDark ? "#FF6B3D" : "#FF5A1F",
    secondaryText: "#FFFFFF",
    secondarySubtle: isDark
      ? "rgba(255, 107, 61, 0.2)"
      : "rgba(255, 90, 31, 0.15)",

    // Accent - Pale Blue (Artifact-inspired)
    accent: isDark ? "#A0C4FF" : "#B7D4FF",
    accentText: isDark ? "#FFFFFF" : "#000000",
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
    tabBarActive: isDark ? "#FFFFFF" : "#000000",
    tabBarInactive: isDark ? "#808080" : "#6B7280",

    // Card and input backgrounds
    inputBackground: isDark ? "#1A1A1A" : "#F8F9FA",
    cardBackground: isDark ? "#1A1A1A" : "#FFFFFF",

    // Ghost button (light gray background)
    ghost: isDark ? "#2D2D2D" : "#F3F4F6",
    ghostText: isDark ? "#FFFFFF" : "#000000",

    // Shadow colors - minimal elevation
    shadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.06)",
  };

  // 4px-based spacing scale
  const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
    "6xl": 64,
  };

  // Border radius constants (Artifact-inspired)
  const radius = {
    small: 8,
    card: 12, // Cards and containers (12-16px)
    cardLarge: 16,
    button: 24, // Buttons (24-28px)
    buttonLarge: 28,
    pill: 20, // Pills/Tabs (20-24px)
    pillLarge: 24,
    input: 12, // Input fields (12-16px)
    inputLarge: 16,
    avatar: 9999, // Circular avatars
  };

  // Typography scale
  const typography = {
    // Hero/Display text
    hero: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroMedium: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroSmall: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -0.5,
    },

    // H1 Headings
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    h1Medium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    h1Small: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700",
      letterSpacing: -0.5,
    },

    // H2 Headings
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      letterSpacing: -0.3,
    },
    h2Medium: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "600",
      letterSpacing: -0.3,
    },
    h2Small: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      letterSpacing: -0.3,
    },

    // H3 Headings
    h3: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600",
      letterSpacing: -0.2,
    },

    // Body text
    bodyLarge: {
      fontSize: 18,
      lineHeight: 27,
      fontWeight: "400",
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400",
    },
    bodyMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "500",
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "400",
    },
    bodySmallMedium: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },

    // Caption text
    caption: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "400",
    },
    captionMedium: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "500",
    },
  };

  // Shadow presets
  const shadows = {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    minimal: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.5 : 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    small: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  };

  return {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    isDark,
    colorScheme,
  };
};

// Gluestack UI theme configuration
export const gluestackConfig = {
  tokens: {
    colors: {
      // Primary colors
      primary: "#000000",
      primaryText: "#FFFFFF",
      
      // Secondary colors
      secondary: "#FF5A1F",
      secondaryText: "#FFFFFF",
      
      // Accent colors
      accent: "#B7D4FF",
      accentText: "#000000",
      
      // Background colors
      background: "#F8F9FA",
      surface: "#FFFFFF",
      
      // Text colors
      text: "#000000",
      textSecondary: "#6B7280",
      textTertiary: "#9CA3AF",
      
      // Border colors
      border: "#E5E7EB",
      borderLight: "#F3F4F6",
      
      // Status colors
      error: "#EF4444",
      success: "#10B981",
      warning: "#F59E0B",
      
      // Ghost button
      ghost: "#F3F4F6",
      ghostText: "#000000",
    },
    space: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      "2xl": 24,
      "3xl": 32,
      "4xl": 40,
      "5xl": 48,
      "6xl": 64,
    },
    radii: {
      small: 8,
      card: 12,
      cardLarge: 16,
      button: 24,
      buttonLarge: 28,
      pill: 20,
      pillLarge: 24,
      input: 12,
      inputLarge: 16,
      full: 9999,
    },
    fontSizes: {
      hero: 48,
      heroMedium: 40,
      heroSmall: 32,
      h1: 32,
      h1Medium: 28,
      h1Small: 24,
      h2: 24,
      h2Medium: 22,
      h2Small: 20,
      bodyLarge: 18,
      body: 16,
      bodySmall: 14,
      caption: 12,
    },
    fontWeights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
  },
};
