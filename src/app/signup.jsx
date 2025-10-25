import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';
import { validateEmail, getSchoolById } from '../utils/schools';

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
  const { colors, isDark } = useTheme();

  // Get school from params or redirect to school selection
  const school = params.schoolId ? {
    id: params.schoolId,
    name: params.schoolName,
    domain: params.schoolDomain === 'null' ? null : params.schoolDomain, // Handle guest (null domain)
    displayName: params.schoolDisplayName,
    isGuest: params.schoolId === 'guest',
  } : null;

  // Redirect to school selection if no school selected
  React.useEffect(() => {
    if (!school) {
      router.replace('/school-selection');
    }
  }, [school]);

  // Validate email domain
  const validateSchoolEmail = () => {
    if (!school) return false;
    
    // Skip validation for guest users
    if (school.isGuest) {
      // Just check basic email format
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

  // Handle email blur to validate domain
  const handleEmailBlur = () => {
    if (email) {
      validateSchoolEmail();
    }
  };

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email domain
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

    // Sign up with school metadata
    const { data, error: signUpError } = await signUp(email, password, {
      data: { 
        school_name: school.name,
        school_id: school.id 
      },
      // Disable email confirmation for guest users
      emailConfirmation: !school.isGuest
    });

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account');
      setLoading(false);
    } else {
      // Navigate to onboarding (email verification disabled for now)
      // When verification is re-enabled, change this back to '/verify-email'
      setLoading(false);
      router.replace('/onboarding');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFF9F3' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
            Join HearSay Japan 🎉
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            {school ? school.displayName : 'Create your account'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                color: isDark ? '#FFFFFF' : '#1C1C1E',
                borderWidth: emailError ? 2 : 0,
                borderColor: emailError ? '#FF6B6B' : 'transparent',
              }
            ]}
            placeholder={
              school?.isGuest 
                ? "Email (any email address)" 
                : school 
                  ? `Email (e.g., you@${school.domain})` 
                  : "School email"
            }
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(''); // Clear error on change
            }}
            onBlur={handleEmailBlur}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {emailError ? (
            <Text style={styles.fieldError}>{emailError}</Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                color: isDark ? '#FFFFFF' : '#1C1C1E'
              }
            ]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                color: isDark ? '#FFFFFF' : '#1C1C1E'
              }
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={[styles.linkText, { color: isDark ? '#FF6B47' : '#E75424' }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wrong School Link */}
        <View style={[styles.footer, { marginTop: 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.linkText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
              ← Wrong school? Go back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    height: 56,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    height: 56,
    backgroundColor: '#FFCC00',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
