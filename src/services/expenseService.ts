import api from "./api";
import type { Expense, ExpenseCategory, ApiResponse, Pagination } from "@/types";

export const expenseService = {
  // Expenses
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
  }): Promise<{ data: Expense[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Expense[]>>("/expenses", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return data.data;
  },

  create: async (payload: Record<string, unknown>): Promise<Expense> => {
    const { data } = await api.post<ApiResponse<Expense>>("/expenses", payload);
    return data.data;
  },

  update: async (id: string, payload: Record<string, unknown>): Promise<Expense> => {
    const { data } = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  // Expense Categories
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const { data } = await api.get<ApiResponse<ExpenseCategory[]>>("/expense-categories");
    return data.data;
  },

  createCategory: async (payload: { name: string; description?: string; color?: string }): Promise<ExpenseCategory> => {
    const { data } = await api.post<ApiResponse<ExpenseCategory>>("/expense-categories", payload);
    return data.data;
  },

  updateCategory: async (id: string, payload: { name: string; description?: string; color?: string }): Promise<ExpenseCategory> => {
    const { data } = await api.put<ApiResponse<ExpenseCategory>>(`/expense-categories/${id}`, payload);
    return data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/expense-categories/${id}`);
  },

  // Reports
  getReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) => {
    const { data } = await api.get("/expenses/reports/summary", { params });
    return data.data;
  },
};
