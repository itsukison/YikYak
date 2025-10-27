import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";

/**
 * Helper to check if a string is a valid UUID
 */
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Search users by username or user ID
 * - Username: partial match, case-insensitive (min 2 chars)
 * - User ID: exact UUID match
 */
export function useUserSearchQuery(searchTerm, currentUserId) {
  return useQuery({
    queryKey: ["user-search", searchTerm, currentUserId],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const trimmedTerm = searchTerm.trim();

      // Search by exact user ID if it's a UUID
      if (isUUID(trimmedTerm)) {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, nickname, bio, is_anonymous, school_name")
          .eq("id", trimmedTerm)
          .neq("id", currentUserId)
          .single();

        if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
        return data ? [data] : [];
      }

      // Search by username (partial match, case-insensitive)
      const { data, error } = await supabase
        .from("users")
        .select("id, username, nickname, bio, is_anonymous, school_name")
        .ilike("username", `%${trimmedTerm}%`)
        .neq("id", currentUserId)
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!searchTerm && searchTerm.trim().length >= 2 && !!currentUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Get a single user by ID
 */
export function useUserByIdQuery(userId) {
  return useQuery({
    queryKey: ["user-by-id", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("users")
        .select("id, username, nickname, bio, is_anonymous, school_name")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
