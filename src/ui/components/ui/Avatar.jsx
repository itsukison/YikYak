import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { User } from "lucide-react-native";
import { useTheme } from "../../../config/theme";

/**
 * Avatar component - User avatars with fallbacks
 * Uses expo-image for advanced caching and performance
 */
export default function Avatar({
  source,
  name,
  size = "medium",
  blurhash,
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
          backgroundColor: source ? backgroundColor : backgroundColor,
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
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk" // Aggressive caching
          placeholder={{ backgroundColor }}
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
