import { useEffect } from "react";
import { supabase } from "../supabase";
import { useAuthStore } from "./store";

export function useAuth() {
  // Use Zustand store instead of local state
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const resetAuth = useAuthStore((state) => state.resetAuth);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch user profile if session exists
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // If profile doesn't exist, user might need to complete onboarding
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, options = {}) => {
    try {
      // Build signup options
      const signUpOptions = {
        data: options.data || {}, // Pass school metadata
      };

      // Only add emailRedirectTo and require email confirmation if not a guest
      if (options.emailConfirmation !== false) {
        signUpOptions.emailRedirectTo =
          options.emailRedirectTo || "HearSay://auth/callback";
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      resetAuth();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      console.log("useAuth: Updating profile", updates);
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      console.log("useAuth: Profile updated successfully", data);
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("useAuth: Profile update failed", error);
      return { data: null, error };
    }
  };

  const updateLocationRadius = async (radiusMeters) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { data, error } = await supabase
        .from("users")
        .update({ location_radius: radiusMeters })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating location radius:", error);
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateLocationRadius,
    fetchProfile,
    setProfile, // Expose for optimistic updates
  };
}
