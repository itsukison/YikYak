import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react-native";
import Constants from "expo-constants";

import { useTheme } from "../config/theme";
import { useAuth } from "../services/auth/useAuth";
import { useLanguageStore } from "../services/i18n/languageStore";
import { supabase } from "../adapters/supabaseClient";
import AppBackground from "../ui/components/AppBackground";
import { Heading, Body, Caption } from "../ui/components/ui";

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();
  const { t } = useLanguageStore();
  const { user } = useAuth();

  const [expandedFaq, setExpandedFaq] = useState(null);

  // FAQ items
  const faqItems = [
    {
      id: "anonymous",
      question: t("help.faq_anonymous_q"),
      answer: t("help.faq_anonymous_a"),
    },
    {
      id: "radius",
      question: t("help.faq_radius_q"),
      answer: t("help.faq_radius_a"),
    },
    {
      id: "block",
      question: t("help.faq_block_q"),
      answer: t("help.faq_block_a"),
    },
    {
      id: "report",
      question: t("help.faq_report_q"),
      answer: t("help.faq_report_a"),
    },
    {
      id: "privacy",
      question: t("help.faq_privacy_q"),
      answer: t("help.faq_privacy_a"),
    },
  ];

  // Handler: Open external link
  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t("common.error"), "Could not open link");
    });
  };

  // FAQ Item Component
  const FAQItem = ({ item }) => {
    const isExpanded = expandedFaq === item.id;

    return (
      <TouchableOpacity
        onPress={() => setExpandedFaq(isExpanded ? null : item.id)}
        activeOpacity={0.7}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 4,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Body weight="semibold">{item.question}</Body>
          </View>
          <ChevronDown
            size={20}
            color={colors.textSecondary}
            style={{
              transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
            }}
          />
        </View>

        {isExpanded && (
          <Caption color="secondary" style={{ marginTop: 12, lineHeight: 20 }}>
            {item.answer}
          </Caption>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Heading variant="h2" weight="semibold">
            {t("help.title")}
          </Heading>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View style={{ marginTop: 24, marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("help.faq_title")}
          </Heading>

          <View>
            {faqItems.map((item) => (
              <FAQItem key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Community Guidelines Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("help.guidelines_title")}
          </Heading>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Body color="secondary" style={{ lineHeight: 24 }}>
              {t("help.guidelines_text")}
            </Body>
          </View>
        </View>

        {/* Contact Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {t("help.contact_title")}
          </Heading>

          <TouchableOpacity
            onPress={() => router.push('/contact')}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 16,
              paddingHorizontal: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View style={{ flex: 1 }}>
              <Body weight="semibold" style={{ marginBottom: 2 }}>
                Contact Us
              </Body>
              <Caption color="secondary">
                Send us your feedback or questions
              </Caption>
            </View>
            <ExternalLink size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Legal & Info Section */}
        <View style={{ marginBottom: 32 }}>
          <Heading variant="h3" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            Legal & Information
          </Heading>

          <View>
            <TouchableOpacity
              onPress={() => openLink("https://www.hearsay.ink/terms")}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                paddingHorizontal: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderLight,
              }}
            >
              <Body weight="semibold">{t("help.terms_of_service")}</Body>
              <ExternalLink size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openLink("https://www.hearsay.ink/privacy")}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                paddingHorizontal: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderLight,
              }}
            >
              <Body weight="semibold">{t("help.privacy_policy")}</Body>
              <ExternalLink size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* App Version */}
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 4,
              }}
            >
              <Caption color="secondary">
                {t("help.app_version")}: {Constants.expoConfig?.version || "1.0.0"} (
                {Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || "1"})
              </Caption>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppBackground>
  );
}
