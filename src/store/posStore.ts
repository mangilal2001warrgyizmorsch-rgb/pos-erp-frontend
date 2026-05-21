import { create } from 'zustand';
import type { Product, Customer } from '@/types';

// Dummy walk-in customer — never persisted to DB
export const WALK_IN_CUSTOMER: Customer = {
  _id: 'walk-in',
  name: 'Walk-in Customer',
  phone: '',
  email: '',
  address: '',
  totalPurchases: 0,
  totalSpent: 0,
  walletBalance: 0,
  isActive: true,
  createdAt: '',
};

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
  cashBankAccountId?: string;
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
  updateItemProduct: (id: string, updates: Partial<POSItem>) => void;
  removeItem: (id: string) => void;
  selectRow: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMode: (mode: string) => void;
  setAmountReceived: (amount: number) => void;
  updateBillField: (field: keyof POSBill, value: any) => void;
  resetActiveBill: () => void;
}

export const createPlaceholderItem = (): POSItem => ({
  id: crypto.randomUUID(),
  itemCode: '',
  itemName: '',
  barcode: '',
  customItem: true,
  quantity: 1,
  unit: 'Pcs',
  pricePerUnit: 0,
  purchasePrice: 0,
  taxPercent: 0,
  taxAmount: 0,
  total: 0,
  discount: 0,
  isInclusive: false,
});

const createEmptyBill = (id: string, billNo: number): POSBill => ({
  id,
  billNo,
  customer: WALK_IN_CUSTOMER,
  items: [createPlaceholderItem()],
  selectedRowIndex: 0,
  paymentMode: 'Cash',
  amountReceived: 0,
  discount: 0,
  additionalCharges: 0,
  remarks: '',
  cashBankAccountId: '',
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

      // Calculate totals (with discount)
      const baseAmt = newItem.quantity * newItem.pricePerUnit;
      const discountAmt = baseAmt * (newItem.discount / 100);
      const afterDiscount = baseAmt - discountAmt;
      if (newItem.isInclusive && newItem.taxPercent > 0) {
        const baseWithoutTax = afterDiscount / (1 + newItem.taxPercent / 100);
        newItem.taxAmount = afterDiscount - baseWithoutTax;
        newItem.total = afterDiscount;
      } else {
        newItem.taxAmount = afterDiscount * (newItem.taxPercent / 100);
        newItem.total = afterDiscount + newItem.taxAmount;
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
              const eDiscAmt = eBase * (items[existingIndex].discount / 100);
              const eAfterDisc = eBase - eDiscAmt;
              if (items[existingIndex].isInclusive && items[existingIndex].taxPercent > 0) {
                const eBaseWithoutTax = eAfterDisc / (1 + items[existingIndex].taxPercent / 100);
                items[existingIndex].taxAmount = eAfterDisc - eBaseWithoutTax;
                items[existingIndex].total = eAfterDisc;
              } else {
                items[existingIndex].taxAmount = eAfterDisc * (items[existingIndex].taxPercent / 100);
                items[existingIndex].total = eAfterDisc + items[existingIndex].taxAmount;
              }
              return { ...b, items, selectedRowIndex: existingIndex };
            }
          }
          
          return {
            ...b,
            items: [...b.items, newItem],
            selectedRowIndex: b.items.length - 1, // Keep focus on the row we just added
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
            // Recalculate with discount
            const baseAmt = updated.quantity * updated.pricePerUnit;
            const discountAmt = baseAmt * (updated.discount / 100);
            const afterDiscount = baseAmt - discountAmt;
            if (updated.isInclusive && updated.taxPercent > 0) {
              const baseWithoutTax = afterDiscount / (1 + updated.taxPercent / 100);
              updated.taxAmount = afterDiscount - baseWithoutTax;
              updated.total = afterDiscount;
            } else {
              updated.taxAmount = afterDiscount * (updated.taxPercent / 100);
              updated.total = afterDiscount + updated.taxAmount;
            }
            return updated;
          })
        };
      })
    }));
  },

  updateItemProduct: (id, updates) => {
    set((state) => {
      const activeBill = state.bills.find((b) => b.id === state.activeBillId);
      if (!activeBill) return {};

      const itemIndex = activeBill.items.findIndex(i => i.id === id);
      if (itemIndex === -1) return {};

      const currentItem = activeBill.items[itemIndex];
      const updatedItem = {
        ...currentItem,
        ...updates,
      };

      // Calculate totals with discount
      const baseAmt = updatedItem.quantity * updatedItem.pricePerUnit;
      const discountAmt = baseAmt * (updatedItem.discount / 100);
      const afterDiscount = baseAmt - discountAmt;
      if (updatedItem.isInclusive && updatedItem.taxPercent > 0) {
        const baseWithoutTax = afterDiscount / (1 + updatedItem.taxPercent / 100);
        updatedItem.taxAmount = afterDiscount - baseWithoutTax;
        updatedItem.total = afterDiscount;
      } else {
        updatedItem.taxAmount = afterDiscount * (updatedItem.taxPercent / 100);
        updatedItem.total = afterDiscount + updatedItem.taxAmount;
      }

      let updatedItems = [...activeBill.items];
      updatedItems[itemIndex] = updatedItem;

      let selectedIndex = itemIndex;
      if (updatedItem.productId) {
        const duplicateIndex = updatedItems.findIndex(
          (i, idx) => idx !== itemIndex && i.productId === updatedItem.productId
        );

        if (duplicateIndex >= 0) {
          const existing = updatedItems[duplicateIndex];
          const newQty = existing.quantity + updatedItem.quantity;
          
          const mergedItem = {
            ...existing,
            quantity: newQty,
          };

          // Recalculate merged totals
          const eBase = mergedItem.quantity * mergedItem.pricePerUnit;
          const eDiscAmt2 = eBase * (mergedItem.discount / 100);
          const eAfterDisc2 = eBase - eDiscAmt2;
          if (mergedItem.isInclusive && mergedItem.taxPercent > 0) {
            const eBaseWithoutTax = eAfterDisc2 / (1 + mergedItem.taxPercent / 100);
            mergedItem.taxAmount = eAfterDisc2 - eBaseWithoutTax;
            mergedItem.total = eAfterDisc2;
          } else {
            mergedItem.taxAmount = eAfterDisc2 * (mergedItem.taxPercent / 100);
            mergedItem.total = eAfterDisc2 + mergedItem.taxAmount;
          }

          updatedItems[duplicateIndex] = mergedItem;
          selectedIndex = duplicateIndex;

          if (itemIndex === updatedItems.length - 1) {
            updatedItems[itemIndex] = createPlaceholderItem();
            selectedIndex = itemIndex;
          } else {
            updatedItems.splice(itemIndex, 1);
            if (selectedIndex > itemIndex) {
              selectedIndex -= 1;
            }
          }
        }
      }

      // Append new placeholder if we just filled the last one
      const lastItem = updatedItems[updatedItems.length - 1];
      if (lastItem && lastItem.itemName !== '') {
        const newPlaceholder = createPlaceholderItem();
        updatedItems.push(newPlaceholder);
        // Do NOT change selectedIndex here. We want focus to stay on the newly filled row.
      }

      return {
        bills: state.bills.map((b) =>
          b.id === state.activeBillId
            ? { ...b, items: updatedItems, selectedRowIndex: selectedIndex }
            : b
        ),
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== state.activeBillId) return b;
        let newItems = b.items.filter(i => i.id !== id);
        if (newItems.length === 0) {
          newItems = [createPlaceholderItem()];
        }
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
