import React from "react";
import { TextInput, View, Text } from "react-native";
import { useTheme } from "../../utils/theme";

/**
 * Input component - Clean form inputs with consistent styling
 */
export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  multiline = false,
  style,
  containerStyle,
  ...props
}) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text
          style={{
            ...typography.bodySmallMedium,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          backgroundColor: colors.inputBackground,
          borderRadius: radius.input,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: multiline ? spacing.lg : spacing.md,
          minHeight: multiline ? 120 : 48,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: spacing.md }}>{leftIcon}</View>
        )}
        <TextInput
          style={[
            {
              flex: 1,
              ...typography.body,
              color: colors.text,
              textAlignVertical: multiline ? "top" : "center",
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          {...props}
        />
        {rightIcon && (
          <View style={{ marginLeft: spacing.md }}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text
          style={{
            ...typography.caption,
            color: colors.error,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
