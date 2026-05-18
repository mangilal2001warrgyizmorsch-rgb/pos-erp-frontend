import { create } from "zustand";
import { cashBankService, CashBankSummary } from "@/services/cashBankService";

export interface CashBankFilters {
  startDate: string;
  endDate: string;
  type: string;
  direction: string;
  accountId: string;
  paymentMode: string;
  partyId: string;
  search: string;
}

const initialFilters: CashBankFilters = {
  startDate: "",
  endDate: "",
  type: "All",
  direction: "All",
  accountId: "all",
  paymentMode: "All",
  partyId: "All",
  search: "",
};

export interface CashBankState {
  summary: CashBankSummary;
  transactions: any[];
  filters: CashBankFilters;
  loading: boolean;
  liveConnected: boolean;
  setFilters: (filters: Partial<CashBankFilters>) => void;
  resetFilters: () => void;
  fetchSummary: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addLiveTransaction: (transaction: any) => void;
  updateLiveBalance: (summary: CashBankSummary) => void;
  setLiveConnected: (connected: boolean) => void;
}

export const useCashBankStore = create<CashBankState>((set, get) => ({
  summary: {
    cashBalance: 0,
    totalBankBalance: 0,
    todayInflow: 0,
    todayOutflow: 0,
    netBalance: 0,
    banks: [],
  },
  transactions: [],
  filters: initialFilters,
  loading: false,
  liveConnected: false,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchTransactions();
  },

  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchTransactions();
  },

  fetchSummary: async () => {
    try {
      const response = await cashBankService.getSummary();
      if (response.success && response.data) {
        set({ summary: response.data });
      }
    } catch (err) {
      console.error("Error fetching cash/bank summary:", err);
    }
  },

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const activeFilters = get().filters;
      const params: any = {};
      
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;
      if (activeFilters.type !== "All") params.type = activeFilters.type;
      if (activeFilters.direction !== "All") params.direction = activeFilters.direction;
      if (activeFilters.accountId && activeFilters.accountId !== "all") params.accountId = activeFilters.accountId;
      if (activeFilters.paymentMode !== "All") params.paymentMode = activeFilters.paymentMode;
      if (activeFilters.partyId !== "All") params.partyId = activeFilters.partyId;
      if (activeFilters.search) params.search = activeFilters.search;

      const response = await cashBankService.getTransactions(params);
      if (response.success && response.data) {
        set({ transactions: response.data });
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      set({ loading: false });
    }
  },

  addLiveTransaction: (transaction) => {
    set((state) => {
      // Avoid inserting duplicates
      const exists = state.transactions.some(tx => tx._id === transaction._id);
      if (exists) return {};
      return {
        transactions: [transaction, ...state.transactions],
      };
    });
  },

  updateLiveBalance: (summary) => {
    set({ summary });
  },

  setLiveConnected: (connected) => {
    set({ liveConnected: connected });
  },
}));
