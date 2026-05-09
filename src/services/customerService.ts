import api from "./api";
import type { Customer, ApiResponse, Pagination } from "@/types";

export const customerService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Customer[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Customer[]>>("/customers", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Customer> => {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await api.post<ApiResponse<Customer>>("/customers", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
