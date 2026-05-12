import api from "./api";
import type { Purchase, PurchaseReturn, ApiResponse, Pagination } from "@/types";

export const purchaseService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    supplier?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Purchase[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Purchase[]>>("/purchases", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Purchase> => {
    const { data } = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return data.data;
  },

  create: async (payload: Record<string, unknown>): Promise<Purchase> => {
    const { data } = await api.post<ApiResponse<Purchase>>("/purchases", payload);
    return data.data;
  },

  update: async (id: string, payload: Record<string, unknown>): Promise<Purchase> => {
    const { data } = await api.put<ApiResponse<Purchase>>(`/purchases/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },

  // Draft operations
  saveDraft: async (payload: Record<string, unknown>): Promise<Purchase> => {
    const { data } = await api.post<ApiResponse<Purchase>>("/purchases", {
      ...payload,
      status: "draft",
    });
    return data.data;
  },

  getDrafts: async (): Promise<{ data: Purchase[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Purchase[]>>("/purchases", {
      params: { status: "draft" },
    });
    return { data: data.data, pagination: data.pagination! };
  },

  // Returns
  createReturn: async (purchaseId: string, payload: Record<string, unknown>): Promise<PurchaseReturn> => {
    const { data } = await api.post<ApiResponse<PurchaseReturn>>(
      `/purchases/${purchaseId}/return`,
      payload
    );
    return data.data;
  },

  getReturns: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: PurchaseReturn[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<PurchaseReturn[]>>("/purchase-returns", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  // Stats
  getStats: async () => {
    const { data } = await api.get("/purchases/stats/overview");
    return data.data;
  },
};
