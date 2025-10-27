import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Button component with multiple variants
 * Variants: primary (black), secondary (orange), tertiary (pale blue), ghost (light gray)
 */
export default function Button({
  children,
  variant = "primary",
  size = "medium",
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
  ...props
}) {
  const { colors, radius, typography, spacing, shadows } = useTheme();

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? colors.border : colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: disabled ? colors.border : colors.secondary,
      borderWidth: 0,
    },
    tertiary: {
      backgroundColor: disabled ? colors.border : colors.accent,
      borderWidth: 0,
    },
    ghost: {
      backgroundColor: disabled ? colors.borderLight : colors.ghost,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: disabled ? colors.border : colors.primary,
    },
  };

  // Text color based on variant
  const textColors = {
    primary: colors.primaryText,
    secondary: colors.secondaryText,
    tertiary: colors.accentText,
    ghost: colors.ghostText,
    outline: disabled ? colors.textTertiary : colors.primary,
  };

  // Size styles
  const sizeStyles = {
    small: {
      paddingHorizontal: spacing["2xl"],
      paddingVertical: spacing.md,
      minHeight: 40,
      borderRadius: radius.button,
    },
    medium: {
      paddingHorizontal: spacing["3xl"],
      paddingVertical: spacing.lg,
      minHeight: 48,
      borderRadius: radius.button,
    },
    large: {
      paddingHorizontal: spacing["4xl"],
      paddingVertical: spacing.xl,
      minHeight: 56,
      borderRadius: radius.buttonLarge,
    },
  };

  const textSizes = {
    small: { ...typography.bodySmallMedium },
    medium: { ...typography.bodyMedium },
    large: { ...typography.bodyLarge, fontWeight: "600" },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          ...variantStyles[variant],
          ...sizeStyles[size],
        },
        fullWidth && { width: "100%" },
        disabled && { opacity: 0.5 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <View style={{ marginRight: spacing.sm }}>{icon}</View>
          )}
          <Text
            style={[
              {
                color: textColors[variant],
                ...textSizes[size],
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === "right" && (
            <View style={{ marginLeft: spacing.sm }}>{icon}</View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
