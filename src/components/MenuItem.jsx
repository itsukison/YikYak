import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../utils/theme';
import { Body, Caption } from './ui/Text';

/**
 * MenuItem component - Clean menu item with icon and text
 * Artifact-inspired with proper spacing and typography
 */
export default function MenuItem({ 
  Icon, 
  title, 
  subtitle, 
  onPress, 
  showDivider = false,
  showChevron = true 
}) {
  const { colors, radius, spacing } = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.avatar,
            backgroundColor: colors.inputBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
          }}
        >
          <Icon size={20} color={colors.text} strokeWidth={2} />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Body variant="bodyMedium" style={{ marginBottom: spacing.xs }}>
            {title}
          </Body>
          {subtitle && (
            <Caption color={colors.textSecondary}>
              {subtitle}
            </Caption>
          )}
        </View>

        {/* Chevron */}
        {showChevron && (
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {/* Divider */}
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginLeft: 68, // Align with text content
          }}
        />
      )}
    </>
  );
}