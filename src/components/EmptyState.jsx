import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';
import { Heading, Body } from './ui/Text';

/**
 * EmptyState component - Clean, minimal empty state design
 * Artifact-inspired with generous spacing and bold typography
 */
export default function EmptyState({ 
  Icon, 
  title, 
  description, 
  iconColor,
  style 
}) {
  const insets = useSafeAreaInsets();
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing["3xl"],
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {/* Empty state icon */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.avatar,
          backgroundColor: colors.accentSubtle,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing["3xl"],
        }}
      >
        <MaterialIcons name={Icon} size={36} color={iconColor || colors.accent} />
      </View>

      {/* Empty state title */}
      <Heading
        variant="h2"
        style={{
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Heading>

      {/* Empty state description */}
      <Body
        variant="body"
        color={colors.textSecondary}
        style={{
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        {description}
      </Body>
    </View>
  );
}