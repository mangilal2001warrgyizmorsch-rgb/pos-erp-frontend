import api from "./api";
import type { Product, StockMovement, StockAdjustment, ApiResponse, Pagination } from "@/types";

export const stockService = {
  // Current stock (products with stock info)
  getCurrentStock: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: "all" | "in_stock" | "low_stock" | "out_of_stock";
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ data: Product[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Product[]>>("/stock", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  // Stock movements
  getMovements: async (params?: {
    page?: number;
    limit?: number;
    product?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: StockMovement[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<StockMovement[]>>("/stock/movements", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  // Stock adjustments
  getAdjustments: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: StockAdjustment[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<StockAdjustment[]>>("/stock/adjustments", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  createAdjustment: async (payload: {
    product: string;
    adjustedStock: number;
    reason: string;
    notes?: string;
  }): Promise<StockAdjustment> => {
    const { data } = await api.post<ApiResponse<StockAdjustment>>("/stock/adjustments", payload);
    return data.data;
  },

  // Low stock alerts
  getLowStockAlerts: async (): Promise<Product[]> => {
    const { data } = await api.get<ApiResponse<Product[]>>("/stock/alerts");
    return data.data;
  },

  // Stock stats
  getStats: async () => {
    const { data } = await api.get("/stock/stats");
    return data.data;
  },
};
