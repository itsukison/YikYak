import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Heading } from "../../../ui/components/ui";
import { useTheme } from "../../../config/theme";

export default function ChatHeader({ title }) {
    const { colors } = useTheme();
    const router = useRouter();

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
            </View>
        </View>
    );
}
