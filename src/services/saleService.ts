import { Sale, DashboardStats } from "@/types";
import api from "./api";
import { db } from "@/lib/db";

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
    try {
      const { data } = await api.post("/sales", payload);
      return data.data;
    } catch (error: any) {
      // Only queue offline if it's a genuine network failure (no response at all)
      const isNetworkFailure = (
        error.code === 'ERR_NETWORK' || 
        !navigator.onLine || 
        (error.message && error.message.includes('Network Error') && !error.response)
      );
      
      if (isNetworkFailure) {
        console.warn("Offline mode: Queuing sale to local IndexedDB");
        
        const offlineSaleId = crypto.randomUUID();
        const mockResponse = {
          ...payload,
          _id: `offline_${offlineSaleId}`,
          invoiceNumber: `OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          isOffline: true
        };
        
        await db.offlineSales.add({
          uuid: offlineSaleId,
          payload: payload,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        
        return mockResponse;
      }
      throw error;
    }
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
  generateEInvoice: async (id: string) => {
    const { data } = await api.post(`/sales/${id}/einvoice`);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/sales/${id}`);
  },
};
