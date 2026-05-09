import api from "./api";
import type { Sale, ApiResponse, Pagination, DashboardStats } from "@/types";

export const saleService = {
  create: async (payload: Record<string, unknown>): Promise<Sale> => {
    const { data } = await api.post<ApiResponse<Sale>>("/sales", payload);
    return data.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
  }): Promise<{ data: Sale[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Sale[]>>("/sales", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Sale> => {
    const { data } = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
    return data.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>("/sales/stats/dashboard");
    return data.data;
  },

  getSalesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) => {
    const { data } = await api.get("/sales/reports/sales", { params });
    return data.data;
  },
};
