import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';
import { validateEmail } from '../utils/schools';
import { Button, Input, Section } from '../components/ui';
import { Heading, Body, Caption } from '../components/ui/Text';
import AppBackground from '../components/AppBackground';

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
        setEmailError('Invalid email format');
        return false;
      }
      setEmailError('');
      return true;
    }
    
    const result = validateEmail(email, school.domain);
    if (!result.valid) {
      setEmailError(result.error);
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
      setError('Please fill in all fields');
      return;
    }

    if (!validateSchoolEmail()) {
      setError('Please use a valid school email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
      setError(signUpError.message || 'Failed to create account');
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
          {/* Header */}
          <Section spacing="large">
            <Heading variant="h1" style={{ textAlign: 'center', marginBottom: spacing.md }}>
              Join HearSay Japan
            </Heading>
            <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
              {school ? school.displayName : 'Create your account'}
            </Body>
          </Section>

          {/* Form */}
          <Section spacing="default">
            <Input
              placeholder={
                school?.isGuest 
                  ? "Email (any email address)" 
                  : school 
                    ? `Email (e.g., you@${school.domain})` 
                    : "School email"
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
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />

            <Input
              placeholder="Confirm Password"
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
              Create Account
            </Button>

            <Caption color={colors.textTertiary} style={{ textAlign: 'center', marginTop: spacing.md }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Caption>
          </Section>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
            <Body color={colors.textSecondary}>
              Already have an account?{' '}
            </Body>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Body variant="bodyMedium" color={colors.primary}>
                Sign In
              </Body>
            </TouchableOpacity>
          </View>

          {/* Wrong School Link */}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Caption color={colors.textTertiary}>
                ← Wrong school? Go back
              </Caption>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
