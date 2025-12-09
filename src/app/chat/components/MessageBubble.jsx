import React from "react";
import { View } from "react-native";
import { Body, Caption } from "../../../ui/components/ui";
import { useTheme } from "../../../config/theme";

export default function MessageBubble({ item, isOwnMessage }) {
    const { colors } = useTheme();

    const isPending = !item.synced && item.tempId;

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
                // Own message: timestamp on left
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Caption
                        color="secondary"
                        style={{ marginRight: 8, marginBottom: 2 }}
                    >
                        {formatTime(item.created_at)}
                        {isPending && " • Sending..."}
                    </Caption>
                    <View
                        style={{
                            backgroundColor: colors.primary,
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
