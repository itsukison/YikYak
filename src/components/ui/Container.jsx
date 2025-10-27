import React from "react";
import { View } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Container component - Screen container with proper padding
 */
export default function Container({
  children,
  padding = "default",
  style,
  ...props
}) {
  const { spacing } = useTheme();

  const paddingStyles = {
    none: {},
    small: { paddingHorizontal: spacing.lg },
    default: { paddingHorizontal: spacing.xl },
    large: { paddingHorizontal: spacing["2xl"] },
  };

  return (
    <View
      style={[
        {
          flex: 1,
          ...paddingStyles[padding],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
