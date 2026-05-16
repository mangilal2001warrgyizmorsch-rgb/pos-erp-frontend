import api from "./api";
import { ApiResponse } from "@/types";

export interface LedgerEntry {
  _id: string;
  partyId: string;
  partyType: string;
  type: string;
  debitAmount: number;
  creditAmount: number;
  balanceAfter: number;
  referenceId: string;
  receiptNo?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export const partyLedgerService = {
  getLedger: async (partyId: string, params?: any) => {
    const { data } = await api.get<ApiResponse<LedgerEntry[]>>(`/ledger/${partyId}`, { params });
    return data;
  },
};
