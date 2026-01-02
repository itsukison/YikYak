import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "../config/theme";
import { useAuth } from "../services/auth/useAuth";
import { useLanguageStore } from "../services/i18n/languageStore";
import AppBackground from "../ui/components/AppBackground";
import { Heading, Body, Caption } from "../ui/components/ui";

export default function ContactScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, radius, isDark } = useTheme();
    const { t } = useLanguageStore();
    const { user } = useAuth();

    const [feedbackText, setFeedbackText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Handler: Submit feedback
    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim()) {
            Alert.alert(t("common.error"), "Please enter your feedback");
            return;
        }

        if (feedbackText.length > 1000) {
            Alert.alert(t("common.error"), "Feedback must be less than 1000 characters");
            return;
        }

        setSubmitting(true);
        try {
            // Optional: Save to feedback table if migration exists
            // For now, just show success message
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate submission
            Alert.alert(t("common.ok"), t("help.feedback_success"));
            setFeedbackText("");
        } catch (error) {
            Alert.alert(t("common.error"), t("help.feedback_failed"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppBackground>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Header */}
            <View
                style={{
                    paddingTop: insets.top + 16,
                    paddingBottom: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: colors.background,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Heading variant="h2" weight="semibold">
                        {t("help.contact_title")}
                    </Heading>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 20,
                    paddingHorizontal: 20,
                    paddingTop: 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Section */}
                <View style={{ marginBottom: 32 }}>
                    <Heading variant="h3" style={{ marginBottom: 12 }}>
                        Get in Touch
                    </Heading>
                    <Body color="secondary" style={{ lineHeight: 24 }}>
                        Have feedback, questions, or suggestions? We'd love to hear from you.
                        Your input helps us make Hearsay better for everyone.
                    </Body>
                </View>

                {/* Contact Form */}
                <View
                    style={{
                        backgroundColor: colors.surface,
                        borderRadius: radius.card,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                    }}
                >
                    <Caption color="secondary" style={{ marginBottom: 12 }}>
                        {t("help.feedback_placeholder")}
                    </Caption>

                    <TextInput
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                        placeholder={t("help.feedback_placeholder")}
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={8}
                        maxLength={1000}
                        style={{
                            backgroundColor: colors.inputBackground,
                            borderRadius: radius.input,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            fontSize: 16,
                            color: colors.text,
                            minHeight: 160,
                            textAlignVertical: "top",
                            marginBottom: 12,
                        }}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Caption color="tertiary">{feedbackText.length}/1000</Caption>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmitFeedback}
                        disabled={submitting || !feedbackText.trim()}
                        style={{
                            backgroundColor: feedbackText.trim() && !submitting ? colors.accent : colors.surfaceElevated,
                            borderRadius: radius.button,
                            paddingVertical: 14,
                            alignItems: "center",
                        }}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.text} />
                        ) : (
                            <Body weight="semibold" style={{ color: feedbackText.trim() ? colors.primaryText : colors.textSecondary }}>
                                {t("help.submit_feedback")}
                            </Body>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Additional Contact Info */}
                <View style={{ marginTop: 32 }}>
                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderRadius: radius.card,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                        }}
                    >
                        <Heading variant="h4" style={{ marginBottom: 12 }}>
                            Other Ways to Reach Us
                        </Heading>
                        <Body color="secondary" style={{ lineHeight: 24, marginBottom: 8 }}>
                            Email: support@hearsayjapan.com
                        </Body>
                        <Caption color="secondary">
                            We typically respond within 1-2 business days.
                        </Caption>
                    </View>
                </View>
            </ScrollView>
        </AppBackground>
    );
}
