import React, { useEffect, useRef } from "react";
import {
    View,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    Alert,
    Animated,
    Dimensions,
} from "react-native";
import { MessageCircle, Ban, UserMinus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../config/theme";
import { Body } from "./ui/Text";
import { useBlockUserMutation, useUnblockUserMutation } from "../../services/user/useUserActions";
import { useLanguageStore } from "../../services/i18n/languageStore";

export default function UserActionSheet({
    visible,
    onClose,
    targetUser,
    isBlocked,
    onChatPress,
}) {
    const { colors, radius, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const { t } = useLanguageStore();

    const blockMutation = useBlockUserMutation();
    const unblockMutation = useUnblockUserMutation();

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

    const resetAndClose = () => {
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').height,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const handleBlock = () => {
        Alert.alert(
            t('user_actions.block_title'),
            t('user_actions.block_message').replace('{name}', targetUser?.nickname || t('user_actions.this_user')),
            [
                { text: t('user_actions.cancel'), style: "cancel" },
                {
                    text: t('user_actions.block'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await blockMutation.mutateAsync({
                                blockedUserId: targetUser.id
                            });
                            Alert.alert(t('user_actions.alert_blocked'), t('user_actions.alert_blocked_message').replace('{name}', targetUser?.nickname || t('general.user')));
                            resetAndClose();
                        } catch (error) {
                            Alert.alert(t('user_actions.alert_error'), t('user_actions.alert_block_error'));
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const handleUnblock = () => {
        Alert.alert(
            t('user_actions.unblock_title'),
            t('user_actions.unblock_message').replace('{name}', targetUser?.nickname || t('user_actions.this_user')),
            [
                { text: t('user_actions.cancel'), style: "cancel" },
                {
                    text: t('user_actions.unblock'),
                    style: "default",
                    onPress: async () => {
                        try {
                            await unblockMutation.mutateAsync({
                                blockedUserId: targetUser.id
                            });
                            Alert.alert(t('user_actions.alert_unblocked'), t('user_actions.alert_unblocked_message').replace('{name}', targetUser?.nickname || t('general.user')));
                            resetAndClose();
                        } catch (error) {
                            Alert.alert(t('user_actions.alert_error'), t('user_actions.alert_unblock_error'));
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const handleChat = () => {
        resetAndClose();
        if (onChatPress) {
            onChatPress();
        }
    };

    if (!targetUser) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={resetAndClose}
        >
            <TouchableWithoutFeedback onPress={resetAndClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.sheet,
                                {
                                    transform: [{ translateY: slideAnim }],
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

                                <View style={{ padding: spacing.md }}>
                                    {/* Chat Option */}
                                    <TouchableOpacity style={styles.option} onPress={handleChat}>
                                        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                                            <MessageCircle size={24} color={colors.text} />
                                        </View>
                                        <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>{t('user_actions.send_message')}</Body>
                                    </TouchableOpacity>

                                    {/* Block/Unblock Option */}
                                    {isBlocked ? (
                                        <TouchableOpacity style={styles.option} onPress={handleUnblock}>
                                            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
                                                <UserMinus size={24} color={colors.text} />
                                            </View>
                                            <Body style={{ marginLeft: spacing.md, fontSize: 16 }}>{t('user_actions.unblock_user')}</Body>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={styles.option} onPress={handleBlock}>
                                            <View style={[styles.iconContainer, { backgroundColor: colors.errorSubtle }]}>
                                                <Ban size={24} color={colors.error} />
                                            </View>
                                            <Body style={{ marginLeft: spacing.md, color: colors.error, fontSize: 16 }}>{t('user_actions.block_user')}</Body>
                                        </TouchableOpacity>
                                    )}
                                </View>
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
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    sheet: {
        width: "100%",
        maxHeight: "50%",
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
});
