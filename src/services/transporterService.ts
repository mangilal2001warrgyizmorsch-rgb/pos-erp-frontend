import api from "./api";
import type { Transporter, ApiResponse, Pagination } from "@/types";

export const transporterService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Transporter[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Transporter[]>>("/transporters", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Transporter> => {
    const { data } = await api.get<ApiResponse<Transporter>>(`/transporters/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Transporter>): Promise<Transporter> => {
    const { data } = await api.post<ApiResponse<Transporter>>("/transporters", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Transporter>): Promise<Transporter> => {
    const { data } = await api.put<ApiResponse<Transporter>>(`/transporters/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transporters/${id}`);
  },
};
