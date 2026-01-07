import React from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../config/theme";
import AppBackground from "./AppBackground";
import SkeletonBox from "./SkeletonBox";

export default function SkeletonProfile() {
    const insets = useSafeAreaInsets();
    const { colors, radius, spacing } = useTheme();

    return (
        <AppBackground>
            {/* Fixed Header Skeleton */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    backgroundColor: colors.background,
                    paddingTop: insets.top + 20,
                    paddingBottom: 16,
                    paddingHorizontal: 20,
                }}
            >
                <SkeletonBox width={100} height={24} radius={radius.medium} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: insets.top + 80,
                    paddingBottom: insets.bottom + 20,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header Section */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        {/* Avatar */}
                        <SkeletonBox width={80} height={80} radius={40} />

                        {/* Right Column: Name + Stats */}
                        <View style={{ flex: 1, marginLeft: 20, justifyContent: "center" }}>
                            {/* Name */}
                            <SkeletonBox width={150} height={20} radius={radius.medium} style={{ marginBottom: 12 }} />

                            {/* Stats Row */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                                {/* Stat 1 */}
                                <View style={{ alignItems: "center" }}>
                                    <SkeletonBox width={30} height={20} radius={radius.small} style={{ marginBottom: 4 }} />
                                    <SkeletonBox width={40} height={12} radius={radius.small} />
                                </View>
                                {/* Stat 2 */}
                                <View style={{ alignItems: "center" }}>
                                    <SkeletonBox width={30} height={20} radius={radius.small} style={{ marginBottom: 4 }} />
                                    <SkeletonBox width={40} height={12} radius={radius.small} />
                                </View>
                                {/* Stat 3 */}
                                <View style={{ alignItems: "center" }}>
                                    <SkeletonBox width={30} height={20} radius={radius.small} style={{ marginBottom: 4 }} />
                                    <SkeletonBox width={40} height={12} radius={radius.small} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Bio Lines */}
                    <SkeletonBox width="90%" height={14} radius={radius.small} style={{ marginBottom: 6 }} />
                    <SkeletonBox width="60%" height={14} radius={radius.small} style={{ marginBottom: 6 }} />

                    {/* Edit Button */}
                    <SkeletonBox width={100} height={32} radius={radius.pill} style={{ marginTop: 8 }} />
                </View>

                {/* More Section Title */}
                <SkeletonBox width={60} height={20} radius={radius.medium} style={{ marginBottom: 16 }} />

                {/* Menu Items */}
                {[...Array(3)].map((_, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 16,
                            paddingHorizontal: 4,
                            borderBottomWidth: 0.5,
                            borderBottomColor: colors.borderLight,
                        }}
                    >
                        {/* Icon */}
                        <SkeletonBox width={44} height={44} radius={radius.pill} style={{ marginRight: 16 }} />

                        {/* Text */}
                        <View style={{ flex: 1 }}>
                            <SkeletonBox width={120} height={16} radius={radius.small} style={{ marginBottom: 6 }} />
                            <SkeletonBox width={180} height={12} radius={radius.small} />
                        </View>

                        {/* Chevron */}
                        <SkeletonBox width={24} height={24} radius={12} />
                    </View>
                ))}
            </ScrollView>
        </AppBackground>
    );
}
