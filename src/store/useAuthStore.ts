import { create } from "zustand";
import type { UserProfile } from "../types";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSigningOut: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  initialize: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSigningOut: false,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  initialize: () => {
    const { isInitialized, isSigningOut } = useAuthStore.getState();
    
    // PERMANENT FIX: Never create more than one listener
    if (isInitialized) return;
    set({ isInitialized: true });

    console.log("[AUTH] Initializing Singleton Listener...");

    supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't process anything if we are currently mid-signout
      if (isSigningOut) return;
      
      console.log("[AUTH] Event:", event, "| Has session:", !!session);

      if (!session?.user?.email) {
        console.log("[AUTH] No session - user logged out or not authenticated");
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Wait a tick to let the Supabase client fully establish the auth header
      await new Promise(resolve => setTimeout(resolve, 100));

      const email = session.user.email.toLowerCase();
      console.log("[AUTH] Fetching profile for:", email);

      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (error) {
          console.error("[AUTH] Profile query error:", error.message, error.code, error.details);
          set({ user: null, isAuthenticated: false, isLoading: false });
          await supabase.auth.signOut().catch(() => {});
          return;
        }

        if (!profile) {
          console.error("[AUTH] Profile not found for:", email);
          set({ user: null, isAuthenticated: false, isLoading: false });
          await supabase.auth.signOut().catch(() => {});
          return;
        }

        console.log("[AUTH] ✅ Profile loaded:", profile.name, profile.role);
        set({
          user: {
            uid: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            department: profile.department || "",
            isActive: profile.is_active,
            lastLogin: profile.last_login,
          } as UserProfile,
          isAuthenticated: true,
          isLoading: false,
        });

        // Update last_login (fire-and-forget)
        supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", profile.id)
          .then(() => {});

      } catch (e) {
        console.error("[AUTH] Unexpected error:", e);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  signOut: async () => {
    console.log("[AUTH] Aggressive Sign Out Started...");
    
    // 1. Immediately wipe local state to kill UI loops and dashboard counters
    set({ user: null, isAuthenticated: false, isLoading: false, isSigningOut: true });

    // 2. Clear known Supabase session tokens from localStorage manually
    // This is the 'Permanent Fix' for ghost sessions that hang the browser
    Object.keys(localStorage).forEach(key => {
      if (key.includes("supabase.auth.token") || key.includes("-auth-token")) {
        localStorage.removeItem(key);
      }
    });

    try {
      // 3. Fire the real Supabase sign-out (fire-and-forget style)
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[AUTH] Network cleanup failed (ignoring):", err);
    } finally {
      // 4. Force a hard window location reset to purge memory and background timers
      window.location.href = "/login";
    }
  },
}));
