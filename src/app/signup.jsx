import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../services/auth/useAuth';
import { useTheme } from '../config/theme';
import { validateEmail } from '../core/schools';
import { Button, Input, Section } from '../ui/components/ui';
import { Heading, Body, Caption } from '../ui/components/ui/Text';
import AppBackground from '../ui/components/AppBackground';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguageStore } from '../services/i18n/languageStore';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, language, changeLanguage } = useLanguageStore();

  const school = params.schoolId ? {
    id: params.schoolId,
    name: params.schoolName,
    domain: params.schoolDomain === 'null' ? null : params.schoolDomain,
    displayName: params.schoolDisplayName,
    isGuest: params.schoolId === 'guest',
  } : null;

  React.useEffect(() => {
    if (!school) {
      router.replace('/school-selection');
    }
  }, [school]);

  const validateSchoolEmail = () => {
    if (!school) return false;

    if (school.isGuest) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError(t('auth_error_invalid_email'));
        return false;
      }
      setEmailError('');
      return true;
    }

    const result = validateEmail(email, school.domain);
    if (!result.valid) {
      setEmailError(result.error); // Keep logic error messages or translate them later
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailBlur = () => {
    if (email) {
      validateSchoolEmail();
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError(t('auth_error_fill_fields'));
      return;
    }

    if (!validateSchoolEmail()) {
      setError(t('auth_error_invalid_email'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth_error_password_length'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth_error_password_match'));
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: signUpError } = await signUp(email, password, {
      data: {
        school_name: school.name,
        school_id: school.id
      },
      emailConfirmation: !school.isGuest
    });

    if (signUpError) {
      setError(signUpError.message || t('error'));
      setLoading(false);
    } else {
      setLoading(false);
      router.replace('/onboarding');
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

          {/* Return Button */}
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={{
              position: 'absolute',
              top: insets.top + spacing.md,
              left: spacing.lg,
              zIndex: 10,
              padding: spacing.xs,
            }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Language Toggle */}
          <TouchableOpacity
            onPress={() => {
              changeLanguage(language === 'en' ? 'ja' : 'en');
            }}
            style={{
              position: 'absolute',
              top: insets.top + spacing.md,
              right: spacing.lg,
              zIndex: 10,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Body variant="bodySmall" weight="medium" style={{ fontSize: 13 }}>
              {language === 'en' ? 'English' : '日本語'}
            </Body>
          </TouchableOpacity>

          {/* Header */}
          <Section spacing="large">
            <Heading variant="h1" style={{ textAlign: 'center', marginBottom: spacing.md }}>
              {t('auth_join_hearsay')}
            </Heading>
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              {school ? school.displayName : t('auth_create_account')}
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              placeholder={
                school?.isGuest
                  ? `${t('auth_email_placeholder')} (any email address)`
                  : school
                    ? `${t('auth_email_placeholder')} (e.g., you@${school.domain})`
                    : t('auth_school_email_placeholder')
              }
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              onBlur={handleEmailBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={emailError}
            />

            <Input
              placeholder={t('auth_password_min_placeholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />

            <Input
              placeholder={t('auth_confirm_password_placeholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
              error={error}
            />

            <Button
              variant="primary"
              fullWidth
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
            >
              {t('auth_create_account_button')}
            </Button>

            <Caption color={colors.textTertiary} style={{ textAlign: 'center', marginTop: spacing.md }}>
              {t('auth_terms_agreement')}{' '}
              <Caption
                color={colors.primary}
                style={{ textDecorationLine: 'underline' }}
                onPress={() => WebBrowser.openBrowserAsync('https://www.hearsay.ink/terms')}
              >
                {t('auth_terms')}
              </Caption>
              {' '}{t('auth_and')}{' '}
              <Caption
                color={colors.primary}
                style={{ textDecorationLine: 'underline' }}
                onPress={() => WebBrowser.openBrowserAsync('https://www.hearsay.ink/privacy')}
              >
                {t('auth_privacy')}
              </Caption>
            </Caption>
          </Section>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
            <Body color={colors.textSecondary}>
              {t('auth_already_have_account')}{' '}
            </Body>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Body variant="bodyMedium" color={colors.primary}>
                {t('auth_sign_in_link')}
              </Body>
            </TouchableOpacity>
          </View>

          {/* Wrong School Link */}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Caption color={colors.textTertiary}>
                {t('auth_wrong_school')}
              </Caption>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
