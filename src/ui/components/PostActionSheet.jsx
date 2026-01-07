import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
} from "react-native";
import { ArrowLeft, ChevronRight, Flag, Mail, Ban, Edit2, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../config/theme";
import { Body, Heading } from "./ui/Text";
import { Button } from "./ui";
import { useReportPostMutation, useDeletePostMutation } from "../../services/posts/usePostActions";
import { useBlockUserMutation } from "../../services/user/useUserActions";
import { useAuth } from "../../services/auth/useAuth";
import { useLanguageStore } from "../../services/i18n/languageStore";
import { router } from "expo-router";
import { supabase } from "../../adapters/supabaseClient";

const REPORT_REASONS = [
    "Spam",
    "Harassment or bullying",
    "Hate speech",
    "Nudity or sexual content",
    "Violence",
    "Misinformation",
    "Other"
];

export default function PostActionSheet({ visible, onClose, post }) {
    const { colors, radius, spacing } = useTheme();
    const { user } = useAuth();
    const { t } = useLanguageStore();
    const insets = useSafeAreaInsets();
    const [reportMode, setReportMode] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const reportMutation = useReportPostMutation();
    const blockMutation = useBlockUserMutation();
    const deleteMutation = useDeletePostMutation();

    // Animation values
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('window').height,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleReport = async (reason) => {
        const finalReason = reason === "Other" ? customReason : reason;

        if (!finalReason.trim()) {
            Alert.alert(t('post_actions.alert_error'), t('post_actions.alert_provide_reason'));
            return;
        }

        try {
            await reportMutation.mutateAsync({
                reporterId: user.id,
                postId: post.id,
                reportedUserId: post.user_id,
                reason: finalReason,
            });
            Alert.alert(t('post_actions.alert_reported'), t('post_actions.alert_report_success'));
            resetAndClose();
        } catch (error) {
            Alert.alert(t('post_actions.alert_error'), t('post_actions.alert_report_error'));
            console.error(error);
        }
    };

    const resetAndClose = () => {
        // Animate out before closing
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            setReportMode(false);
            setConfirmDelete(false);
            setReportReason("");
            setCustomReason("");
        });
    };

    const handleBlock = () => {
        Alert.alert(
            t('post_actions.alert_block_title'),
            t('post_actions.alert_block_message'),
            [
                { text: t('post_actions.cancel'), style: "cancel" },
                {
                    text: t('post_actions.alert_block'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await blockMutation.mutateAsync({ blockedUserId: post.user_id });
                            Alert.alert(t('post_actions.alert_blocked'), t('post_actions.alert_blocked_message'));
                            resetAndClose();
                        } catch (error) {
                            Alert.alert(t('post_actions.alert_error'), t('post_actions.alert_block_error'));
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const handleDM = async () => {
        if (!user || !post.user_id) return;

        try {
            // Check if chat exists
            const { data: existingChats, error: fetchError } = await supabase
                .from('chats')
                .select('id, user1_id, user2_id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .or(`user1_id.eq.${post.user_id},user2_id.eq.${post.user_id}`);

            if (fetchError) throw fetchError;

            let chatId;
            // Filter for the specific chat between these two users
            const chat = existingChats?.find(
                c => (c.user1_id === user.id && c.user2_id === post.user_id) ||
                    (c.user1_id === post.user_id && c.user2_id === user.id)
            );

            if (chat) {
                chatId = chat.id;
            } else {
                // Create new chat
                // Sort user IDs to ensure consistency and satisfy potential check constraints (user1_id < user2_id)
                const [u1, u2] = [user.id, post.user_id].sort();

                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({
                        user1_id: u1,
                        user2_id: u2,
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                chatId = newChat.id;
            }

            resetAndClose();
            router.push({
                pathname: `/chat/${chatId}`,
                params: {
                    otherUserId: post.user_id,
                    otherUserNickname: post.is_anonymous ? "Anonymous" : post.author_nickname || "User",
                    otherUserIsAnonymous: post.is_anonymous,
                }
            });
        } catch (error) {
            console.error("Error initiating DM:", error);
            Alert.alert(t('post_actions.alert_error'), t('post_actions.alert_dm_error'));
        }
    };

    const handleEdit = () => {
        resetAndClose();
        router.push({
            pathname: "/compose",
            params: {
                mode: "edit",
                post: JSON.stringify(post),
            },
        });
    };

    const handleDelete = () => {
        setConfirmDelete(true);
    };

    const confirmDeleteAction = async () => {
        try {
            await deleteMutation.mutateAsync({ postId: post.id });
            resetAndClose();
        } catch (error) {
            Alert.alert(t('post_actions.alert_error'), t('post_actions.alert_delete_error'));
            console.error(error);
        }
    };

    if (!post) return null;

    const REPORT_REASONS = [
        t('post_actions.report_spam'),
        t('post_actions.report_harassment'),
        t('post_actions.report_hate'),
        t('post_actions.report_nudity'),
        t('post_actions.report_violence'),
        t('post_actions.report_misinfo'),
        t('post_actions.report_other')
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={resetAndClose}
        >
            <TouchableWithoutFeedback onPress={resetAndClose}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ width: "100%" }}
                    >
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.sheet,
                                    {
                                        transform: [{ translateY: slideAnim }],
                                        // Background color moved to inner view and filler
                                    }
                                ]}
                            >
                                {/* Main Content Container */}
                                <View style={{
                                    backgroundColor: colors.surface,
                                    borderTopLeftRadius: radius.card,
                                    borderTopRightRadius: radius.card,
                                    paddingBottom: insets.bottom,
                                    overflow: 'hidden',
                                }}>
                                    {/* Drag Handle */}
                                    <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
                                        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
                                    </View>

                                    {confirmDelete ? (
                                        <View style={{ padding: spacing.lg }}>
                                            <Heading variant="h3" style={{ textAlign: "center", marginBottom: spacing.md }}>
                                                {t('post_actions.delete_title')}
                                            </Heading>
                                            <Body variant="bodySmall" color="secondary" style={{ textAlign: "center", marginBottom: spacing.xl, lineHeight: 20 }}>
                                                {t('post_actions.delete_message')}
                                            </Body>

                                            <View style={{ gap: spacing.md }}>
                                                <Button
                                                    variant="destructive"
                                                    onPress={confirmDeleteAction}
                                                    loading={deleteMutation.isPending}
                                                    fullWidth
                                                >
                                                    {t('post_actions.delete')}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onPress={() => setConfirmDelete(false)}
                                                    fullWidth
                                                >
                                                    {t('post_actions.cancel')}
                                                </Button>
                                            </View>
                                        </View>
                                    ) : reportMode ? (
                                        <View style={{ padding: spacing.lg, height: 400 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
                                                <TouchableOpacity onPress={() => setReportMode(false)} style={{ padding: 4 }}>
                                                    <ArrowLeft size={24} color={colors.text} />
                                                </TouchableOpacity>
                                                <Heading variant="h3" style={{ marginLeft: spacing.sm }}>{t('post_actions.report_title')}</Heading>
                                            </View>

                                            <Body variant="bodySmall" color="secondary" style={{ marginBottom: spacing.md }}>
                                                {t('post_actions.report_instruction')}
                                            </Body>

                                            <ScrollView showsVerticalScrollIndicator={false}>
                                                {REPORT_REASONS.map((reason) => (
                                                    <TouchableOpacity
                                                        key={reason}
                                                        style={{
                                                            paddingVertical: 16,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: colors.borderLight,
                                                            flexDirection: "row",
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}
                                                        onPress={() => {
                                                            if (reason === t('post_actions.report_other')) {
                                                                setReportReason(t('post_actions.report_other'));
                                                            } else {
                                                                handleReport(reason);
                                                            }
                                                        }}
                                                    >
                                                        <Body>{reason}</Body>
                                                        <ChevronRight size={20} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ))}

                                                {reportReason === t('post_actions.report_other') && (
                                                    <View style={{ marginTop: spacing.md, marginBottom: 40 }}>
                                                        <TextInput
                                                            style={[
                                                                styles.input,
                                                                {
                                                                    backgroundColor: colors.background,
                                                                    color: colors.text,
                                                                    borderColor: colors.border,
                                                                    borderRadius: radius.input,
                                                                },
                                                            ]}
                                                            placeholder={t('post_actions.report_describe')}
                                                            placeholderTextColor={colors.textSecondary}
                                                            value={customReason}
                                                            onChangeText={setCustomReason}
                                                            multiline
                                                            autoFocus
                                                        />
                                                        <Button
                                                            variant="primary"
                                                            onPress={() => handleReport(t('post_actions.report_other'))}
                                                            style={{ marginTop: spacing.md }}
                                                            loading={reportMutation.isPending}
                                                        >
                                                            {t('post_actions.submit_report')}
                                                        </Button>
                                                    </View>
                                                )}
                                            </ScrollView>
                                        </View>
                                    ) : (
                                        <View style={{ padding: spacing.md }}>
                                            {user && post.user_id === user.id ? (
                                                <>
                                                    <TouchableOpacity style={styles.option} onPress={handleEdit}>
                                                        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
                                                            <Edit2 size={24} color={colors.text} />
                                                        </View>
                                                        <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>{t('post_actions.edit_post')}</Body>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity style={styles.option} onPress={handleDelete}>
                                                        <View style={[styles.iconContainer, { backgroundColor: colors.errorSubtle }]}>
                                                            <Trash2 size={24} color={colors.error} />
                                                        </View>
                                                        <Body style={{ marginLeft: spacing.md, color: colors.error, fontSize: 16 }}>{t('post_actions.delete_post')}</Body>
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity style={styles.option} onPress={() => setReportMode(true)}>
                                                        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                                            <Flag size={24} color={colors.text} />
                                                        </View>
                                                        <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>{t('post_actions.report_post')}</Body>
                                                    </TouchableOpacity>

                                                    {!post.is_anonymous && (
                                                        <TouchableOpacity style={styles.option} onPress={handleDM}>
                                                            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                                                <Mail size={24} color={colors.text} />
                                                            </View>
                                                            <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>{t('post_actions.send_message')}</Body>
                                                        </TouchableOpacity>
                                                    )}

                                                    {!post.is_anonymous && (
                                                        <TouchableOpacity style={styles.option} onPress={handleBlock}>
                                                            <View style={[styles.iconContainer, { backgroundColor: colors.errorSubtle }]}>
                                                                <Ban size={24} color={colors.error} />
                                                            </View>
                                                            <Body style={{ marginLeft: spacing.md, color: colors.error, fontSize: 16 }}>{t('post_actions.block_user')}</Body>
                                                        </TouchableOpacity>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Filler for bottom gap/bounce */}
                                <View style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    height: 1000,
                                    backgroundColor: colors.surface
                                }} />
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal >
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end", // Align to bottom
    },
    sheet: {
        width: "100%",
        maxHeight: "90%", // Increased limit
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        padding: 12,
        borderWidth: 1,
        minHeight: 100,
        textAlignVertical: "top",
    },
});
