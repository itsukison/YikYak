import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  UserX,
  User,
  MapPin,
  Globe,
  Bell,
  MessageSquare,
  Heart,
  UserPlus,
  Lock,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";

import { useTheme } from "../config/theme";
import { useAuth } from "../services/auth/useAuth";
import { useLanguageStore } from "../services/i18n/languageStore";
import { useBlockedUsersQuery, useUnblockUserMutation } from "../services/user/useUserActions";
import { useNotificationPreferences } from "../services/notifications/useNotificationPreferences";
import { useAccountDeletion } from "../services/auth/useAccountDeletion";
import { checkPushPermissions, openAppSettings } from "../services/notifications/usePushNotifications";
import { getRadiusLabel } from "../services/location/locationRadius";
import AppBackground from "../ui/components/AppBackground";
import { Heading, Body, Caption, Avatar } from "../ui/components/ui";
import LanguageModal from "../ui/components/LanguageModal";
import LocationRadiusModal from "../ui/components/LocationRadiusModal";
import SkeletonBox from "../ui/components/SkeletonBox";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguageStore();
  const { user, profile, updateProfile } = useAuth();
  const { deleteAccount, deleting } = useAccountDeletion();

  // Notification preferences
  const { preferences, loading: prefsLoading, toggleType, toggleEnabled } = useNotificationPreferences();
  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);

  // Modals state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Blocked users
  const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsersQuery(user?.id);
  const unblockMutation = useUnblockUserMutation();

  const isAnonymous = profile?.is_anonymous || false;
  const currentLanguage = useLanguageStore((state) => state.language);

  // Check push permissions on mount
  useEffect(() => {
    checkPushPermissions().then(setPushPermissionGranted);
  }, []);

  // Handler: Toggle anonymous mode
  const handleAnonymousToggle = async () => {
    try {
      await updateProfile({ is_anonymous: !isAnonymous });
    } catch (error) {
      Alert.alert(t("common.error"), t("profile.anonymous_fail"));
    }
  };

  // Handler: Location radius
  const handleLocationRadius = () => {
    setShowLocationModal(true);
  };

  const handleRadiusChange = async (radiusValue) => {
    try {
      await updateProfile({ location_radius: radiusValue });
    } catch (error) {
      Alert.alert(t("common.error"), t("profile.radius_fail"));
    }
  };

  // Handler: Language
  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = (languageCode) => {
    useLanguageStore.getState().setLanguage(languageCode);
  };

  // Handler: Push notification master toggle
  const handlePushToggle = async () => {
    if (!pushPermissionGranted) {
      // Guide user to settings
      Alert.alert(
        t("settings.push_disabled"),
        t("settings.push_disabled_msg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("settings.open_settings"), onPress: openAppSettings },
        ]
      );
      return;
    }
    await toggleEnabled();
  };

  // Handler: Unblock user
  const handleUnblock = (blockedUser) => {
    Alert.alert(
      t("settings.unblock_confirm_title"),
      t("settings.unblock_confirm_msg").replace("{username}", blockedUser.username),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.unblock"),
          style: "destructive",
          onPress: () => unblockMutation.mutate(blockedUser.id),
        },
      ]
    );
  };

  // Handler: Delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.delete_confirm_title"),
      t("settings.delete_confirm_msg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (deleteConfirmText.toUpperCase() !== "DELETE") {
      Alert.alert(t("common.error"), t("settings.type_delete"));
      return;
    }

    try {
      await deleteAccount();
      Alert.alert(t("common.ok"), t("settings.delete_success"));
    } catch (error) {
      Alert.alert(t("common.error"), t("settings.delete_failed"));
    }
  };

  // Menu item renderer
  const MenuItem = ({ icon: Icon, title, subtitle, onPress, rightComponent, showChevron = true, destructive = false }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
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
      <View
        pointerEvents="none"
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceElevated,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
        }}
      >
        <Icon size={22} color={destructive ? colors.error : colors.textSecondary} />
      </View>

      {/* Text Content */}
      <View pointerEvents="none" style={{ flex: 1 }}>
        <Body weight="bold" style={{ marginBottom: 2, color: destructive ? colors.error : colors.text }}>
          {title}
        </Body>
        {subtitle && <Caption color="secondary">{subtitle}</Caption>}
      </View>

      {/* Right Component */}
      {rightComponent || (showChevron && <ChevronRight size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Heading variant="h2" weight="semibold">
            {t("settings.title")}
          </Heading>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={{ marginTop: 24, marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("settings.account_section")}
          </Heading>

          <View>
            <MenuItem
              icon={isAnonymous ? UserX : User}
              title={t("profile.anonymous_mode")}
              subtitle={isAnonymous ? t("profile.anonymous_on") : t("profile.anonymous_off")}
              onPress={handleAnonymousToggle}
              showChevron={false}
              rightComponent={
                <Switch
                  value={isAnonymous}
                  onValueChange={handleAnonymousToggle}
                  trackColor={{
                    false: colors.inputBackground,
                    true: colors.accent,
                  }}
                  thumbColor={"#FFFFFF"}
                />
              }
            />

            <MenuItem
              icon={MapPin}
              title={t("profile.location_radius")}
              subtitle={getRadiusLabel(profile?.location_radius || 5000, t, "subtitle")}
              onPress={handleLocationRadius}
            />

            <MenuItem
              icon={Globe}
              title={t("profile.language")}
              subtitle={currentLanguage === "en" ? "English" : "日本語"}
              onPress={handleLanguageChange}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("settings.notifications_section")}
          </Heading>

          <View>
            <MenuItem
              icon={Bell}
              title={t("settings.push_notifications")}
              subtitle={t("settings.push_notifications_sub")}
              onPress={handlePushToggle}
              showChevron={false}
              rightComponent={
                <Switch
                  value={preferences.enabled && pushPermissionGranted}
                  onValueChange={handlePushToggle}
                  trackColor={{
                    false: colors.inputBackground,
                    true: colors.accent,
                  }}
                  thumbColor={"#FFFFFF"}
                />
              }
            />

            {preferences.enabled && pushPermissionGranted && (
              <>
                <MenuItem
                  icon={Heart}
                  title={t("settings.notify_votes")}
                  subtitle=""
                  onPress={() => toggleType("votes")}
                  showChevron={false}
                  rightComponent={
                    <Switch
                      value={preferences.types.votes}
                      onValueChange={() => toggleType("votes")}
                      trackColor={{
                        false: colors.inputBackground,
                        true: colors.accent,
                      }}
                      thumbColor={"#FFFFFF"}
                    />
                  }
                />

                <MenuItem
                  icon={MessageSquare}
                  title={t("settings.notify_comments")}
                  subtitle=""
                  onPress={() => toggleType("comments")}
                  showChevron={false}
                  rightComponent={
                    <Switch
                      value={preferences.types.comments}
                      onValueChange={() => toggleType("comments")}
                      trackColor={{
                        false: colors.inputBackground,
                        true: colors.accent,
                      }}
                      thumbColor={"#FFFFFF"}
                    />
                  }
                />

                <MenuItem
                  icon={UserPlus}
                  title={t("settings.notify_follows")}
                  subtitle=""
                  onPress={() => toggleType("follows")}
                  showChevron={false}
                  rightComponent={
                    <Switch
                      value={preferences.types.follows}
                      onValueChange={() => toggleType("follows")}
                      trackColor={{
                        false: colors.inputBackground,
                        true: colors.accent,
                      }}
                      thumbColor={"#FFFFFF"}
                    />
                  }
                />

                <MenuItem
                  icon={MessageSquare}
                  title={t("settings.notify_messages")}
                  subtitle=""
                  onPress={() => toggleType("messages")}
                  showChevron={false}
                  rightComponent={
                    <Switch
                      value={preferences.types.messages}
                      onValueChange={() => toggleType("messages")}
                      trackColor={{
                        false: colors.inputBackground,
                        true: colors.accent,
                      }}
                      thumbColor={"#FFFFFF"}
                    />
                  }
                />
              </>
            )}
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("settings.privacy_section")}
          </Heading>

          <View>
            <MenuItem
              icon={UserX}
              title={t("settings.blocked_users")}
              subtitle={t("settings.blocked_users_sub")}
              onPress={() => setShowBlockedUsers(!showBlockedUsers)}
              showChevron={false}
              rightComponent={
                <Caption color="secondary" style={{ marginRight: 8 }}>
                  {blockedUsers.length}
                </Caption>
              }
            />

            {/* Blocked Users List (Expandable) */}
            {showBlockedUsers && (
              <View style={{ paddingLeft: 60, marginTop: 8, marginBottom: 8 }}>
                {blockedLoading && (
                  <View>
                    {[1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          borderBottomWidth: 0.5,
                          borderBottomColor: colors.borderLight,
                        }}
                      >
                        <SkeletonBox width={32} height={32} radius={16} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                          <SkeletonBox width={100} height={14} radius={radius.small} style={{ marginBottom: 4 }} />
                          <SkeletonBox width={60} height={12} radius={radius.small} />
                        </View>
                        <SkeletonBox width={70} height={28} radius={radius.button} />
                      </View>
                    ))}
                  </View>
                )}

                {!blockedLoading && blockedUsers.length === 0 && (
                  <Caption color="secondary" style={{ paddingVertical: 12 }}>
                    {t("settings.no_blocked_users")}
                  </Caption>
                )}

                {!blockedLoading && blockedUsers.map((blockedUser) => (
                  <View
                    key={blockedUser.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.borderLight,
                    }}
                  >
                    <Avatar
                      size="small"
                      name={blockedUser.nickname}
                      source={blockedUser.avatar_url ? { uri: blockedUser.avatar_url } : null}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Body weight="semibold" style={{ fontSize: 14 }}>
                        {blockedUser.nickname}
                      </Body>
                      <Caption color="secondary">@{blockedUser.username}</Caption>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(blockedUser)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: radius.button,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Caption color="secondary">{t("settings.unblock")}</Caption>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Account Management Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("settings.account_management_section")}
          </Heading>

          <View>
            <MenuItem
              icon={Trash2}
              title={t("settings.delete_account")}
              subtitle={t("settings.delete_account_sub")}
              onPress={handleDeleteAccount}
              destructive={true}
              showChevron={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Heading variant="h3" style={{ marginBottom: 12 }}>
              {t("settings.delete_confirm_title")}
            </Heading>
            <Body color="secondary" style={{ marginBottom: 20 }}>
              {t("settings.delete_confirm_msg")}
            </Body>

            <Caption color="secondary" style={{ marginBottom: 8 }}>
              {t("settings.type_delete")}
            </Caption>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder={t("settings.delete_placeholder")}
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: radius.input,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.text,
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: radius.button,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Body weight="semibold">{t("common.cancel")}</Body>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: radius.button,
                  backgroundColor: colors.error,
                  alignItems: "center",
                }}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Body weight="semibold" style={{ color: "#FFFFFF" }}>
                    Delete
                  </Body>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Language Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageSelect}
      />

      {/* Location Radius Modal */}
      <LocationRadiusModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentRadius={profile?.location_radius || 5000}
        onRadiusChange={handleRadiusChange}
      />
    </AppBackground>
  );
}
