import { create } from 'zustand';
import type { Product, Customer } from '@/types';

export interface POSItem {
  id: string;
  productId?: string;
  product?: Product;
  itemCode: string;
  itemName: string;
  barcode?: string;
  customItem: boolean;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  purchasePrice: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  discount: number;
  isInclusive: boolean; // if price includes tax
}

export interface POSBill {
  id: string;
  billNo: number;
  customer: Customer | null;
  items: POSItem[];
  selectedRowIndex: number;
  paymentMode: string;
  amountReceived: number;
  discount: number;
  additionalCharges: number;
  remarks: string;
}

export type POSModalType = "qty" | "itemDisc" | "unit" | "addCharges" | "billDisc" | "loyalty" | "remarks" | null;

interface POSStore {
  bills: POSBill[];
  activeBillId: string | null;
  nextBillNo: number;
  activeModal: POSModalType;
  
  createNewBill: () => void;
  closeBill: (id: string) => void;
  setActiveBill: (id: string) => void;
  setActiveModal: (type: POSModalType) => void;
  
  // Actions on active bill
  getActiveBill: () => POSBill | undefined;
  addItem: (item: Partial<POSItem>) => void;
  updateItem: (id: string, updates: Partial<POSItem>) => void;
  removeItem: (id: string) => void;
  selectRow: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMode: (mode: string) => void;
  setAmountReceived: (amount: number) => void;
  updateBillField: (field: keyof POSBill, value: any) => void;
  resetActiveBill: () => void;
}

const createEmptyBill = (id: string, billNo: number): POSBill => ({
  id,
  billNo,
  customer: null,
  items: [],
  selectedRowIndex: -1,
  paymentMode: 'Cash',
  amountReceived: 0,
  discount: 0,
  additionalCharges: 0,
  remarks: '',
});

export const usePOSStore = create<POSStore>((set, get) => ({
  bills: [createEmptyBill('1', 1)],
  activeBillId: '1',
  nextBillNo: 2,
  activeModal: null,

  createNewBill: () => {
    set((state) => {
      const id = crypto.randomUUID();
      const newBill = createEmptyBill(id, state.nextBillNo);
      return {
        bills: [...state.bills, newBill],
        activeBillId: id,
        nextBillNo: state.nextBillNo + 1,
      };
    });
  },

  closeBill: (id) => {
    set((state) => {
      const newBills = state.bills.filter((b) => b.id !== id);
      if (newBills.length === 0) {
        const newId = crypto.randomUUID();
        return {
          bills: [createEmptyBill(newId, state.nextBillNo)],
          activeBillId: newId,
          nextBillNo: state.nextBillNo + 1,
        };
      }
      return {
        bills: newBills,
        activeBillId: state.activeBillId === id ? newBills[0].id : state.activeBillId,
      };
    });
  },

  setActiveBill: (id) => set({ activeBillId: id }),
  setActiveModal: (type) => set({ activeModal: type }),

  getActiveBill: () => {
    const state = get();
    return state.bills.find((b) => b.id === state.activeBillId);
  },

  updateActiveBill: (updater: (bill: POSBill) => POSBill) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? updater(b) : b
      )
    }));
  },

  addItem: (itemData) => {
    set((state) => {
      const newItem: POSItem = {
        id: crypto.randomUUID(),
        itemCode: '',
        itemName: '',
        customItem: false,
        quantity: 1,
        unit: 'Pcs',
        pricePerUnit: 0,
        purchasePrice: 0,
        taxPercent: 0,
        taxAmount: 0,
        total: 0,
        discount: 0,
        isInclusive: false,
        ...itemData,
      };

      // Calculate totals
      const baseAmt = newItem.quantity * newItem.pricePerUnit;
      if (newItem.isInclusive && newItem.taxPercent > 0) {
        const rowTotal = baseAmt;
        const baseWithoutTax = rowTotal / (1 + newItem.taxPercent / 100);
        newItem.taxAmount = rowTotal - baseWithoutTax;
        newItem.total = rowTotal;
      } else {
        newItem.taxAmount = baseAmt * (newItem.taxPercent / 100);
        newItem.total = baseAmt + newItem.taxAmount;
      }

      return {
        bills: state.bills.map((b) => {
          if (b.id !== state.activeBillId) return b;
          
          // Check if item already exists (if it's a product)
          if (newItem.productId) {
            const existingIndex = b.items.findIndex(i => i.productId === newItem.productId);
            if (existingIndex >= 0) {
              const items = [...b.items];
              const existing = items[existingIndex];
              items[existingIndex] = {
                ...existing,
                quantity: existing.quantity + 1,
              };
              // Recalculate
              const eBase = items[existingIndex].quantity * items[existingIndex].pricePerUnit;
              if (items[existingIndex].isInclusive && items[existingIndex].taxPercent > 0) {
                const eBaseWithoutTax = eBase / (1 + items[existingIndex].taxPercent / 100);
                items[existingIndex].taxAmount = eBase - eBaseWithoutTax;
                items[existingIndex].total = eBase;
              } else {
                items[existingIndex].taxAmount = eBase * (items[existingIndex].taxPercent / 100);
                items[existingIndex].total = eBase + items[existingIndex].taxAmount;
              }
              return { ...b, items, selectedRowIndex: existingIndex };
            }
          }
          
          return {
            ...b,
            items: [...b.items, newItem],
            selectedRowIndex: b.items.length, // Select the newly added row
          };
        })
      };
    });
  },

  updateItem: (id, updates) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== state.activeBillId) return b;
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            // Recalculate
            const baseAmt = updated.quantity * updated.pricePerUnit;
            if (updated.isInclusive && updated.taxPercent > 0) {
              const rowTotal = baseAmt;
              const baseWithoutTax = rowTotal / (1 + updated.taxPercent / 100);
              updated.taxAmount = rowTotal - baseWithoutTax;
              updated.total = rowTotal;
            } else {
              updated.taxAmount = baseAmt * (updated.taxPercent / 100);
              updated.total = baseAmt + updated.taxAmount;
            }
            return updated;
          })
        };
      })
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== state.activeBillId) return b;
        const newItems = b.items.filter(i => i.id !== id);
        return {
          ...b,
          items: newItems,
          selectedRowIndex: Math.min(b.selectedRowIndex, newItems.length - 1),
        };
      })
    }));
  },

  selectRow: (index) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? { ...b, selectedRowIndex: index } : b
      )
    }));
  },

  setCustomer: (customer) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? { ...b, customer } : b
      )
    }));
  },

  setPaymentMode: (mode) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? { ...b, paymentMode: mode } : b
      )
    }));
  },

  setAmountReceived: (amount) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? { ...b, amountReceived: amount } : b
      )
    }));
  },

  updateBillField: (field, value) => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? { ...b, [field]: value } : b
      )
    }));
  },

  resetActiveBill: () => {
    set((state) => ({
      bills: state.bills.map((b) => 
        b.id === state.activeBillId ? createEmptyBill(b.id, b.billNo) : b
      )
    }));
  },

}));
