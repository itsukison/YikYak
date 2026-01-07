import React from "react";
import { View } from "react-native";
import { useTheme } from "../../config/theme";
import SkeletonBox from "./SkeletonBox";

export default function SkeletonMessage({ index = 0 }) {
    const { colors, radius, spacing } = useTheme();

    // Stagger animation delay
    const baseDelay = index * 50;

    // Alternate left/right alignment to simulate conversation
    const isOwnMessage = index % 2 !== 0;

    // Randomize widths slightly for realism
    const widths = ["60%", "40%", "75%", "50%", "30%", "65%"];
    const width = widths[index % widths.length];

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                marginBottom: spacing.md,
                paddingHorizontal: 10,
            }}
        >
            <SkeletonBox
                width={width}
                height={40}
                radius={18}
                delay={baseDelay}
                style={{
                    borderBottomRightRadius: isOwnMessage ? 4 : 18,
                    borderBottomLeftRadius: isOwnMessage ? 18 : 4,
                }}
            />
        </View>
    );
}
