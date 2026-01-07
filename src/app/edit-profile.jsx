import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Check, Camera } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../config/theme";
import { useAuth } from "../services/auth/useAuth";
import { useAvatar } from "../services/user/useAvatar";
import AppBackground from "../ui/components/AppBackground";
import { Container, Heading, Body, Caption, Button, Avatar, Input } from "../ui/components/ui";
import { useLanguageStore } from "../services/i18n/languageStore";

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const { colors, radius, isDark } = useTheme();
    const router = useRouter();
    const { user, profile, updateProfile } = useAuth();
    const { pickImage, uploadAvatar, uploading: avatarUploading } = useAvatar();
    const { t } = useLanguageStore();

    const [nickname, setNickname] = useState(profile?.nickname || "");
    const [username, setUsername] = useState(profile?.username || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [saving, setSaving] = useState(false);

    // Local state for avatar preview before save/upload logic if needed, 
    // but useAvatar uploads immediately which updates profile.avatar_url
    // so we just rely on profile.avatar_url updates via useAuth

    const handleSave = async () => {
        if (!nickname.trim()) {
            Alert.alert(t('common.error'), t('onboarding.err_nickname_required'));
            return;
        }

        if (username.length < 3) {
            Alert.alert(t('common.error'), t('onboarding.err_username_length'));
            return;
        }

        setSaving(true);
        const { error } = await updateProfile({
            nickname: nickname.trim(),
            username: username.trim(),
            bio: bio.trim(),
        });

        setSaving(false);

        if (error) {
            Alert.alert(t('common.error'), t('onboarding.err_update_failed'));
        } else {
            router.back();
        }
    };

    const handleAvatarChange = async () => {
        try {
            const image = await pickImage();
            if (image) {
                const url = await uploadAvatar(user.id, image);
                if (url) {
                    await updateProfile({ avatar_url: url });
                }
            }
        } catch (error) {
            console.error("Avatar error:", error);
            Alert.alert(t('common.error'), t('profile.photo_upload_fail'));
        }
    };

    return (
        <AppBackground>
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Header */}
            <View
                style={{
                    paddingTop: insets.top + 10,
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                }}
            >
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <Heading variant="h3" weight="semibold">{t('edit_profile.title')}</Heading>

                {saving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <TouchableOpacity onPress={handleSave}>
                        <Check size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <View style={{ alignItems: "center", marginBottom: 32, marginTop: 10 }}>
                        <TouchableOpacity onPress={handleAvatarChange} activeOpacity={0.8}>
                            <View>
                                <Avatar
                                    size="xlarge"
                                    name={nickname}
                                    source={profile?.avatar_url ? { uri: profile.avatar_url } : null}
                                    style={{ opacity: avatarUploading ? 0.7 : 1 }}
                                />
                                <View
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        backgroundColor: colors.surface,
                                        borderRadius: radius.pill,
                                        padding: 8,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        shadowColor: colors.shadow,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 4,
                                        elevation: 2,
                                    }}
                                >
                                    <Camera size={16} color={colors.text} />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Caption style={{ marginTop: 12, color: colors.textSecondary }}>
                            {avatarUploading ? t('edit_profile.uploading') : t('edit_profile.change_photo')}
                        </Caption>
                    </View>

                    {/* Form Fields */}
                    <View style={{ gap: 20 }}>
                        <View>
                            <Caption style={{ marginBottom: 6, marginLeft: 4, fontWeight: '600', color: colors.textSecondary }}>{t('edit_profile.label_name')}</Caption>
                            <View style={{
                                backgroundColor: colors.surface,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 16,
                                height: 50,
                            }}>
                                <TextInput
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder={t('edit_profile.placeholder_name')}
                                    autoCapitalize="words"
                                    style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: colors.text,
                                        height: '100%',
                                        paddingVertical: 0,
                                    }}
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        </View>

                        <View>
                            <Caption style={{ marginBottom: 6, marginLeft: 4, fontWeight: '600', color: colors.textSecondary }}>{t('edit_profile.label_username')}</Caption>
                            <View style={{
                                backgroundColor: colors.surface,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 16,
                                height: 50,
                            }}>
                                <TextInput
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder={t('edit_profile.placeholder_username')}
                                    autoCapitalize="none"
                                    style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: colors.text,
                                        height: '100%', // Ensure it takes full height
                                        paddingVertical: 0, // CRITICAL: Remove default padding to fix alignment
                                    }}
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        </View>

                        <View>
                            <Caption style={{ marginBottom: 6, marginLeft: 4, fontWeight: '600', color: colors.textSecondary }}>{t('edit_profile.label_bio')}</Caption>
                            <TextInput
                                value={bio}
                                onChangeText={setBio}
                                placeholder={t('edit_profile.placeholder_bio')}
                                multiline
                                maxLength={150}
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: 12,
                                    padding: 16,
                                    color: colors.text,
                                    borderWidth: 1,
                                    borderColor: colors.borderLight,
                                    minHeight: 120, // Taller bio box
                                    textAlignVertical: 'top',
                                    fontSize: 16,
                                    paddingTop: 16, // Explicit top padding for multiline
                                }}
                                placeholderTextColor={colors.textTertiary}
                            />
                            <Caption style={{ alignSelf: 'flex-end', marginTop: 6, color: colors.textTertiary }}>
                                {bio.length}/150
                            </Caption>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </AppBackground>
    );
}
