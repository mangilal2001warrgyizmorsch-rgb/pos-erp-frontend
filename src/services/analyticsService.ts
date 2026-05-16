import api from "./api";
import type { ApiResponse } from "@/types";

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStock: number;
  inventoryValue: number;
  inventoryCost: number;
  potentialProfit: number;
}

export interface SalesSummary {
  totalSales: number;
  totalAmount: number;
  totalDiscount: number;
  totalTax: number;
  avgOrderValue: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  purchaseCost: number;
  expenses: number;
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalAmount: number;
  totalTax: number;
  avgPurchaseValue: number;
  pendingPayments: number;
}

export interface RevenueSummary {
  totalSales: number;
  totalPurchaseCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: string | number;
}

export interface ReportFilters {
  period?: "daily" | "weekly" | "monthly" | "yearly";
  startDate?: string;
  endDate?: string;
  category?: string;
  product?: string;
  supplier?: string;
  customer?: string;
  search?: string;
}

export const analyticsService = {
  // Inventory Analytics
  getInventoryAnalytics: async (params?: ReportFilters) => {
    const { data } = await api.get<
      ApiResponse<{
        summary: any;
        charts: Record<string, any>;
        widgets: Record<string, any>;
        table: Array<any>;
      }>
    >("/reports/inventory", { params });
    return data.data;
  },

  // Sales Analytics
  getSalesAnalytics: async (params?: ReportFilters) => {
    const { data } = await api.get<
      ApiResponse<{
        summary: any;
        charts: Record<string, any>;
        table: Array<any>;
      }>
    >("/reports/sales", { params });
    return data.data;
  },

  // Revenue Analytics
  getRevenueAnalytics: async (params?: ReportFilters) => {
    const { data } = await api.get<
      ApiResponse<{
        summary: any;
        charts: Record<string, any>;
        table: Array<any>;
      }>
    >("/reports/revenue", { params });
    return data.data;
  },

  // Purchase Analytics
  getPurchaseAnalytics: async (params?: ReportFilters) => {
    const { data } = await api.get<
      ApiResponse<{
        summary: any;
        charts: Record<string, any>;
        table: Array<any>;
      }>
    >("/reports/purchases", { params });
    return data.data;
  },

  // Cashflow Analytics
  getCashFlow: async (params?: ReportFilters) => {
    const { data } = await api.get("/analytics/cashflow", { params });
    return data.data;
  },
};
