import React from "react";
import { View, Text, Image } from "react-native";
import { User } from "lucide-react-native";
import { useTheme } from "../../../config/theme";

/**
 * Avatar component - User avatars with fallbacks
 */
export default function Avatar({
  source,
  name,
  size = "medium",
  style,
  ...props
}) {
  const { colors, radius, typography } = useTheme();

  // Normalize size prop (accept both "xl" and "xlarge")
  const normalizedSize = size === "xl" ? "xlarge" : size;

  const sizeStyles = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xlarge: { width: 96, height: 96 },
  };

  const iconSizes = {
    small: 18,
    medium: 28,
    large: 38,
    xlarge: 56,
  };

  // Use theme-based background color instead of random colors
  const backgroundColor = colors.surfaceElevated;

  return (
    <View
      style={[
        {
          ...sizeStyles[normalizedSize],
          borderRadius: radius.avatar,
          backgroundColor: source ? "transparent" : backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          aspectRatio: 1, // Ensure circular shape
        },
        style,
      ]}
      {...props}
    >
      {source ? (
        <Image
          source={source}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      ) : (
        <User
          size={iconSizes[normalizedSize]}
          color={colors.textSecondary}
        />
      )}
    </View>
  );
}
