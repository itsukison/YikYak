import React from "react";
import { View } from "react-native";
import { Body, Caption } from "../../../ui/components/ui";
import { useTheme } from "../../../config/theme";

const DeliveryStatus = ({ message, colors }) => {
    // Unsent/pending message
    if (!message.synced && message.tempId) {
        return (
            <Caption style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 4 }}>
                Sending...
            </Caption>
        );
    }

    // Failed message
    if (message.error) {
        return (
            <Caption style={{ fontSize: 10, color: colors.error || '#ef4444', marginLeft: 4 }}>
                Failed
            </Caption>
        );
    }

    // Read message
    if (message.is_read) {
        return (
            <Caption style={{ fontSize: 10, color: colors.textTertiary, marginLeft: 4 }}>
                Read
            </Caption>
        );
    }

    // Delivered message (synced to database) - HIDDEN
    // if (message.synced || message.id) {
    //     return (
    //         <Caption style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 4 }}>
    //             Delivered
    //         </Caption>
    //     );
    // }

    return null;
};

export default function MessageBubble({ item, isOwnMessage }) {
    const { colors } = useTheme();

    const isPending = !item.synced && item.tempId;
    const hasFailed = !!item.error;

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <View
            style={{
                marginBottom: 16,
                paddingHorizontal: 20,
                alignItems: isOwnMessage ? "flex-end" : "flex-start",
            }}
        >
            {isOwnMessage ? (
                // Own message: timestamp and status on left
                <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                            <Caption
                                color="secondary"
                                style={{ marginBottom: 2 }}
                            >
                                {formatTime(item.created_at)}
                            </Caption>
                            <DeliveryStatus message={item} colors={colors} />
                        </View>
                        <View
                            style={{
                                backgroundColor: hasFailed ? (colors.error || '#ef4444') : colors.primary,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 16,
                                maxWidth: "75%",
                                opacity: isPending ? 0.7 : 1,
                            }}
                        >
                            <Body
                                style={{
                                    color: colors.primaryText,
                                    lineHeight: 22,
                                }}
                            >
                                {item.content}
                            </Body>
                        </View>
                    </View>
                    {hasFailed && item.error && (
                        <Caption style={{ fontSize: 10, color: colors.error || '#ef4444', marginTop: 2 }}>
                            Tap to retry
                        </Caption>
                    )}
                </View>
            ) : (
                // Other's message: timestamp on right
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <View
                        style={{
                            backgroundColor: colors.surfaceElevated,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 16,
                            maxWidth: "75%",
                        }}
                    >
                        <Body
                            style={{
                                color: colors.text,
                                lineHeight: 22,
                            }}
                        >
                            {item.content}
                        </Body>
                    </View>
                    <Caption
                        color="secondary"
                        style={{ marginLeft: 8, marginBottom: 2 }}
                    >
                        {formatTime(item.created_at)}
                    </Caption>
                </View>
            )}
        </View>
    );
}
