import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Card component - Clean white cards with subtle borders
 * Minimal shadows for interactive cards
 */
export default function Card({
  children,
  interactive = false,
  onPress,
  padding = "default",
  style,
  ...props
}) {
  const { colors, radius, spacing, shadows } = useTheme();

  const paddingStyles = {
    none: {},
    small: { padding: spacing.lg },
    default: { padding: spacing.xl },
    large: { padding: spacing["2xl"] },
  };

  const cardStyle = [
    {
      backgroundColor: colors.cardBackground,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      ...paddingStyles[padding],
      ...(interactive ? shadows.minimal : {}),
    },
    style,
  ];

  if (interactive && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}
