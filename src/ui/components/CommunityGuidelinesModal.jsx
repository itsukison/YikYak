import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../config/theme';
import { Button, Card } from './ui'; // Assuming these are exported from ui/index.js or similar
import { Heading, Body } from './ui/Text';
import { BlurView } from 'expo-blur';

const GUIDELINES_KEY = 'hearsay_guidelines_accepted_v1';

export default function CommunityGuidelinesModal() {
    const [visible, setVisible] = useState(false);
    const { colors, spacing, radius } = useTheme();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const accepted = await AsyncStorage.getItem(GUIDELINES_KEY);
            if (!accepted) {
                setVisible(true);
            }
        } catch (e) {
            console.error('Error checking guidelines status', e);
        }
    };

    const handleAccept = async () => {
        try {
            await AsyncStorage.setItem(GUIDELINES_KEY, 'true');
            setVisible(false);
        } catch (e) {
            console.error('Error saving guidelines status', e);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            statusBarTranslucent
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
                    <Card style={{ maxHeight: '80%', padding: 0, overflow: 'hidden' }}>
                        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
                            <Heading variant="h2" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
                                Welcome to HearSay
                            </Heading>

                            <Body style={{ marginBottom: spacing.md, textAlign: 'center' }}>
                                To keep our community safe and enjoyable, please agree to our community rules:
                            </Body>

                            <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
                                <GuidelineItem
                                    icon="🤝"
                                    title="Be Respectful"
                                    description="Treat everyone with respect. Harassment, bullying, and hate speech are not tolerated."
                                    colors={colors}
                                />
                                <GuidelineItem
                                    icon="🚫"
                                    title="No Explicit Content"
                                    description="Pornography and sexually explicit content are strictly prohibited."
                                    colors={colors}
                                />
                                <GuidelineItem
                                    icon="⚖️"
                                    title="Follow the Law"
                                    description="Do not post illegal content or promote illegal acts."
                                    colors={colors}
                                />
                                <GuidelineItem
                                    icon="⚠️"
                                    title="Zero Tolerance"
                                    description="Violations will result in immediate content removal and potential account bans."
                                    colors={colors}
                                />
                            </View>

                            <Button
                                variant="primary"
                                fullWidth
                                onPress={handleAccept}
                            >
                                I Understand and Agree
                            </Button>
                        </ScrollView>
                    </Card>
                </View>
            </BlurView>
        </Modal>
    );
}

function GuidelineItem({ icon, title, description, colors }) {
    return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 40, alignItems: 'center' }}>
                <Heading variant="h2">{icon}</Heading>
            </View>
            <View style={{ flex: 1 }}>
                <Heading variant="h4" style={{ marginBottom: 4 }}>{title}</Heading>
                <Body variant="bodySmall" color={colors.textSecondary}>
                    {description}
                </Body>
            </View>
        </View>
    );
}
