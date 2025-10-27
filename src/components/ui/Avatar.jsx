import React from "react";
import { View, Text, Image } from "react-native";
import { useTheme } from "../../utils/theme";

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

  const textSizes = {
    small: { fontSize: 14, fontWeight: "600" },
    medium: { fontSize: 18, fontWeight: "600" },
    large: { fontSize: 28, fontWeight: "700" },
    xlarge: { fontSize: 40, fontWeight: "700" },
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColorFromName = (name) => {
    if (!name) return colors.accent;
    const colors_list = [
      "#FF5A1F", // Orange
      "#B7D4FF", // Pale Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors_list.length;
    return colors_list[index];
  };

  const backgroundColor = getColorFromName(name);

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
        <Text
          style={{
            color: "#FFFFFF",
            ...textSizes[normalizedSize],
          }}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
