import React from "react";
import { Text as RNText } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Typography components with consistent styling
 */

export function Heading({ variant = "h1", children, style, color, weight, ...props }) {
  const { colors, typography } = useTheme();

  const variantStyles = {
    hero: typography.hero,
    heroMedium: typography.heroMedium,
    heroSmall: typography.heroSmall,
    h1: typography.h1,
    h1Medium: typography.h1Medium,
    h1Small: typography.h1Small,
    h2: typography.h2,
    h2Medium: typography.h2Medium,
    h2Small: typography.h2Small,
    h3: typography.h3 || { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  };

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  const weightMap = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  return (
    <RNText
      style={[
        {
          color: colorMap[color] || color || colors.text,
          ...variantStyles[variant],
          ...(weight && { fontWeight: weightMap[weight] || weight }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Body({
  variant = "body",
  children,
  style,
  color,
  weight,
  numberOfLines,
  ...props
}) {
  const { colors, typography } = useTheme();

  const variantStyles = {
    bodyLarge: typography.bodyLarge,
    body: typography.body,
    bodyMedium: typography.bodyMedium,
    bodySmall: typography.bodySmall,
    bodySmallMedium: typography.bodySmallMedium,
    small: typography.bodySmall,
  };

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  const weightMap = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  return (
    <RNText
      style={[
        {
          color: colorMap[color] || color || colors.text,
          ...variantStyles[variant],
          ...(weight && { fontWeight: weightMap[weight] || weight }),
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Caption({ children, style, color, weight, ...props }) {
  const { colors, typography } = useTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  const weightMap = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  return (
    <RNText
      style={[
        {
          color: colorMap[color] || color || colors.textSecondary,
          ...typography.caption,
          ...(weight && { fontWeight: weightMap[weight] || weight }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Default export for convenience
export default function Text({ variant = "body", ...props }) {
  if (variant.startsWith("h") || variant.startsWith("hero")) {
    return <Heading variant={variant} {...props} />;
  }
  if (variant === "caption") {
    return <Caption {...props} />;
  }
  return <Body variant={variant} {...props} />;
}
