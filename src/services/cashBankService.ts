import api from "./api";
import { ApiResponse } from "@/types";

export interface CashBankSummary {
  cashBalance: number;
  totalBankBalance: number;
  banks: any[];
}

export const cashBankService = {
  getTransactions: async (params?: any) => {
    const { data } = await api.get<ApiResponse<any[]>>("/cash-bank/transactions", { params });
    return data;
  },
  getSummary: async () => {
    const { data } = await api.get<ApiResponse<CashBankSummary>>("/cash-bank/summary");
    return data;
  },
};
