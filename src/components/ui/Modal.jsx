import React from 'react';
import { Modal as RNModal, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/theme';
import { Heading, Body } from './Text';

export default function Modal({
    visible,
    onClose,
    title,
    message,
    actions = [],
    children
}) {
    const { colors, radius, spacing, shadows } = useTheme();

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.container,
                            {
                                backgroundColor: colors.surface,
                                borderRadius: radius.cardLarge,
                                ...shadows.medium,
                            }
                        ]}>
                            {title && (
                                <Heading variant="h2" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                                    {title}
                                </Heading>
                            )}

                            {message && (
                                <Body variant="small" color="secondary" style={{ textAlign: 'center', marginBottom: spacing.xl }}>
                                    {message}
                                </Body>
                            )}

                            {children}

                            {actions.length > 0 && (
                                <View style={{ marginTop: children ? spacing.lg : 0, gap: spacing.md }}>
                                    {actions.map((action, index) => {
                                        // Determine button style
                                        // Default/Primary: Neon Green background, Dark text
                                        // Cancel/Secondary: Surface Elevated background, Normal text
                                        // Destructive: Surface Elevated background, Red text

                                        const isCancel = action.style === 'cancel';
                                        const isDestructive = action.style === 'destructive';
                                        const isSecondary = action.style === 'secondary';
                                        const isPrimary = !isCancel && !isDestructive && !isSecondary;

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    action.onPress?.();
                                                    // We don't automatically close here because the action might be async or want to keep it open
                                                    // But typically for alerts, we want to close. 
                                                    // However, the parent should handle closing via visible prop or inside onPress.
                                                    // Let's assume parent handles logic.
                                                }}
                                                style={[
                                                    styles.button,
                                                    {
                                                        backgroundColor: isPrimary ? colors.primary : colors.surfaceElevated,
                                                        borderRadius: radius.pill,
                                                    }
                                                ]}
                                            >
                                                <Body
                                                    weight="semibold"
                                                    style={{
                                                        color: isPrimary ? colors.primaryText : isDestructive ? colors.error : colors.text,
                                                    }}
                                                >
                                                    {action.text}
                                                </Body>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        padding: 24,
    },
    button: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    }
});
