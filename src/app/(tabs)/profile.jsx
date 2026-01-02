import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Upload,
  Trash,
} from "lucide-react-native";
import { useTheme } from "../../config/theme";
import { useAuth } from "../../services/auth/useAuth";
import { useAvatar } from "../../services/user/useAvatar";
import { useProfileStatsQuery } from "../../services/user/useUser";
import { useQueryClient } from "@tanstack/react-query";
import AppBackground from "../../ui/components/AppBackground";
import MenuItem from "../../ui/components/MenuItem";
import { Container, Section, Heading, Body, Caption, Card, Avatar, Modal, Button } from "../../ui/components/ui";
import { useLanguageStore } from "../../services/i18n/languageStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { pickImage, uploadAvatar, removeAvatar, uploading: avatarUploading } = useAvatar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useLanguageStore();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    actions: [],
  });

  const showModal = (title, message, actions = []) => {
    setModalConfig({ visible: true, title, message, actions });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // Fetch real stats from database
  const { data: stats } = useProfileStatsQuery(user?.id);

  // Use real user data from auth
  const currentUser = {
    id: user?.id || "",
    email: user?.email || "",
    nickname: profile?.nickname || t('profile.anonymous_user'),
    bio: profile?.bio || t('profile.no_bio'),
    follower_count: stats?.followerCount || 0,
    following_count: stats?.followingCount || 0,
    post_count: stats?.postCount || 0,
    is_anonymous: profile?.is_anonymous || false,
    avatar_url: profile?.avatar_url || null,
    upvoteCount: stats?.upvoteCount || 0,
  };

  // If no user or profile, show loading (root layout will handle redirect)
  if (!user || !profile) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Body>{t('profile.loading')}</Body>
        </View>
      </AppBackground>
    );
  }

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowHeaderBorder(scrollY > 10);
  };

  const handleSignOut = () => {
    showModal(t('profile.sign_out'), t('profile.sign_out_confirm'), [
      { text: t('common.cancel'), style: "cancel", onPress: hideModal },
      {
        text: t('profile.sign_out'),
        style: "destructive",
        onPress: async () => {
          hideModal();
          await signOut();
          // Global auth listener in _layout.jsx will handle redirection
        },
      },
    ]);
  };

  const handleAvatarPress = async () => {
    try {
      // Direct image picker call (no modal first)
      const image = await pickImage();

      if (image) {
        // Upload the selected image
        const url = await uploadAvatar(user.id, image);
        if (url) {
          await updateProfile({ avatar_url: url });
          // Invalidate all relevant caches
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['comments'] });
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      }
    } catch (error) {
      console.error("Avatar picker error:", error);
      // Handle permission denied or other errors
      if (error.code === 'PERMISSION_DENIED') {
        showModal(
          t('common.error'),
          error.message,
          [{ text: t('common.ok'), onPress: hideModal }]
        );
      } else if (error.message && !error.message.includes('cancelled')) {
        // Show error for actual errors, but not for user cancellations
        showModal(
          t('common.error'),
          t('profile.photo_upload_fail'),
          [{ text: t('common.ok'), onPress: hideModal }]
        );
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar(user.id, currentUser.avatar_url);
      await updateProfile({ avatar_url: null });
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (error) {
      console.error("Avatar remove error:", error);
      showModal(
        t('common.error'),
        t('profile.photo_remove_fail'),
        [{ text: t('common.ok'), onPress: hideModal }]
      );
    }
  };

  const appMenuItems = [
    {
      icon: Settings,
      title: t('profile.settings'),
      subtitle: t('profile.settings_sub'),
      onPress: () => router.push('/settings'),
    },
    {
      icon: HelpCircle,
      title: t('profile.help'),
      subtitle: t('profile.help_sub'),
      onPress: () => router.push('/help'),
    },
    {
      icon: LogOut,
      title: t('profile.sign_out'),
      subtitle: t('profile.sign_out_sub'),
      onPress: handleSignOut,
    },
  ];

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
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
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <Heading variant="h2" weight="semibold" style={{ textAlign: "left", paddingHorizontal: 20 }}>
          {t('profile.title')}
        </Heading>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 80, // Account for fixed header
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View style={{
          marginBottom: 24, // Reduced from 32
          paddingHorizontal: 0,
        }}>
          {/* Top Section: Avatar + Name + Stats */}
          {/* Top Section: Avatar + Name + Stats */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {/* Profile Avatar */}
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <View>
                <Avatar
                  size="xlarge"
                  name={currentUser.nickname}
                  source={currentUser.avatar_url ? { uri: currentUser.avatar_url } : null}
                  style={{ opacity: avatarUploading ? 0.7 : 1 }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.surface,
                    borderRadius: radius.pill,
                    padding: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Camera size={14} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Right Column: Name + Stats */}
            <View style={{ flex: 1, marginLeft: 20, justifyContent: "center" }}>
              {/* User Name */}
              <Body weight="bold" style={{ marginBottom: 8, fontSize: 18 }}>
                {currentUser.is_anonymous ? t('profile.anonymous_user') : currentUser.nickname}
              </Body>

              {/* Stats Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>
                    {currentUser.upvoteCount || 0}
                  </Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>Upvotes</Caption>
                </View>

                <TouchableOpacity
                  onPress={() => router.push(`/user/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>{currentUser.post_count}</Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>{t('profile.posts')}</Caption>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/user/followers/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>
                    {currentUser.follower_count}
                  </Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>{t('profile.followers')}</Caption>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User Email/Bio */}
          <Body variant="small" color="secondary" style={{ textAlign: "left", marginBottom: 8 }}>
            {currentUser.is_anonymous ? t('profile.hidden_identity') : currentUser.bio}
          </Body>

          {/* Edit Profile Button */}
          <Button
            variant="outline"
            size="small"
            onPress={() => router.push('/edit-profile')}
            style={{
              marginBottom: 0,
              alignSelf: 'flex-start',
              paddingHorizontal: 16, // Reduced padding
              paddingVertical: 6,    // Reduced padding
              minHeight: 32,         // Reduced height
            }}
            textStyle={{
              fontSize: 13,
            }}
          >
            Edit Profile
          </Button>
        </View>

        {/* More Section */}
        <Section spacing="lg">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t('profile.more')}
          </Heading>

          <View>
            {appMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
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
                  <item.icon
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>

                {/* Text Content */}
                <View style={{ flex: 1 }}>
                  <Body weight="bold" style={{ marginBottom: 2 }}>
                    {item.title}
                  </Body>
                  <Caption color="secondary">
                    {item.subtitle}
                  </Caption>
                </View>

                <ChevronRight size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* App Version */}
        <View
          style={{
            alignItems: "center",
            marginTop: 48,
            marginBottom: 20,
          }}
        >
          <Caption color="tertiary" style={{ letterSpacing: 0.5 }}>
            Hearsay Japan v1.0.0
          </Caption>
        </View>
      </ScrollView>
      <Modal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        actions={modalConfig.actions}
      />
    </AppBackground>
  );
}
