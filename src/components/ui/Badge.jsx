import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Badge component - Notification badges and status indicators
 */
export default function Badge({
  children,
  variant = "primary",
  size = "medium",
  style,
  ...props
}) {
  const { colors, radius, spacing, typography } = useTheme();

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.primaryText,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.secondaryText,
    },
    accent: {
      backgroundColor: colors.accent,
      color: colors.accentText,
    },
    error: {
      backgroundColor: colors.error,
      color: "#FFFFFF",
    },
    success: {
      backgroundColor: colors.success,
      color: "#FFFFFF",
    },
    ghost: {
      backgroundColor: colors.ghost,
      color: colors.ghostText,
    },
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 20,
      minHeight: 20,
      borderRadius: 10,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      minWidth: 24,
      minHeight: 24,
      borderRadius: 12,
    },
    large: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minWidth: 32,
      minHeight: 32,
      borderRadius: 16,
    },
  };

  const textSizes = {
    small: { fontSize: 10, fontWeight: "600" },
    medium: { fontSize: 12, fontWeight: "600" },
    large: { fontSize: 14, fontWeight: "600" },
  };

  return (
    <View
      style={[
        {
          backgroundColor: variantStyles[variant].backgroundColor,
          ...sizeStyles[size],
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={{
            color: variantStyles[variant].color,
            ...textSizes[size],
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
