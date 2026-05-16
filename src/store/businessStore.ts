import { create } from "zustand";
import { businessService } from "@/services/businessService";
import type { BusinessProfile } from "@/types";

interface BusinessState {
  profile: BusinessProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<BusinessProfile>) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set) => ({
  profile: null,
  loading: false,
  fetchProfile: async () => {
    try {
      set({ loading: true });
      const data = await businessService.getProfile();
      set({ profile: data, loading: false });
    } catch (error) {
      console.error("Failed to fetch business profile", error);
      set({ loading: false });
    }
  },
  updateProfile: async (data) => {
    try {
      set({ loading: true });
      const updated = await businessService.updateProfile(data);
      set({ profile: updated, loading: false });
    } catch (error) {
      console.error("Failed to update business profile", error);
      set({ loading: false });
      throw error;
    }
  },
}));
