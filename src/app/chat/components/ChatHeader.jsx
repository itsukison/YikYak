import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Heading, Caption } from "../../../ui/components/ui";
import { useTheme } from "../../../config/theme";
import { useUserPresence } from "../../../services/presence/usePresence";

export default function ChatHeader({ title, otherUserId }) {
    const { colors } = useTheme();
    const router = useRouter();
    const { online, loading } = useUserPresence(otherUserId);

    return (
        <View
            style={{
                paddingHorizontal: 20,
                paddingTop: 60,
                paddingBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            }}
        >
            <TouchableOpacity
                onPress={() => router.back()}
                style={{
                    marginRight: 12,
                    width: 48,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                }}
            >
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <Heading variant="h2">{title}</Heading>
                {!loading && otherUserId && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: online ? '#4CAF50' : colors.textSecondary,
                                marginRight: 6,
                            }}
                        />
                        <Caption color="secondary" style={{ fontSize: 12 }}>
                            {online ? 'Online' : 'Offline'}
                        </Caption>
                    </View>
                )}
            </View>
        </View>
    );
}
