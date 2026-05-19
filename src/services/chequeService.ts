import { Cheque, ApiResponse } from "@/types";
import api from "./api";

export const chequeService = {
  getAll: async (): Promise<ApiResponse<Cheque[]>> => {
    const { data } = await api.get("/cheques");
    return data;
  },

  create: async (payload: any): Promise<ApiResponse<Cheque>> => {
    const { data } = await api.post("/cheques", payload);
    return data;
  },

  update: async (id: string, payload: any): Promise<ApiResponse<Cheque>> => {
    const { data } = await api.put(`/cheques/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete(`/cheques/${id}`);
    return data;
  },
};
