import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Settings,
  HelpCircle,
  LogOut,
  User,
  UserX,
  MapPin,
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
import { Container, Section, Heading, Body, Caption, Card, Avatar, Modal } from "../../ui/components/ui";
import { useLanguageStore } from "../../services/i18n/languageStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { user, profile, signOut, updateProfile, updateLocationRadius } = useAuth();
  const { pickImage, uploadAvatar, removeAvatar, uploading: avatarUploading } = useAvatar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t, setLanguage } = useLanguageStore();
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(profile?.is_anonymous || false);
  const [locationRadius, setLocationRadius] = useState(
    profile?.location_radius ? profile.location_radius / 1000 : 5
  );
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    actions: [],
  });
  const [pendingAction, setPendingAction] = useState(null);

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
  };

  // Sync anonymous state with profile when it loads
  React.useEffect(() => {
    if (profile?.is_anonymous !== undefined) {
      setIsAnonymous(profile.is_anonymous);
    }
  }, [profile?.is_anonymous]);

  // Sync location radius with profile when it loads
  React.useEffect(() => {
    if (profile?.location_radius) {
      setLocationRadius(profile.location_radius / 1000);
    }
  }, [profile?.location_radius]);

  // Execute pending action after modal closes
  React.useEffect(() => {
    if (!modalConfig.visible && pendingAction) {
      const action = pendingAction;
      setPendingAction(null);

      // Small delay to ensure modal animation completes
      setTimeout(async () => {
        try {
          await action();
        } catch (error) {
          console.error("Pending action error:", error);
        }
      }, 100);
    }
  }, [modalConfig.visible, pendingAction]);

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

  const handleAnonymousToggle = async () => {
    const newValue = !isAnonymous;
    setIsAnonymous(newValue);

    // Update in Supabase
    const { error } = await updateProfile({
      is_anonymous: newValue,
    });

    if (error) {
      console.error("Error updating profile:", error);
      setIsAnonymous(!newValue);
      showModal(t('common.error'), t('profile.anonymous_fail'), [
        { text: t('common.ok'), onPress: hideModal }
      ]);
    }
  };

  const handleSettings = () => {
    showModal(t('profile.settings'), t('profile.settings_screen'), [
      { text: t('common.ok'), onPress: hideModal }
    ]);
  };

  const handleHelp = () => {
    showModal(t('profile.help'), t('profile.help_screen'), [
      { text: t('common.ok'), onPress: hideModal }
    ]);
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

  const handleAvatarPress = () => {
    const actions = [
      {
        text: t('profile.photo_upload'),
        style: "default",
        onPress: () => {
          // Set pending action and close modal
          setPendingAction(() => async () => {
            try {
              const image = await pickImage();
              if (image) {
                const url = await uploadAvatar(user.id, image);
                if (url) {
                  await updateProfile({ avatar_url: url });
                  // Invalidate queries to refresh avatar everywhere
                  queryClient.invalidateQueries({ queryKey: ['profile'] });
                }
              }
            } catch (error) {
              console.error("Avatar upload error:", error);
              showModal(
                t('common.error'),
                t('profile.photo_upload_fail'),
                [{ text: t('common.ok'), onPress: hideModal }]
              );
            }
          });
          hideModal();
        }
      }
    ];

    if (currentUser.avatar_url) {
      actions.push({
        text: t('profile.photo_remove'),
        style: "destructive",
        onPress: () => {
          setPendingAction(() => async () => {
            try {
              await removeAvatar(user.id, currentUser.avatar_url);
              await updateProfile({ avatar_url: null });
              queryClient.invalidateQueries({ queryKey: ['profile'] });
            } catch (error) {
              console.error("Avatar remove error:", error);
              showModal(
                t('common.error'),
                t('profile.photo_remove_fail'),
                [{ text: t('common.ok'), onPress: hideModal }]
              );
            }
          });
          hideModal();
        }
      });
    }

    actions.push({ text: t('common.cancel'), style: "cancel", onPress: hideModal });

    showModal(t('profile.photo_title'), t('profile.photo_msg'), actions);
  };

  const handleLocationRadius = () => {
    showModal(
      t('profile.radius_title'),
      t('profile.radius_msg'),
      [
        {
          text: "2km",
          style: "secondary",
          onPress: async () => {
            hideModal();
            setLocationRadius(2);
            const { error } = await updateLocationRadius(2000);
            if (error) {
              setTimeout(() => {
                showModal(t('common.error'), t('profile.radius_fail'), [
                  { text: t('common.ok'), onPress: hideModal }
                ]);
              }, 300);
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        {
          text: "5km",
          style: "secondary",
          onPress: async () => {
            hideModal();
            setLocationRadius(5);
            const { error } = await updateLocationRadius(5000);
            if (error) {
              setTimeout(() => {
                showModal(t('common.error'), t('profile.radius_fail'), [
                  { text: t('common.ok'), onPress: hideModal }
                ]);
              }, 300);
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        {
          text: "10km",
          style: "secondary",
          onPress: async () => {
            hideModal();
            setLocationRadius(10);
            const { error } = await updateLocationRadius(10000);
            if (error) {
              setTimeout(() => {
                showModal(t('common.error'), t('profile.radius_fail'), [
                  { text: t('common.ok'), onPress: hideModal }
                ]);
              }, 300);
              setLocationRadius(profile.location_radius / 1000);
            } else {
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
          }
        },
        { text: t('common.cancel'), onPress: hideModal },
      ],
    );
  };

  const handleLanguage = () => {
    showModal(
      t('profile.language'),
      t('profile.language_sub'),
      [
        {
          text: "English",
          onPress: () => {
            setLanguage('en');
            hideModal();
          }
        },
        {
          text: "日本語",
          onPress: () => {
            setLanguage('ja');
            hideModal();
          }
        },
        {
          text: t('common.cancel'),
          style: "cancel",
          onPress: hideModal
        }
      ]
    );
  };

  const accountMenuItems = [
    {
      icon: isAnonymous ? UserX : User,
      title: t('profile.anonymous_mode'),
      subtitle: isAnonymous
        ? t('profile.anonymous_on')
        : t('profile.anonymous_off'),
      onPress: handleAnonymousToggle,
      showChevron: false,
      rightComponent: (
        <Switch
          value={isAnonymous}
          onValueChange={handleAnonymousToggle}
          trackColor={{
            false: colors.inputBackground,
            true: colors.accent,
          }}
          thumbColor={"#FFFFFF"}
        />
      ),
    },
    {
      icon: MapPin,
      title: t('profile.location_radius'),
      subtitle: t('profile.location_radius_sub', { radius: locationRadius }),
      onPress: handleLocationRadius,
    },
  ];

  const appMenuItems = [
    {
      icon: Settings,
      title: t('profile.settings'),
      subtitle: t('profile.settings_sub'),
      onPress: handleSettings,
    },
    {
      icon: Settings, // Reusing icon or should find a Language icon if available, using Settings for now or maybe MapPin is wrong. Let's import Globe or Languages from lucide-react-native if available, but for now I'll use Settings or just MapPin? No.
      // Wait, I should adding Language item.
      title: t('profile.language'),
      subtitle: t('profile.language_sub'),
      onPress: handleLanguage,
    },
    {
      icon: HelpCircle,
      title: t('profile.help'),
      subtitle: t('profile.help_sub'),
      onPress: handleHelp,
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
                    backgroundColor: colors.primary,
                    borderRadius: radius.pill,
                    padding: 8,
                    borderWidth: 3,
                    borderColor: colors.background,
                  }}
                >
                  <Camera size={20} color={colors.primaryText} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Right Column: Name + Stats */}
            <View style={{ flex: 1, marginLeft: 20, justifyContent: "center" }}>
              {/* User Name */}
              <Body weight="bold" style={{ marginBottom: 8, fontSize: 18 }}>
                {isAnonymous ? t('profile.anonymous_user') : currentUser.nickname}
              </Body>

              {/* Stats Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  paddingRight: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/user/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>{currentUser.post_count}</Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>{t('profile.posts')}</Caption>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/user/following/${user.id}`)}
                  style={{ alignItems: "center" }}
                >
                  <Heading variant="h3" color="primary" style={{ color: colors.text, fontSize: 16 }}>
                    {currentUser.following_count}
                  </Heading>
                  <Caption color="tertiary" weight="medium" style={{ fontSize: 12 }}>{t('profile.following')}</Caption>
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
          <Body variant="small" color="secondary" style={{ textAlign: "left", marginBottom: 16 }}>
            {isAnonymous ? t('profile.hidden_identity') : currentUser.bio}
          </Body>
        </View>

        {/* Account Settings */}
        <Section spacing="lg">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t('profile.account_settings')}
          </Heading>

          <View style={{ marginBottom: 20 }}>
            {accountMenuItems.map((item, index) => (
              <View key={index}>
                <TouchableOpacity
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

                  {/* Right Component */}
                  {item.rightComponent ? (
                    item.rightComponent
                  ) : item.showChevron !== false ? (
                    <ChevronRight size={24} color={colors.textTertiary} />
                  ) : null}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Section>

        {/* App Settings */}
        <Section spacing="lg">
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t('profile.app_settings')}
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
            HearSay Japan v1.0.0
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
