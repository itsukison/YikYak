import { useColorScheme } from "react-native";

/**
 * Modern theme system with layered backgrounds
 * Sophisticated color palette with subtle shading for depth
 * Dark mode: Pure Black with Neon Green accents
 * Light mode: Pure White with Neon Green accents
 */

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#1C1C1E" : "#F9F9F9",
    surfaceElevated: isDark ? "#2C2C2E" : "#F5F5F5",
    sectionBackground: isDark ? "#000000" : "#FFFFFF",

    // Text colors
    text: isDark ? "#FFFFFF" : "#1C1C1E",
    textSecondary: isDark ? "#A1A1AA" : "#767676",
    textTertiary: isDark ? "#71717A" : "#A1A1AA",

    // Primary CTA - Neon Green (Wise)
    primary: "#9FE870",
    primaryText: "#1C1C1E", // Dark text on neon green for contrast
    primarySubtle: isDark
      ? "rgba(159, 232, 112, 0.15)"
      : "rgba(159, 232, 112, 0.1)",

    // Secondary CTA
    secondary: "#8AD460",
    secondaryText: "#1C1C1E",
    secondarySubtle: isDark
      ? "rgba(138, 212, 96, 0.15)"
      : "rgba(138, 212, 96, 0.1)",

    // Accent - Neon Green
    accent: "#9FE870",
    accentText: "#1C1C1E",
    accentSubtle: isDark
      ? "rgba(159, 232, 112, 0.15)"
      : "rgba(159, 232, 112, 0.1)",

    // Borders
    border: isDark ? "#27272A" : "#F4F4F5",
    borderLight: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",

    // Status colors
    error: isDark ? "#F87171" : "#EF4444",
    errorSubtle: isDark
      ? "rgba(248, 113, 113, 0.15)"
      : "rgba(239, 68, 68, 0.1)",
    success: "#9FE870", // Using brand green for success
    warning: isDark ? "#FBBF24" : "#F59E0B",

    // Tab bar colors
    tabBarBackground: isDark ? "#000000" : "#FFFFFF",
    tabBarBorder: isDark ? "#27272A" : "#E4E4E7",
    tabBarActive: "#9FE870",
    tabBarInactive: isDark ? "#A1A1AA" : "#767676",

    // Card and input backgrounds
    inputBackground: isDark ? "#1C1C1E" : "#F2F2F2",
    cardBackground: isDark ? "#1C1C1E" : "#FFFFFF",

    // Ghost button
    ghost: isDark ? "#27272A" : "#F4F4F5",
    ghostText: isDark ? "#FFFFFF" : "#1C1C1E",

    // Shadow colors
    shadow: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)",
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

  // Border radius constants
  const radius = {
    small: 8,
    card: 16, // Softer cards
    cardLarge: 24,
    button: 9999, // Pill shape
    buttonLarge: 9999,
    pill: 9999,
    pillLarge: 9999,
    input: 16,
    inputLarge: 20,
    avatar: 9999,
  };

  // Typography scale - Inter
  const typography = {
    // Hero/Display text
    hero: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "800",
      letterSpacing: -1,
    },
    heroMedium: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "800",
      letterSpacing: -1,
    },
    heroSmall: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -1,
    },

    // H1 Headings
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -0.8,
    },
    h1Medium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "700",
      letterSpacing: -0.8,
    },
    h1Small: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700",
      letterSpacing: -0.6,
    },

    // H2 Headings
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      letterSpacing: -0.5,
    },
    h2Medium: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "600",
      letterSpacing: -0.5,
    },
    h2Small: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      letterSpacing: -0.4,
    },

    // H3 Headings
    h3: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "600",
      letterSpacing: -0.3,
    },

    // Body text
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
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
      lineHeight: 20,
      fontWeight: "400",
    },
    bodySmallMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },

    // Caption text
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
    },
    captionMedium: {
      fontSize: 12,
      lineHeight: 16,
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
      shadowColor: isDark ? "#FFFFFF" : "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.05 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: isDark ? "#FFFFFF" : "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: isDark ? "#FFFFFF" : "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.08 : 0.1,
      shadowRadius: 12,
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
      primary: "#9FE870",
      primaryText: "#1C1C1E",
      secondary: "#8AD460",
      secondaryText: "#1C1C1E",
      accent: "#9FE870",
      accentText: "#1C1C1E",
      background: "#FFFFFF",
      surface: "#F9F9F9",
      surfaceElevated: "#F5F5F5",
      text: "#1C1C1E",
      textSecondary: "#767676",
      textTertiary: "#A1A1AA",
      border: "#F4F4F5",
      borderLight: "#F4F4F5",
      error: "#EF4444",
      success: "#9FE870",
      warning: "#F59E0B",
      ghost: "#F4F4F5",
      ghostText: "#1C1C1E",
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
      card: 16,
      cardLarge: 24,
      button: 9999,
      buttonLarge: 9999,
      pill: 9999,
      pillLarge: 9999,
      input: 16,
      inputLarge: 20,
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
