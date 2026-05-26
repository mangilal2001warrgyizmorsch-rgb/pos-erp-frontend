import api from "./api";
import type { ApiResponse } from "@/types";
import type { User } from "@/types";

export interface Shift {
  _id: string;
  cashier: User | string;
  cashierName?: string;
  startTime: string;
  endTime?: string;
  openingBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  actualCash?: number;
  difference?: number;
  notes?: string;
}

export const shiftService = {
  getCurrent: async (): Promise<Shift | null> => {
    const { data } = await api.get<ApiResponse<Shift>>("/shifts/current");
    return data.data;
  },

  open: async (openingBalance: number, cashierName: string, notes?: string): Promise<Shift> => {
    const { data } = await api.post<ApiResponse<Shift>>("/shifts/open", { openingCash: openingBalance, cashierName, notes });
    return data.data;
  },

  close: async (payload: { closingBalance: number, actualCash: number, notes?: string }): Promise<Shift> => {
    const { data } = await api.post<ApiResponse<Shift>>("/shifts/close", payload);
    return data.data;
  },
};
