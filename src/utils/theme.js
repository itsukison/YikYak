import { useColorScheme } from "react-native";

/**
 * Modern theme system with layered backgrounds
 * Sophisticated color palette with subtle shading for depth
 * Dark mode: Layered grays (0%, 5%, 10%) with blue accents
 * Light mode: Layered whites (100%, 95%, 90%) with blue accents
 */

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Background colors - layered approach for depth
    // bg-dark (deepest/app background) → bg (cards/surfaces) → bg-light (elevated/hover)
    background: isDark ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 100%)", // Deepest layer
    surface: isDark ? "hsl(0, 0%, 5%)" : "hsl(0, 0%, 95%)", // Main surfaces, cards
    surfaceElevated: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 90%)", // Elevated surfaces, hover states
    sectionBackground: isDark ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 100%)",

    // Text colors - optimized for each mode
    text: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 5%)",
    textSecondary: isDark ? "hsl(0, 0%, 70%)" : "hsl(0, 0%, 30%)",
    textTertiary: isDark ? "hsl(0, 0%, 50%)" : "hsl(0, 0%, 50%)",

    // Primary CTA - Blue accent (modern, sophisticated)
    primary: isDark ? "#60A5FA" : "#4998e9",
    primaryText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 100%)",
    primarySubtle: isDark
      ? "rgba(96, 165, 250, 0.15)"
      : "rgba(73, 152, 233, 0.1)",

    // Secondary CTA - Lighter blue for secondary actions
    secondary: isDark ? "#A5B4FC" : "#ebf5fd",
    secondaryText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 5%)",
    secondarySubtle: isDark
      ? "rgba(165, 180, 252, 0.15)"
      : "rgba(235, 245, 253, 0.5)",

    // Accent - Same as primary for consistency
    accent: isDark ? "#60A5FA" : "#4998e9",
    accentText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 100%)",
    accentSubtle: isDark
      ? "rgba(96, 165, 250, 0.15)"
      : "rgba(73, 152, 233, 0.1)",

    // Borders - subtle, slightly lighter/darker than surface
    border: isDark ? "hsl(0, 0%, 15%)" : "hsl(0, 0%, 85%)",
    borderLight: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 90%)",

    // Status colors
    error: isDark ? "#F87171" : "#EF4444",
    errorSubtle: isDark
      ? "rgba(248, 113, 113, 0.15)"
      : "rgba(239, 68, 68, 0.1)",
    success: isDark ? "#4ADE80" : "#10B981",
    warning: isDark ? "#FBBF24" : "#F59E0B",

    // Tab bar colors
    tabBarBackground: isDark ? "hsl(0, 0%, 5%)" : "hsl(0, 0%, 95%)",
    tabBarBorder: isDark ? "hsl(0, 0%, 15%)" : "hsl(0, 0%, 85%)",
    tabBarActive: isDark ? "#60A5FA" : "#4998e9",
    tabBarInactive: isDark ? "hsl(0, 0%, 70%)" : "hsl(0, 0%, 30%)",

    // Card and input backgrounds
    inputBackground: isDark ? "hsl(0, 0%, 5%)" : "hsl(0, 0%, 95%)",
    cardBackground: isDark ? "hsl(0, 0%, 5%)" : "hsl(0, 0%, 95%)",

    // Ghost button (subtle background)
    ghost: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 90%)",
    ghostText: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 5%)",

    // Shadow colors - appropriate for each mode
    shadow: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)",
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
  // Dark mode: subtle light lift effects for depth
  // Light mode: soft black shadows for elevation
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
      shadowOpacity: isDark ? 0.05 : 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: isDark ? "#FFFFFF" : "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.05 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: isDark ? "#FFFFFF" : "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.08 : 0.12,
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

// Gluestack UI theme configuration (Light mode defaults)
export const gluestackConfig = {
  tokens: {
    colors: {
      // Primary colors - Blue accent
      primary: "#4998e9",
      primaryText: "#FFFFFF",

      // Secondary colors - Light blue
      secondary: "#ebf5fd",
      secondaryText: "hsl(0, 0%, 5%)",

      // Accent colors - Same as primary
      accent: "#4998e9",
      accentText: "#FFFFFF",

      // Background colors - Layered whites
      background: "hsl(0, 0%, 100%)",
      surface: "hsl(0, 0%, 95%)",
      surfaceElevated: "hsl(0, 0%, 90%)",

      // Text colors
      text: "hsl(0, 0%, 5%)",
      textSecondary: "hsl(0, 0%, 30%)",
      textTertiary: "hsl(0, 0%, 50%)",

      // Border colors
      border: "hsl(0, 0%, 85%)",
      borderLight: "hsl(0, 0%, 90%)",

      // Status colors
      error: "#EF4444",
      success: "#10B981",
      warning: "#F59E0B",

      // Ghost button
      ghost: "hsl(0, 0%, 90%)",
      ghostText: "hsl(0, 0%, 5%)",
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
