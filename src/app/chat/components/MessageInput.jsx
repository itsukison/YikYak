import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Send } from "lucide-react-native";
import { useTheme } from "../../../config/theme";

export default function MessageInput({ message, onChangeText, onSend, isSending }) {
    const { colors } = useTheme();

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.background,
            }}
        >
            <TextInput
                value={message}
                onChangeText={onChangeText}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                style={{
                    flex: 1,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 16,
                    color: colors.text,
                    marginRight: 12,
                    minHeight: 40,
                }}
                multiline
                maxLength={500}
            />
            <TouchableOpacity
                onPress={onSend}
                disabled={!message.trim() || isSending}
                style={{
                    backgroundColor: message.trim() ? colors.primary : colors.border,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Send size={20} color={colors.primaryText} />
            </TouchableOpacity>
        </View>
    );
}
