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
import { useTheme } from '../utils/theme';
import { SCHOOLS, GUEST_OPTION } from '../utils/schools';

export default function SchoolSelectionScreen() {
  const router = useRouter();
  const { colors, radius, isDark } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFF9F3' }]}>
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
          
          <Text style={[styles.title, { color: colors.text }]}>
            Select Your School
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.card,
                }
              ]}
              onPress={() => handleSchoolSelect(school)}
              activeOpacity={0.7}
            >
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, { color: colors.text }]}>
                  {school.displayName}
                </Text>
                <Text style={[styles.schoolDescription, { color: colors.textSecondary }]}>
                  {school.description}
                </Text>
                <Text style={[styles.schoolDomain, { color: colors.textTertiary }]}>
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
                backgroundColor: colors.sectionBackground,
                borderColor: colors.border,
                borderStyle: 'dashed',
                borderRadius: radius.card,
              }
            ]}
            onPress={() => handleSchoolSelect(GUEST_OPTION)}
            activeOpacity={0.7}
          >
            <View style={styles.schoolInfo}>
              <Text style={[styles.schoolName, { color: colors.textSecondary }]}>
                {GUEST_OPTION.displayName}
              </Text>
              <Text style={[styles.schoolDescription, { color: colors.textTertiary }]}>
                {GUEST_OPTION.description}
              </Text>
              <Text style={[styles.guestNote, { color: colors.textTertiary }]}>
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
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Don't see your school?
          </Text>
          <Text style={[styles.helpSubtext, { color: colors.textTertiary }]}>
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
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  schoolInfo: {
    flex: 1,
    gap: 4,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  schoolDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  schoolDomain: {
    fontSize: 12,
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
    fontSize: 14,
    textAlign: 'center',
  },
  helpSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});

