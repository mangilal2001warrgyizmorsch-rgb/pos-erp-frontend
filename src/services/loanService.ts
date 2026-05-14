import { Loan, ApiResponse } from "@/types";
import api from "./api";

export const loanService = {
  getAll: async (): Promise<ApiResponse<Loan[]>> => {
    const { data } = await api.get("/loans");
    return data;
  },

  create: async (payload: any): Promise<ApiResponse<Loan>> => {
    const { data } = await api.post("/loans", payload);
    return data;
  },
};
