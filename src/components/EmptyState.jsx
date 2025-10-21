import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';

export default function EmptyState({ 
  Icon, 
  title, 
  description, 
  iconColor,
  style 
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
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
          borderRadius: 40,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Icon size={36} color={iconColor || colors.accent} strokeWidth={1.5} />
      </View>

      {/* Empty state title */}
      <Text
        style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 20,
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {/* Empty state description */}
      <Text
        style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          letterSpacing: 0.2,
        }}
      >
        {description}
      </Text>
    </View>
  );
}