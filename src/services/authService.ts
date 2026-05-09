import api from "./api";
import type { User } from "@/types";

interface AuthResponse {
  success: boolean;
  data: User;
  token: string;
  message?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    return data;
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },

  updateProfile: async (payload: { name: string; phone?: string }) => {
    const { data } = await api.put("/auth/profile", payload);
    return data;
  },
};
