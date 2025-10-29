import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import AppBackground from "../components/AppBackground";
import EmptyState from "../components/EmptyState";
import UserCard from "../components/UserCard";
import { useTheme } from "../utils/theme";
import { useAuth } from "../utils/auth/useAuth";
import { useUserSearchQuery } from "../utils/queries/users";
import { useFollowStatusQuery } from "../utils/queries/follows";
import { Container, Heading, Caption } from "../components/ui";

export default function SearchUsersScreen() {
  const { isDark, colors, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading } = useUserSearchQuery(
    debouncedSearchTerm,
    user?.id
  );

  const handleUserPress = (userId) => {
    router.push(`/user/${userId}`);
  };

  const renderUserItem = ({ item }) => {
    return <UserCardWithFollowStatus user={item} onPress={() => handleUserPress(item.id)} />;
  };

  const showEmptyState = !isLoading && debouncedSearchTerm.length >= 2 && (!searchResults || searchResults.length === 0);
  const showInitialState = !debouncedSearchTerm || debouncedSearchTerm.length < 2;

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 12,
              width: 48,
              height: 48,
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Heading variant="h2" style={{ flex: 1 }}>
            Find Users
          </Heading>
        </View>

        {/* Search Input */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.inputBackground,
              borderRadius: radius.input,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by username or ID"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                fontSize: 16,
                fontFamily: "Poppins_400Regular",
                color: colors.text,
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <Caption color="secondary" style={{ marginTop: 8, marginLeft: 4 }}>
              Type at least 2 characters to search
            </Caption>
          )}
        </View>

        {/* Results */}
        {showInitialState ? (
          <EmptyState
            Icon="group"
            title="Search for Users"
            description="Enter a username or user ID to find other students and start connecting!"
          />
        ) : isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : showEmptyState ? (
          <EmptyState
            Icon="group"
            title="No Users Found"
            description="Try searching with a different username or check the spelling."
          />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

/**
 * Wrapper component to fetch follow status for each user
 */
function UserCardWithFollowStatus({ user, onPress }) {
  const { user: currentUser } = useAuth();
  const { data: isFollowing } = useFollowStatusQuery(currentUser?.id, user.id);

  return <UserCard user={user} isFollowing={isFollowing} onPress={onPress} />;
}
