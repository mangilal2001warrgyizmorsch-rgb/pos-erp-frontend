import api from "./api";
import type { BusinessProfile, ApiResponse } from "@/types";

export const businessService = {
  getProfile: async (): Promise<BusinessProfile> => {
    const response = await api.get<ApiResponse<BusinessProfile>>("/business");
    return response.data.data;
  },

  updateProfile: async (data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    const response = await api.put<ApiResponse<BusinessProfile>>("/business", data);
    return response.data.data;
  },
};
