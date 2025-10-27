import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';
import { Button, Input, Container, Section } from '../components/ui';
import { Heading, Body } from '../components/ui/Text';
import AppBackground from '../components/AppBackground';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in');
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
            paddingVertical: spacing["5xl"],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Section spacing="large">
            <Heading variant="h1" style={{ textAlign: 'center', marginBottom: spacing.md }}>
              Welcome Back
            </Heading>
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              Sign in to continue
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Input
              placeholder="Password"
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
              Sign In
            </Button>
          </Section>

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Body color={colors.textSecondary}>
              Don't have an account?{' '}
            </Body>
            <TouchableOpacity onPress={() => router.push('/school-selection')}>
              <Body variant="bodyMedium" color={colors.primary}>
                Sign Up
              </Body>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
