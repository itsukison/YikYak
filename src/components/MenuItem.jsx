import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../utils/theme';

export default function MenuItem({ 
  Icon, 
  title, 
  subtitle, 
  onPress, 
  showDivider = false,
  showChevron = true 
}) {
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.inputBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Icon size={20} color={colors.accent} strokeWidth={1.5} />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 16,
              color: colors.text,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 18,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Chevron */}
        {showChevron && (
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.5} />
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