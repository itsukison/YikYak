import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../services/auth/useAuth';
import { useTheme } from '../config/theme';
import { Button, Input, Container, Section } from '../ui/components/ui';
import { Heading, Body, Caption } from '../ui/components/ui/Text';
import AppBackground from '../ui/components/AppBackground';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguageStore } from '../services/i18n/languageStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, language, changeLanguage } = useLanguageStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth_error_fill_fields'));
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || t('error'));
      setLoading(false);
    } else {
      setLoading(false);
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
            paddingVertical: spacing["7xl"],
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
              {t('auth_welcome_back')}
            </Heading>
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              {t('auth_sign_in_subtitle')}
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              placeholder={t('auth_email_placeholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Input
              placeholder={t('auth_password_placeholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={error}
            />

            <Button
              variant="primary"
              fullWidth
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            >
              {t('auth_sign_in_button')}
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

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Body color={colors.textSecondary}>
              {t('auth_no_account')}{' '}
            </Body>
            <TouchableOpacity onPress={() => router.push('/school-selection')}>
              <Body variant="bodyMedium" color={colors.primary}>
                {t('auth_sign_up_link')}
              </Body>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
