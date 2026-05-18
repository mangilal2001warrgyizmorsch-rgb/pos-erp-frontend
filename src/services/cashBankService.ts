import api from "./api";
import { ApiResponse } from "@/types";

export interface CashBankSummary {
  cashBalance: number;
  totalBankBalance: number;
  todayInflow: number;
  todayOutflow: number;
  netBalance: number;
  banks: any[];
}

export const cashBankService = {
  getTransactions: async (params?: any) => {
    const { data } = await api.get<ApiResponse<any[]>>("/cash-bank/transactions", { params });
    return data;
  },
  getTransactionById: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/cash-bank/transactions/${id}`);
    return data;
  },
  getSummary: async () => {
    const { data } = await api.get<ApiResponse<CashBankSummary>>("/cash-bank/summary");
    return data;
  },
  getAccounts: async () => {
    const { data } = await api.get<ApiResponse<any[]>>("/cash-bank/accounts");
    return data;
  },
  createCashEntry: async (body: any) => {
    const { data } = await api.post<ApiResponse<any>>("/cash-bank/cash-entry", body);
    return data;
  },
  createBankTransfer: async (body: any) => {
    const { data } = await api.post<ApiResponse<any>>("/cash-bank/bank-transfer", body);
    return data;
  },
  reverseTransaction: async (id: string, body: { reversalReason: string }) => {
    const { data } = await api.post<ApiResponse<any>>(`/cash-bank/transactions/${id}/reverse`, body);
    return data;
  },
  createAccount: async (body: any) => {
    const { data } = await api.post<ApiResponse<any>>("/cash-bank/accounts", body);
    return data;
  },
  updateAccount: async (id: string, body: any) => {
    const { data } = await api.put<ApiResponse<any>>(`/cash-bank/accounts/${id}`, body);
    return data;
  }
};
