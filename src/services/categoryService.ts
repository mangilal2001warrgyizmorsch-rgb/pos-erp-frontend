import api from "./api";
import type { Category, ApiResponse } from "@/types";

export const categoryService = {
  getAll: async (params?: { search?: string }): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<Category[]>>("/categories", { params });
    return data.data;
  },

  create: async (payload: { name: string; description?: string; image?: string }): Promise<Category> => {
    const { data } = await api.post<ApiResponse<Category>>("/categories", payload);
    return data.data;
  },

  update: async (id: string, payload: { name: string; description?: string; image?: string }): Promise<Category> => {
    const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
