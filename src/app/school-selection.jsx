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
  const { colors, isDark } = useTheme();

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
            <Text style={[styles.backText, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
            Select Your School 🎓
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>
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
                  backgroundColor: isDark ? '#2D2D2D' : '#FFFFFF',
                  borderColor: isDark ? '#3D3D3D' : '#E5E5EA',
                }
              ]}
              onPress={() => handleSchoolSelect(school)}
              activeOpacity={0.7}
            >
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                  {school.displayName}
                </Text>
                <Text style={[styles.schoolDescription, { color: isDark ? 'rgba(255,255,255,0.6)' : '#8E8E93' }]}>
                  {school.description}
                </Text>
                <Text style={[styles.schoolDomain, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
                  @{school.domain}
                </Text>
              </View>
              <Text style={[styles.arrow, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
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
                backgroundColor: isDark ? '#1C1C1C' : '#F9F9F9',
                borderColor: isDark ? '#444444' : '#D1D1D6',
                borderStyle: 'dashed',
              }
            ]}
            onPress={() => handleSchoolSelect(GUEST_OPTION)}
            activeOpacity={0.7}
          >
            <View style={styles.schoolInfo}>
              <Text style={[styles.schoolName, { color: isDark ? 'rgba(255,255,255,0.8)' : '#5C5C5C' }]}>
                👤 {GUEST_OPTION.displayName}
              </Text>
              <Text style={[styles.schoolDescription, { color: isDark ? 'rgba(255,255,255,0.5)' : '#999999' }]}>
                {GUEST_OPTION.description}
              </Text>
              <Text style={[styles.guestNote, { color: isDark ? 'rgba(255,255,255,0.4)' : '#B0B0B0' }]}>
                For testing • No school email required
              </Text>
            </View>
            <Text style={[styles.arrow, { color: isDark ? 'rgba(255,255,255,0.6)' : '#999999' }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#AEAEB2' }]}>
            Don't see your school?
          </Text>
          <Text style={[styles.helpSubtext, { color: isDark ? 'rgba(255,255,255,0.4)' : '#C7C7CC' }]}>
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
    fontWeight: '600',
    marginBottom: 8,
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
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

