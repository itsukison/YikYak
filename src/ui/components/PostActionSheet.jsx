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
            Alert.alert("Error", "Please provide a reason for reporting.");
            return;
        }

        try {
            await reportMutation.mutateAsync({
                reporterId: user.id,
                postId: post.id,
                reportedUserId: post.user_id,
                reason: finalReason,
            });
            Alert.alert("Reported", "Thank you for your report. We will review it shortly.");
            resetAndClose();
        } catch (error) {
            Alert.alert("Error", "Failed to submit report. Please try again.");
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
            "Block User",
            "Are you sure you want to block this user? You will no longer see their posts.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await blockMutation.mutateAsync({ blockedUserId: post.user_id });
                            Alert.alert("Blocked", "User has been blocked.");
                            resetAndClose();
                        } catch (error) {
                            Alert.alert("Error", "Failed to block user.");
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
            Alert.alert("Error", "Failed to start chat.");
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
            Alert.alert("Error", "Failed to delete post.");
            console.error(error);
        }
    };

    if (!post) return null;

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
                                            <Heading variant="h3" style={{ textAlign: "center", marginBottom: spacing.sm }}>
                                                Delete Post?
                                            </Heading>
                                            <Body color="secondary" style={{ textAlign: "center", marginBottom: spacing.xl }}>
                                                Are you sure you want to delete this post? This action cannot be undone.
                                            </Body>

                                            <View style={{ gap: spacing.md }}>
                                                <Button
                                                    variant="destructive"
                                                    onPress={confirmDeleteAction}
                                                    loading={deleteMutation.isPending}
                                                    fullWidth
                                                >
                                                    Delete
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onPress={() => setConfirmDelete(false)}
                                                    fullWidth
                                                >
                                                    Cancel
                                                </Button>
                                            </View>
                                        </View>
                                    ) : reportMode ? (
                                        <View style={{ padding: spacing.lg, height: 400 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
                                                <TouchableOpacity onPress={() => setReportMode(false)} style={{ padding: 4 }}>
                                                    <ArrowLeft size={24} color={colors.text} />
                                                </TouchableOpacity>
                                                <Heading variant="h3" style={{ marginLeft: spacing.sm }}>Report Post</Heading>
                                            </View>

                                            <Body color="secondary" style={{ marginBottom: spacing.md }}>
                                                Please select a reason for reporting this post:
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
                                                            if (reason === "Other") {
                                                                setReportReason("Other");
                                                            } else {
                                                                handleReport(reason);
                                                            }
                                                        }}
                                                    >
                                                        <Body>{reason}</Body>
                                                        <ChevronRight size={20} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ))}

                                                {reportReason === "Other" && (
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
                                                            placeholder="Please describe the issue..."
                                                            placeholderTextColor={colors.textSecondary}
                                                            value={customReason}
                                                            onChangeText={setCustomReason}
                                                            multiline
                                                            autoFocus
                                                        />
                                                        <Button
                                                            variant="primary"
                                                            onPress={() => handleReport("Other")}
                                                            style={{ marginTop: spacing.md }}
                                                            loading={reportMutation.isPending}
                                                        >
                                                            Submit Report
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
                                                        <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>Edit Post</Body>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity style={styles.option} onPress={handleDelete}>
                                                        <View style={[styles.iconContainer, { backgroundColor: colors.errorSubtle }]}>
                                                            <Trash2 size={24} color={colors.error} />
                                                        </View>
                                                        <Body style={{ marginLeft: spacing.md, color: colors.error, fontSize: 16 }}>Delete Post</Body>
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity style={styles.option} onPress={() => setReportMode(true)}>
                                                        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                                            <Flag size={24} color={colors.text} />
                                                        </View>
                                                        <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>Report Post</Body>
                                                    </TouchableOpacity>

                                                    {!post.is_anonymous && (
                                                        <TouchableOpacity style={styles.option} onPress={handleDM}>
                                                            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                                                <Mail size={24} color={colors.text} />
                                                            </View>
                                                            <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>Send Message</Body>
                                                        </TouchableOpacity>
                                                    )}

                                                    {!post.is_anonymous && (
                                                        <TouchableOpacity style={styles.option} onPress={handleBlock}>
                                                            <View style={[styles.iconContainer, { backgroundColor: colors.errorSubtle }]}>
                                                                <Ban size={24} color={colors.error} />
                                                            </View>
                                                            <Body style={{ marginLeft: spacing.md, color: colors.error, fontSize: 16 }}>Block User</Body>
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
