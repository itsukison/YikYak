import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
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
          <MaterialIcons name={Icon} size={20} color={colors.text} />
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
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
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