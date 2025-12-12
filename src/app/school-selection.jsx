import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { useTheme } from '../config/theme';
import { SCHOOLS, GUEST_OPTION } from '../core/schools';

export default function SchoolSelectionScreen() {
  const router = useRouter();
  const { colors, radius, isDark, typography, shadows, spacing } = useTheme();

  const handleSchoolSelect = (school) => {
    router.push({
      pathname: '/signup',
      params: {
        schoolId: school.id,
        schoolName: school.name,
        schoolDomain: school.domain,
        schoolDisplayName: school.displayName,
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: colors.text }]}>
              ← Back
            </Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, typography.h1Small, { color: colors.text }]}>
              Select Your School
            </Text>
            <Text style={[styles.subtitle, typography.caption, { color: colors.textSecondary }]}>
              Choose your university to continue
            </Text>
          </View>
        </View>

        {/* School List */}
        <View style={styles.schoolList}>
          {SCHOOLS.map((school) => (
            <TouchableOpacity
              key={school.id}
              style={[
                styles.schoolCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderRadius: radius.card,
                }
              ]}
              onPress={() => handleSchoolSelect(school)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                {/* Waseda Logo or Placeholder */}
                {school.id === 'waseda' ? (
                  <Image
                    source={require('../../public/waseda.png')}
                    style={styles.schoolLogo}
                    resizeMode="contain"
                  />
                ) : null}

                <View style={styles.schoolInfo}>
                  <Text style={[styles.schoolName, typography.h3, { color: colors.text }]}>
                    {school.displayName.split(' / ')[0]}
                  </Text>
                  <Text style={[styles.schoolSubName, typography.bodySmall, { color: colors.textSecondary }]}>
                    {school.displayName.split(' / ')[1]}
                  </Text>

                  <Text style={[styles.schoolDomain, typography.caption, { color: colors.textTertiary, marginTop: -2 }]}>
                    @{school.domain}
                  </Text>
                </View>
              </View>
              <Text style={[styles.arrow, { color: colors.text }]}>
                →
              </Text>
            </TouchableOpacity>
          ))}

          {/* Guest Option */}
          <TouchableOpacity
            style={[
              styles.schoolCard,
              styles.guestCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderStyle: 'dashed',
                borderRadius: radius.card,
              }
            ]}
            onPress={() => handleSchoolSelect(GUEST_OPTION)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.schoolLogo, { backgroundColor: '#f0f0f0', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }]}>
                <User size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, typography.h3, { color: colors.textSecondary}]}>
                  {GUEST_OPTION.displayName}
                </Text>
                <Text style={[styles.guestNote, typography.caption, { color: colors.textTertiary }]}>
                  No school email required
                </Text>
              </View>
            </View>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, typography.bodySmall, { color: colors.textSecondary }]}>
            Don't see your school?
          </Text>
          <Text style={[styles.helpSubtext, typography.caption, { color: colors.textTertiary }]}>
            More universities coming soon. Check back later!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitleContainer: {
    gap: 4,
  },
  title: {
    marginBottom: 0,
  },
  subtitle: {
    marginBottom: 0,
    opacity: 0.8,
  },
  schoolList: {
    gap: 12,
    marginBottom: 24,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    height: 80,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  schoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  schoolInfo: {
    justifyContent: 'center',
    gap: 2,
    flex: 1,
  },
  schoolName: {
    fontWeight: '600',
  },
  schoolSubName: {
    marginTop: -2,
  },
  schoolDomain: {
    fontFamily: 'monospace',
    opacity: 0.6,
  },
  arrow: {
    fontSize: 20,
    marginLeft: 12,
    opacity: 0.5,
  },
  guestCard: {
    borderWidth: 2,
    opacity: 0.8,
  },
  guestNote: {
    fontSize: 11,
    marginTop: 2,
  },
  helpContainer: {
    marginTop: 8,
    alignItems: 'center',
    gap: 2,
  },
  helpText: {
    textAlign: 'center',
  },
  helpSubtext: {
    textAlign: 'center',
  },
});
