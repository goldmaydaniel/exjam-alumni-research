/**
 * CONSOLIDATED AUTHENTICATION SYSTEM
 * Single source of truth using Supabase Auth
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Enhanced User interface
interface ConsolidatedUser {
  // Supabase fields
  id: string;
  email: string;

  // Application fields (from user_profiles table)
  firstName: string;
  lastName: string;
  fullName?: string;
  serviceNumber?: string;
  set?: string;
  squadron?: string;
  phone?: string;
  chapter?: string;
  currentLocation?: string;
  graduationYear?: string;
  role?: "ADMIN" | "ORGANIZER" | "MEMBER";

  // Photo fields
  profilePhotoUrl?: string;
  badgePhotoUrl?: string;
}

interface ConsolidatedAuthState {
  // State
  user: ConsolidatedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<ConsolidatedUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = create<ConsolidatedAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      signUp: async (email: string, password: string, metadata?: any) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();

        try {
          // Sign up with Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;

          // Sync user with our database
          if (data.user) {
            const response = await fetch("/api/auth/sync-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                ...metadata,
              }),
            });

            if (!response.ok) {
              console.error("Failed to sync user with database");
            }
          }

          set({
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email || "",
                  firstName: metadata?.firstName || "",
                  lastName: metadata?.lastName || "",
                  ...metadata,
                }
              : null,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to sign up",
            isLoading: false,
          });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Use Supabase Auth only
          const supabase = createClient();

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw new Error(error.message || "Authentication failed");
          }

          // Fetch complete user profile
          let userProfile: ConsolidatedUser = {
            id: data.user.id,
            email: data.user.email || "",
            firstName: "",
            lastName: "",
          };

          if (data.session) {
            try {
              const response = await fetch("/api/auth/profile", {
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                },
              });

              if (response.ok) {
                const profile = await response.json();
                userProfile = {
                  id: data.user.id,
                  email: data.user.email || "",
                  ...profile,
                };
              }
            } catch (profileError) {
              console.warn("Failed to fetch user profile:", profileError);
            }
          }

          set({
            user: userProfile,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to sign in",
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        const supabase = createClient();

        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to sign out",
            isLoading: false,
          });
          throw error;
        }
      },

      refreshSession: async () => {
        const supabase = createClient();

        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            if (error.message !== "Auth session missing!") {
              console.warn("Session refresh failed:", error.message);
            }
            return;
          }

          if (data.session) {
            const currentUser = get().user;
            set({
              user: currentUser,
              session: data.session,
              isAuthenticated: true,
              error: null,
            });
          }
        } catch (error: any) {
          console.warn("Session refresh error:", error.message);
        }
      },

      updateProfile: async (updates: Partial<ConsolidatedUser>) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const { session, user } = get();

        if (!session) {
          set({ error: "Not authenticated", isLoading: false });
          return;
        }

        try {
          // Update Supabase auth metadata
          const { error: authError } = await supabase.auth.updateUser({
            data: updates,
          });

          if (authError) throw authError;

          // Update profile in database
          const response = await fetch("/api/auth/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) throw new Error("Failed to update profile");

          const updatedProfile = await response.json();

          set({
            user: user ? { ...user, ...updatedProfile } : null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to update profile",
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });

          if (error) throw error;
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to send reset email",
            isLoading: false,
          });
          throw error;
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();

        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) throw error;
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to update password",
            isLoading: false,
          });
          throw error;
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        const supabase = createClient();

        try {
          // Get current session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          if (session) {
            // Fetch complete user profile
            let userProfile: ConsolidatedUser = {
              id: session.user.id,
              email: session.user.email || "",
              firstName: "",
              lastName: "",
            };

            try {
              const response = await fetch("/api/auth/profile", {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (response.ok) {
                const profile = await response.json();
                userProfile = {
                  id: session.user.id,
                  email: session.user.email || "",
                  ...profile,
                };
              }
            } catch (profileError) {
              console.warn("Failed to fetch profile during init:", profileError);
            }

            set({
              user: userProfile,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              isLoading: false,
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event !== "INITIAL_SESSION" && event !== "TOKEN_REFRESHED") {
              console.log("Auth state change:", event);
            }

            if (event === "SIGNED_IN" && session) {
              let userProfile: ConsolidatedUser = {
                id: session.user.id,
                email: session.user.email || "",
                firstName: "",
                lastName: "",
              };

              try {
                const response = await fetch("/api/auth/profile", {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                });

                if (response.ok) {
                  const profile = await response.json();
                  userProfile = {
                    id: session.user.id,
                    email: session.user.email || "",
                    ...profile,
                  };
                }
              } catch (error) {
                console.warn("Failed to fetch profile on sign in:", error);
              }

              set({
                user: userProfile,
                session,
                isAuthenticated: true,
                error: null,
              });
            } else if (event === "SIGNED_OUT") {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                error: null,
              });
            } else if (event === "TOKEN_REFRESHED" && session) {
              const currentUser = get().user;
              set({
                user: currentUser,
                session,
                isAuthenticated: true,
              });
            } else if (event === "USER_UPDATED" && session) {
              const currentUser = get().user;
              set({
                user: currentUser,
                session,
              });
            }
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to initialize auth",
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "consolidated-auth",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState };
        merged.isLoading = currentState.isLoading;
        merged.error = null;
        return merged;
      },
    }
  )
);

// Export the consolidated user type
export type { ConsolidatedUser };

// Aliases for backward compatibility
export const useConsolidatedAuth = useAuth;
export const useAuthStore = useAuth;