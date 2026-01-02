import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Check, MapPin } from 'lucide-react-native';
import { useTheme } from '../../config/theme';
import { Heading, Body, Caption } from './ui/Text';

export default function LocationRadiusModal({ visible, onClose, currentRadius, onRadiusChange }) {
    const { colors, radius, spacing, shadows } = useTheme();
    const [selectedRadius, setSelectedRadius] = useState(currentRadius);

    const radiusOptions = [
        {
            value: 300,
            title: 'Classroom',
            subtitle: 'See posts within 300m',
        },
        {
            value: 5000,
            title: 'Campus',
            subtitle: 'See posts within 5km',
        },
        {
            value: -1,
            title: 'Unlimited',
            subtitle: 'See all posts',
        },
    ];

    // Reset selection when modal opens
    React.useEffect(() => {
        if (visible) {
            setSelectedRadius(currentRadius);
        }
    }, [visible, currentRadius]);

    const handleConfirm = () => {
        if (selectedRadius !== currentRadius) {
            onRadiusChange(selectedRadius);
        }
        onClose();
    };

    const hasChanges = selectedRadius !== currentRadius;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[
                                styles.container,
                                {
                                    backgroundColor: colors.surface,
                                    borderRadius: 20,
                                    ...shadows.medium,
                                },
                            ]}
                        >
                            {/* Header */}
                            <View style={{ marginBottom: spacing.lg }}>
                                <Heading variant="h3" style={{ marginBottom: 4 }}>
                                    Location Radius
                                </Heading>
                                <Caption color="secondary">
                                    Choose how far you want to see posts
                                </Caption>
                            </View>

                            {/* Radius Options */}
                            <View style={{ gap: spacing.sm }}>
                                {radiusOptions.map((option) => {
                                    const isSelected = selectedRadius === option.value;

                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setSelectedRadius(option.value)}
                                            activeOpacity={0.7}
                                            style={[
                                                styles.optionButton,
                                                {
                                                    backgroundColor: isSelected ? colors.primarySubtle : colors.surfaceElevated,
                                                    borderRadius: 14,
                                                    borderWidth: isSelected ? 2 : 1,
                                                    borderColor: isSelected ? colors.primary : colors.border,
                                                },
                                            ]}
                                        >
                                            {/* Icon */}
                                            <View
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    backgroundColor: isSelected ? colors.primary : colors.surface,
                                                    borderRadius: radius.pill,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <MapPin
                                                    size={20}
                                                    color={isSelected ? colors.primaryText : colors.textSecondary}
                                                />
                                            </View>

                                            {/* Content */}
                                            <View style={{ flex: 1 }}>
                                                <Body weight="semibold" style={{ marginBottom: 2 }}>
                                                    {option.title}
                                                </Body>
                                                <Caption color="secondary" style={{ fontSize: 12 }}>
                                                    {option.subtitle}
                                                </Caption>
                                            </View>

                                            {/* Check Icon */}
                                            {isSelected && (
                                                <View
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        backgroundColor: colors.primary,
                                                        borderRadius: radius.pill,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Check size={16} color={colors.primaryText} strokeWidth={3} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                onPress={hasChanges ? handleConfirm : onClose}
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: hasChanges ? colors.primary : colors.surfaceElevated,
                                        borderRadius: radius.pill,
                                        marginTop: spacing.lg,
                                    },
                                ]}
                            >
                                <Body weight="semibold" style={{ color: hasChanges ? colors.primaryText : colors.text }}>
                                    {hasChanges ? 'Confirm' : 'Cancel'}
                                </Body>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
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
        maxWidth: 400,
        padding: 24,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 12,
    },
    actionButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
