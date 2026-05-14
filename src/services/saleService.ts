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
    return data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("/sales/dashboard/stats");
    return data.data;
  },
};
