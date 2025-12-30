import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../config/theme';
import { Button, Card } from './ui';
import { Heading, Body } from './ui/Text';

export default function LocationPermissionPrimer({ visible, onEnable, onSkip }) {
    const { colors, spacing } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            statusBarTranslucent
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl, paddingHorizontal: spacing['2xl'] }}>
                    <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: colors.surfaceElevated,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: spacing.lg
                            }}
                        >
                            <MapPin size={32} color={colors.primary} />
                        </View>

                        <Heading variant="h2" style={{ textAlign: 'center', marginBottom: spacing.md }}>
                            Find Your Local Community
                        </Heading>

                        <Body style={{ textAlign: 'center', marginBottom: spacing.lg, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                            Hearsay uses your location to show you posts from people nearby. Your exact location is never shared with other users.
                        </Body>

                        <View style={{ width: '100%', gap: spacing.md }}>
                            <Button
                                variant="primary"
                                fullWidth
                                onPress={onEnable}
                            >
                                Enable Location
                            </Button>

                            {onSkip && (
                                <Button
                                    variant="ghost"
                                    fullWidth
                                    onPress={onSkip}
                                >
                                    Maybe Later
                                </Button>
                            )}
                        </View>
                    </Card>
                </View>
            </BlurView>
        </Modal>
    );
}
