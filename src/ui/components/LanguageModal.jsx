import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../config/theme';
import { Heading, Body } from './ui/Text';

export default function LanguageModal({ visible, onClose, currentLanguage, onLanguageChange }) {
    const { colors, radius, spacing, shadows } = useTheme();
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    ];

    // Reset selection when modal opens
    React.useEffect(() => {
        if (visible) {
            setSelectedLanguage(currentLanguage);
        }
    }, [visible, currentLanguage]);

    const handleConfirm = () => {
        if (selectedLanguage !== currentLanguage) {
            onLanguageChange(selectedLanguage);
        }
        onClose();
    };

    const hasChanges = selectedLanguage !== currentLanguage;

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
                            <Heading variant="h3" style={{ marginBottom: spacing.lg }}>
                                Select Language
                            </Heading>

                            {/* Language Options */}
                            <View style={{ gap: spacing.sm }}>
                                {languages.map((language) => {
                                    const isSelected = selectedLanguage === language.code;

                                    return (
                                        <TouchableOpacity
                                            key={language.code}
                                            onPress={() => setSelectedLanguage(language.code)}
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
                                            <View style={{ flex: 1 }}>
                                                <Body weight="semibold" style={{ marginBottom: 2 }}>
                                                    {language.nativeName}
                                                </Body>
                                                <Body variant="small" color="secondary">
                                                    {language.name}
                                                </Body>
                                            </View>

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
        maxWidth: 380,
        padding: 24,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    actionButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
