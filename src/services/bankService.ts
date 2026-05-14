import { BankAccount, Transaction, ApiResponse } from "@/types";
import api from "./api";

export const bankService = {
  getAll: async (): Promise<ApiResponse<BankAccount[]>> => {
    const { data } = await api.get("/bank");
    return data;
  },

  create: async (payload: any): Promise<ApiResponse<BankAccount>> => {
    const { data } = await api.post("/bank", payload);
    return data;
  },

  getTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    const { data } = await api.get("/bank/transaction");
    return data;
  },

  createTransaction: async (payload: any): Promise<ApiResponse<Transaction>> => {
    const { data } = await api.post("/bank/transaction", payload);
    return data;
  },
};
