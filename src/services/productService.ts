import api from "./api";
import type { Product, ApiResponse, Pagination } from "@/types";

export const productService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
    lowStock?: boolean;
  }): Promise<{ data: Product[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Product[]>>("/products", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Product>): Promise<Product> => {
    const { data } = await api.post<ApiResponse<Product>>("/products", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getStats: async () => {
    const { data } = await api.get("/products/stats/overview");
    return data.data;
  },
};
