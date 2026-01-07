import React from "react";
import { View } from "react-native";
import { useTheme } from "../../config/theme";
import SkeletonBox from "./SkeletonBox";

export default function SkeletonChat({ index = 0 }) {
    const { colors, radius } = useTheme();

    // Stagger animation delay
    const baseDelay = index * 100;

    return (
        <View
            style={{
                backgroundColor: "transparent",
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderLight,
            }}
        >
            {/* Avatar Skeleton */}
            <SkeletonBox
                width={48}
                height={48}
                radius={24}
                delay={baseDelay}
                style={{ marginRight: 12 }}
            />

            {/* Chat Info */}
            <View style={{ flex: 1 }}>
                {/* Name and Time Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <SkeletonBox
                        width={120}
                        height={16}
                        radius={radius.small}
                        delay={baseDelay + 50}
                    />
                    <SkeletonBox
                        width={40}
                        height={12}
                        radius={radius.small}
                        delay={baseDelay + 100}
                    />
                </View>

                {/* Message Preview */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <SkeletonBox
                        width="80%"
                        height={14}
                        radius={radius.small}
                        delay={baseDelay + 150}
                    />
                </View>
            </View>
        </View>
    );
}
