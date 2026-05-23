import api from "./api";
import type { Subcategory, ApiResponse } from "@/types";

export const subcategoryService = {
  getAll: async (params?: { search?: string; parentCategoryId?: string; all?: string; page?: number; limit?: number }): Promise<any> => {
    const { data } = await api.get<ApiResponse<Subcategory[]>>("/subcategories", { params });
    if (params?.page) {
      return { data: data.data, pagination: data.pagination };
    }
    return data.data;
  },

  create: async (payload: { name: string; description?: string; image?: string; parentCategoryId: string }): Promise<Subcategory> => {
    const { data } = await api.post<ApiResponse<Subcategory>>("/subcategories", payload);
    return data.data;
  },

  update: async (id: string, payload: { name?: string; description?: string; image?: string; parentCategoryId?: string }): Promise<Subcategory> => {
    const { data } = await api.put<ApiResponse<Subcategory>>(`/subcategories/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subcategories/${id}`);
  },
};
