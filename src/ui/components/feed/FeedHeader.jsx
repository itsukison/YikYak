import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../config/theme';
import { useLanguageStore } from '../../../services/i18n/languageStore';
import { getRadiusLabel } from '../../../services/location/locationRadius';
import { Heading, Body, Caption } from '../ui/Text';

/**
 * Feed header component with tabs, filters, and radius display
 */
export default function FeedHeader({
  activeTab,
  setActiveTab,
  timeFilter,
  setTimeFilter,
  location,
  locationError,
  queryError,
  locationRadius,
  isFetchingNextPage,
  isLoading,
}) {
  const insets = useSafeAreaInsets();
  const { colors, radius } = useTheme();
  const { t } = useLanguageStore();

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top + 20,
        paddingBottom: 8,
        paddingHorizontal: 16,
      }}
    >
      {/* Title + Toggle Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        {/* Left: Title */}
        <Heading variant="h2" weight="semibold">{t('home_title')}</Heading>

        {/* Right: New/Popular Toggle */}
        <View
          style={{
            flexDirection: "row",
            padding: 0,
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("new")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor:
                activeTab === "new" ? colors.surface : "transparent",
            }}
          >
            <Body
              variant="small"
              weight={activeTab === "new" ? "bold" : "medium"}
              style={{
                color: activeTab === "new" ? colors.text : colors.textSecondary,
              }}
            >
              {t('home_tab_new')}
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("popular")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor:
                activeTab === "popular" ? colors.surface : "transparent",
            }}
          >
            <Body
              variant="small"
              weight={activeTab === "popular" ? "bold" : "medium"}
              style={{
                color: activeTab === "popular" ? colors.text : colors.textSecondary,
              }}
            >
              {t('home_tab_popular')}
            </Body>
          </TouchableOpacity>

          {/* Loading Indicator - Only show for pagination, not initial load */}
          {isFetchingNextPage && !isLoading && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Subtitle */}
      {location && (
        <View>
          <Caption color="secondary" style={{ marginBottom: 8 }}>
            {getRadiusLabel(locationRadius, t, 'display')}
          </Caption>
        </View>
      )}

      {/* Show location error */}
      {locationError && (
        <View
          style={{
            backgroundColor: colors.errorSubtle || "#FFE5E5",
            borderRadius: 12,
            padding: 8,
            marginBottom: 12,
          }}
        >
          <Caption style={{ color: colors.error || "#D32F2F" }}>
            📍 {locationError}
          </Caption>
        </View>
      )}

      {/* Show query error */}
      {queryError && (
        <View
          style={{
            backgroundColor: colors.errorSubtle || "#FFE5E5",
            borderRadius: 12,
            padding: 8,
            marginBottom: 12,
          }}
        >
          <Caption style={{ color: colors.error || "#D32F2F" }}>
            ⚠️ Failed to load posts: {queryError.message}
          </Caption>
        </View>
      )}

      {/* Time Filter - Center, only when Popular */}
      {activeTab === "popular" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          {["day", "week", "month"].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setTimeFilter(filter)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor:
                  timeFilter === filter
                    ? colors.surface
                    : "transparent",
              }}
            >
              <Caption
                weight={timeFilter === filter ? "bold" : "medium"}
                style={{
                  color: timeFilter === filter ? colors.text : colors.textSecondary,
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Caption>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
