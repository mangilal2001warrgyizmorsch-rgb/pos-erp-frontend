import api from "./api";
import type { Supplier, SupplierLedgerEntry, ApiResponse, Pagination } from "@/types";

export const supplierService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    hasBalance?: string;
  }): Promise<{ data: Supplier[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Supplier[]>>("/suppliers", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Supplier> => {
    const { data } = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await api.post<ApiResponse<Supplier>>("/suppliers", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  getLedger: async (id: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: SupplierLedgerEntry[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<SupplierLedgerEntry[]>>(`/suppliers/${id}/ledger`, { params });
    return { data: data.data, pagination: data.pagination! };
  },
};
