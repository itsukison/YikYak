import React from "react";
import { View } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Divider component - Clean dividers for separating content
 */
export default function Divider({
  orientation = "horizontal",
  spacing: spacingProp = "default",
  style,
  ...props
}) {
  const { colors, spacing } = useTheme();

  const spacingStyles = {
    none: {},
    small: {
      marginVertical: orientation === "horizontal" ? spacing.md : 0,
      marginHorizontal: orientation === "vertical" ? spacing.md : 0,
    },
    default: {
      marginVertical: orientation === "horizontal" ? spacing.lg : 0,
      marginHorizontal: orientation === "vertical" ? spacing.lg : 0,
    },
    large: {
      marginVertical: orientation === "horizontal" ? spacing["2xl"] : 0,
      marginHorizontal: orientation === "vertical" ? spacing["2xl"] : 0,
    },
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.border,
          ...(orientation === "horizontal"
            ? { height: 1, width: "100%" }
            : { width: 1, height: "100%" }),
          ...spacingStyles[spacingProp],
        },
        style,
      ]}
      {...props}
    />
  );
}
