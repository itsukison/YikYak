import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/auth/useAuth';
import { useTheme } from '../config/theme';
import SkeletonBox from '../ui/components/SkeletonBox';

export default function WelcomeScreen() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { colors, radius, typography } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (!profile?.onboarding_completed) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, profile, loading]);

  if (loading || user) {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Top Section Skeleton */}
            <View style={styles.topSection}>
              <SkeletonBox width={200} height={40} radius={8} />
            </View>

            {/* Image Section Skeleton */}
            <View style={styles.imageSection}>
              <SkeletonBox width={300} height={300} radius={20} />
            </View>

            {/* Action Section Skeleton */}
            <View style={styles.actionSection}>
              <SkeletonBox width="100%" height={56} radius={50} />
              <SkeletonBox width={150} height={20} radius={4} />
              <SkeletonBox width={250} height={14} radius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Top Section - Quote */}
          <View style={styles.topSection}>
            <Text style={[typography.h1, { fontWeight: '600' }]}>
              Hear it, say it.
            </Text>
          </View>

          {/* Center Section - Image */}
          <View style={styles.imageSection}>
            <Image
              source={require('../../public/welcome.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Section - Actions */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: '#000000',
                  borderRadius: radius.pill,
                }
              ]}
              onPress={() => router.push('/school-selection')}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryButtonText, typography.h3, { color: '#FFFFFF' }]}>
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.secondaryButton}
            >
              <Text style={[styles.secondaryButtonText, { color: '#000000' }]}>
                I have an account
              </Text>
            </TouchableOpacity>

            <Text style={[styles.legalText, { color: colors.textTertiary }]}>
              By proceeding, you agree to our Terms and Privacy Policy.
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  topSection: {
    flex: 0.2, // Reduced from 0.2 to pull quote up
    justifyContent: 'flex-end', // Keeps it close to image, but since section is smaller, it's higher on screen? No, flex-end of 15% is higher than flex-end of 20%.
    alignItems: 'center',
    paddingBottom: 20,
  },
  quote: {
    // fontStyle: 'italic',
    textAlign: 'center',
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'Georgia',
    fontSize: 32, // explicit size for "classic" look
  },
  imageSection: {
    flex: 0.5, // Increased from 0.5 for more image space
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 400, // Increased to allow bigger image
    maxHeight: 400,
  },
  actionSection: {
    flex: 0.28, // Adjusted balance
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 8,
  }
});