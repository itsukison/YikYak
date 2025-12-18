import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/auth/useAuth';
import { useTheme } from '../config/theme';
import { supabase } from '../adapters/supabaseClient';
import { Button, Input, Card, Section } from '../ui/components/ui';
import { Heading, Body, Caption } from '../ui/components/ui/Text';
import AppBackground from '../ui/components/AppBackground';
import CommunityGuidelinesModal from '../ui/components/CommunityGuidelinesModal';
import { useLanguageStore } from '../services/i18n/languageStore';

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { updateProfile, user, profile, setProfile, fetchProfile } = useAuth();
  const { colors, spacing, radius } = useTheme();

  // Language Store
  const { t, language, setLanguage } = useLanguageStore();

  const validateUsername = (value) => {
    if (!value) return t('onboarding.err_username_required');
    if (value.length < 3) return t('onboarding.err_username_length');
    if (value.length > 20) return t('onboarding.err_username_max');
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return t('onboarding.err_username_chars');
    return null;
  };

  const checkUsernameAvailability = async (value) => {
    if (!value || validateUsername(value)) return false;

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .ilike('username', value)
        .maybeSingle();

      setCheckingUsername(false);

      if (error) {
        setUsernameError(t('onboarding.err_username_check'));
        return false;
      }

      if (data) {
        setUsernameError(t('onboarding.err_username_taken'));
        return false;
      }

      setUsernameError('');
      return true;
    } catch (error) {
      setCheckingUsername(false);
      setUsernameError(t('onboarding.err_username_check'));
      return false;
    }
  };

  const handleComplete = async () => {
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      setError(usernameValidation);
      return;
    }

    if (!nickname.trim()) {
      setError(t('onboarding.err_nickname_required'));
      return;
    }

    if (nickname.length > 20) {
      setError(t('onboarding.err_nickname_max'));
      return;
    }

    if (bio.length > 150) {
      setError(t('onboarding.err_bio_max'));
      return;
    }

    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      setError(t('onboarding.err_username_taken'));
      return;
    }

    setLoading(true);
    setError('');

    const optimisticProfile = {
      ...profile,
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    };

    setProfile(optimisticProfile);

    const { data, error: updateError } = await updateProfile({
      username: username.toLowerCase().trim(),
      nickname: nickname.trim(),
      bio: bio.trim() || null,
      is_anonymous: isAnonymous,
      onboarding_completed: true,
    });

    if (updateError) {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || t('onboarding.err_update_failed'));
      setLoading(false);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = async () => {
    setLoading(true);

    const randomUsername = `user_${Math.random().toString(36).substring(2, 10)}`;

    const optimisticProfile = {
      ...profile,
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    };

    setProfile(optimisticProfile);

    const { error: updateError } = await updateProfile({
      username: randomUsername,
      nickname: 'Anonymous User',
      bio: null,
      is_anonymous: true,
      onboarding_completed: true,
    });

    if (updateError) {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      setError(updateError.message || t('onboarding.err_update_failed'));
      setLoading(false);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing["5xl"],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language Selector */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md, paddingHorizontal: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={{ padding: spacing.xs, marginRight: spacing.sm, borderBottomWidth: language === 'en' ? 2 : 0, borderBottomColor: colors.primary }}
            >
              <Body style={{ fontWeight: language === 'en' ? 'bold' : 'normal', opacity: language === 'en' ? 1 : 0.5 }}>English</Body>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage('ja')}
              style={{ padding: spacing.xs, borderBottomWidth: language === 'ja' ? 2 : 0, borderBottomColor: colors.primary }}
            >
              <Body style={{ fontWeight: language === 'ja' ? 'bold' : 'normal', opacity: language === 'ja' ? 1 : 0.5 }}>日本語</Body>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Section spacing="large">
            <Heading variant="h1" style={{ textAlign: 'center', marginBottom: spacing.md, marginTop: spacing.xl }}>
              {t('onboarding.welcome')}
            </Heading>
            <Body color="secondary" style={{ textAlign: 'center' }}>
              {t('onboarding.subtitle')}
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              label={t('onboarding.username_label')}
              placeholder={t('onboarding.username_placeholder')}
              value={username}
              onChangeText={(value) => {
                const lowercaseValue = value.toLowerCase();
                setUsername(lowercaseValue);
                const error = validateUsername(lowercaseValue);
                setUsernameError(error || '');
              }}
              onBlur={() => checkUsernameAvailability(username)}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              error={usernameError && !checkingUsername ? usernameError : ''}
            />
            {checkingUsername && (
              <Caption color="secondary" style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {t('onboarding.username_checking')}
              </Caption>
            )}
            {!usernameError && !checkingUsername && username && (
              <Caption color="tertiary" style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {t('onboarding.username_helper')}
              </Caption>
            )}

            <View>
              <Input
                label={t('onboarding.nickname_label')}
                placeholder={t('onboarding.nickname_placeholder')}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
              <Caption color="tertiary" style={{ textAlign: 'right', marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {nickname.length}/20
              </Caption>
            </View>

            <View>
              <Input
                label={t('onboarding.bio_label')}
                placeholder={t('onboarding.bio_placeholder')}
                value={bio}
                onChangeText={setBio}
                maxLength={150}
                multiline
              />
              <Caption color="tertiary" style={{ textAlign: 'right', marginTop: -spacing.md, marginBottom: spacing.lg }}>
                {bio.length}/150
              </Caption>
            </View>

            <Card padding="default" style={{ marginBottom: spacing["2xl"] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Body weight="medium" style={{ marginBottom: spacing.xs }}>
                    {t('onboarding.anonymous_mode')}
                  </Body>
                  <Caption color="secondary">
                    {t('onboarding.anonymous_desc')}
                  </Caption>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: colors.border, true: colors.primarySubtle }}
                  thumbColor={isAnonymous ? colors.primary : '#FFFFFF'}
                />
              </View>
            </Card>

            {error ? (
              <Body style={{ textAlign: 'center', marginBottom: spacing.lg, color: colors.error }}>
                {error}
              </Body>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              onPress={handleComplete}
              loading={loading}
              disabled={loading}
            >
              {t('onboarding.get_started')}
            </Button>

            <TouchableOpacity
              style={{ padding: spacing.md, alignItems: 'center' }}
              onPress={handleSkip}
              disabled={loading}
            >
              <Body color="secondary">
                {t('onboarding.skip')}
              </Body>
            </TouchableOpacity>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
      <CommunityGuidelinesModal />
    </AppBackground>
  );
}
