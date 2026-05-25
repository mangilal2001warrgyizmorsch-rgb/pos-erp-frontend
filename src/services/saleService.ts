import { Sale, DashboardStats } from "@/types";
import api from "./api";

export const saleService = {
  // Existing methods...
  getAll: async (params?: any) => {
    const { data } = await api.get("/sales", { params });
    return data;
  },

  getById: async (id: string): Promise<Sale> => {
    const { data } = await api.get(`/sales/${id}`);
    return data.data;
  },

  create: async (payload: any) => {
    const { data } = await api.post("/sales", payload);
    return data.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("/sales/stats/dashboard");
    return data.data;
  },
  getUnpaid: async (customerId: string) => {
    const { data } = await api.get(`/sales/unpaid/${customerId}`);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/sales/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/sales/${id}`);
  },
};
