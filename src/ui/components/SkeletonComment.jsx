import React from "react";
import { View } from "react-native";
import { useTheme } from "../../config/theme";
import SkeletonBox from "./SkeletonBox";

export default function SkeletonComment({ index = 0 }) {
  const { colors, radius, spacing } = useTheme();

  // Stagger animation delay for cascade effect
  const baseDelay = index * 80;

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderLight,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Avatar Skeleton - 32px circle (small size) */}
        <SkeletonBox width={32} height={32} radius={16} delay={baseDelay} />

        <View style={{ flex: 1, marginLeft: 12 }}>
          {/* Header: Author + Time */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <SkeletonBox
              width={100}
              height={14}
              radius={radius.small}
              delay={baseDelay + 50}
            />
            <SkeletonBox
              width={40}
              height={12}
              radius={radius.small}
              delay={baseDelay + 100}
              style={{ marginLeft: 8 }}
            />
          </View>

          {/* Comment Content - 2 lines */}
          <SkeletonBox
            width="95%"
            height={12}
            radius={radius.small}
            delay={baseDelay + 150}
            style={{ marginBottom: 6 }}
          />
          <SkeletonBox
            width="70%"
            height={12}
            radius={radius.small}
            delay={baseDelay + 200}
            style={{ marginBottom: 8 }}
          />

          {/* Actions Row (Vote buttons) */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <SkeletonBox
              width={50}
              height={20}
              radius={radius.small}
              delay={baseDelay + 250}
            />
            <SkeletonBox
              width={30}
              height={20}
              radius={radius.small}
              delay={baseDelay + 300}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
