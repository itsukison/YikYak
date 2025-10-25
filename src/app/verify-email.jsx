import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import { supabase } from '../utils/supabase';

export default function VerifyEmailScreen() {
  const [resending, setResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const email = params.email || '';

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleResendEmail = async () => {
    if (cooldownTime > 0 || !email) return;

    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'HearSay://auth/callback'
        }
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to resend email');
      } else {
        Alert.alert('Success', 'Verification email sent! Please check your inbox.');
        setCooldownTime(60); // 60 seconds cooldown
        setResendCount(resendCount + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    // Go back to signup with option to change email
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFF9F3' }]}>
      <View style={styles.content}>
        {/* Email Icon */}
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2D2D2D' : '#FFCC00' }]}>
          <Text style={styles.icon}>📧</Text>
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
          Check Your Email
        </Text>
        
        <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
          We've sent a verification link to:
        </Text>

        {/* Email Display */}
        <View style={[styles.emailContainer, { backgroundColor: isDark ? '#2D2D2D' : '#F2F2F7' }]}>
          <Text style={[styles.email, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
            {email}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructions, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            1. Open the email from HearSay Japan
          </Text>
          <Text style={[styles.instructions, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            2. Click the verification link
          </Text>
          <Text style={[styles.instructions, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
            3. You'll be redirected back to the app
          </Text>
        </View>

        {/* Resend Email Button */}
        <TouchableOpacity
          style={[
            styles.resendButton,
            { 
              backgroundColor: (cooldownTime > 0 || resending) ? 
                (isDark ? '#2D2D2D' : '#E5E5EA') : 
                (isDark ? '#FF6B47' : '#FFCC00')
            }
          ]}
          onPress={handleResendEmail}
          disabled={cooldownTime > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator color={isDark ? '#FFFFFF' : '#1C1C1E'} />
          ) : (
            <Text style={[
              styles.resendButtonText,
              { 
                color: (cooldownTime > 0) ? 
                  (isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2') : 
                  '#FFFFFF'
              }
            ]}>
              {cooldownTime > 0 ? 
                `Resend Email (${cooldownTime}s)` : 
                resendCount > 0 ? 'Resend Email Again' : 'Resend Email'
              }
            </Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
            Didn't receive the email?
          </Text>
          <Text style={[styles.helpSubtext, { color: isDark ? 'rgba(255,255,255,0.4)' : '#C7C7CC' }]}>
            Check your spam folder or click the resend button above
          </Text>
        </View>

        {/* Wrong Email Link */}
        <TouchableOpacity 
          style={styles.changeEmailButton}
          onPress={handleChangeEmail}
        >
          <Text style={[styles.changeEmailText, { color: isDark ? '#FF6B47' : '#E75424' }]}>
            Wrong email? Go back
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  resendButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
  helpSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  changeEmailButton: {
    padding: 12,
  },
  changeEmailText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

