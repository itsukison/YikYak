import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../config/theme';
import { SCHOOLS, GUEST_OPTION } from '../core/schools';

export default function SchoolSelectionScreen() {
  const router = useRouter();
  const { colors, radius, isDark, typography, shadows, spacing } = useTheme();

  const handleSchoolSelect = (school) => {
    // Navigate to signup with school data
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

          <Text style={[styles.title, typography.h1Small, { color: colors.text }]}>
            Select Your School
          </Text>
          <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>
            Choose your university to continue
          </Text>
        </View>

        {/* School List */}
        <View style={styles.schoolList}>
          {SCHOOLS.map((school) => (
            <TouchableOpacity
              key={school.id}
              style={[
                styles.schoolCard,
                shadows.minimal,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderRadius: radius.card,
                }
              ]}
              onPress={() => handleSchoolSelect(school)}
              activeOpacity={0.7}
            >
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, typography.h3, { color: colors.text }]}>
                  {school.displayName}
                </Text>
                <Text style={[styles.schoolDescription, typography.bodySmall, { color: colors.textSecondary }]}>
                  {school.description}
                </Text>
                <Text style={[styles.schoolDomain, typography.caption, { color: colors.textTertiary }]}>
                  @{school.domain}
                </Text>
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
            <View style={styles.schoolInfo}>
              <Text style={[styles.schoolName, typography.h3, { color: colors.textSecondary }]}>
                {GUEST_OPTION.displayName}
              </Text>
              <Text style={[styles.schoolDescription, typography.bodySmall, { color: colors.textTertiary }]}>
                {GUEST_OPTION.description}
              </Text>
              <Text style={[styles.guestNote, typography.caption, { color: colors.textTertiary }]}>
                For testing • No school email required
              </Text>
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
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 0,
  },
  schoolList: {
    gap: 16,
    marginBottom: 32,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderWidth: 1,
  },
  schoolInfo: {
    flex: 1,
    gap: 4,
  },
  schoolName: {
    marginBottom: 4,
  },
  schoolDescription: {
    marginBottom: 4,
  },
  schoolDomain: {
    fontFamily: 'monospace',
  },
  arrow: {
    fontSize: 24,
    marginLeft: 12,
  },
  guestCard: {
    borderWidth: 2,
  },
  guestNote: {
    fontSize: 11,
    marginTop: 2,
  },
  helpContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    textAlign: 'center',
  },
  helpSubtext: {
    textAlign: 'center',
  },
});

