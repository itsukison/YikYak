import React from "react";
import { View } from "react-native";
import { useTheme } from "../utils/theme";

/**
 * AppBackground component - Clean background for app screens
 * Uses light gray (#F8F9FA) for spacious, modern feel
 */
export default function AppBackground({ children, style }) {
  const { colors } = useTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}