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
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/auth/useAuth';
import { useTheme } from '../utils/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, isDark } = useTheme();

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
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

    const { data, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account');
      setLoading(false);
    } else {
      // Navigate to onboarding
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
            Join YikYak Japan 🎉
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            Create your account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7',
                color: isDark ? '#FFFFFF' : '#1C1C1E'
              }
            ]}
            placeholder="Email (e.g., you@university.ac.jp)"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

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
