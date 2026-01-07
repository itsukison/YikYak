import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../../../config/theme";
import { Body } from "../ui/Text";

/**
 * Reusable menu option for BottomSheet
 *
 * Usage:
 * <BottomSheetOption
 *   icon={<Mail size={20} color={colors.text} />}
 *   label="Send Message"
 *   onPress={handleSendMessage}
 *   destructive={false}
 *   showChevron={true}
 * />
 */
export default function BottomSheetOption({
  icon,
  label,
  onPress,
  destructive = false,
  showChevron = false,
  disabled = false,
}) {
  const { colors, radius, spacing } = useTheme();

  const textColor = destructive
    ? colors.error
    : disabled
    ? colors.textSecondary
    : colors.text;

  const iconColor = destructive
    ? colors.error
    : disabled
    ? colors.textSecondary
    : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.option,
        {
          backgroundColor: colors.background,
          borderRadius: radius.md,
          padding: spacing.md,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      {/* Icon Container */}
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: destructive
                ? `${colors.error}15`
                : `${colors.primary}15`,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginRight: spacing.md,
            },
          ]}
        >
          {React.cloneElement(icon, { color: iconColor, size: 20 })}
        </View>
      )}

      {/* Label */}
      <View style={styles.labelContainer}>
        <Body
          style={{
            color: textColor,
            fontWeight: destructive ? "600" : "500",
          }}
        >
          {label}
        </Body>
      </View>

      {/* Chevron */}
      {showChevron && (
        <ChevronRight
          size={20}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelContainer: {
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
});
