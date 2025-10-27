import React from "react";
import { View } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Section component - Section wrapper with consistent spacing
 */
export default function Section({
  children,
  spacing: spacingProp = "default",
  style,
  ...props
}) {
  const { spacing } = useTheme();

  const spacingStyles = {
    small: { marginBottom: spacing["2xl"] },
    default: { marginBottom: spacing["3xl"] },
    large: { marginBottom: spacing["5xl"] },
    none: {},
  };

  return (
    <View
      style={[
        {
          ...spacingStyles[spacingProp],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
