import { create } from "zustand";
import type { User } from "@/types";
import { authService } from "@/services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    localStorage.setItem("pos-token", token);
    localStorage.setItem("pos-user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("pos-token");
    localStorage.removeItem("pos-user");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    localStorage.setItem("pos-user", JSON.stringify(user));
    set({ user });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pos-token");
      const userStr = localStorage.getItem("pos-user");
      
      // Load from localStorage first for immediate UI
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true });
          
          // Then fetch fresh data from API to sync (especially for role changes)
          try {
            const response = await authService.getMe();
            if (response.success) {
              const freshUser = response.data;
              localStorage.setItem("pos-user", JSON.stringify(freshUser));
              set({ user: freshUser });
            }
          } catch (error) {
            console.error("Failed to fetch fresh user data", error);
            // If token is invalid, logout
            if ((error as any)?.response?.status === 401) {
              localStorage.removeItem("pos-token");
              localStorage.removeItem("pos-user");
              set({ user: null, token: null, isAuthenticated: false });
            }
          }
        } catch {
          set({ isAuthenticated: false });
        }
      }
      
      set({ isLoading: false });
    }
  },
}));

