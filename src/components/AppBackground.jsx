import React from "react";
import { View } from "react-native";
import { useTheme } from "../utils/theme";

export default function AppBackground({ children, style }) {
  const { colors } = useTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}