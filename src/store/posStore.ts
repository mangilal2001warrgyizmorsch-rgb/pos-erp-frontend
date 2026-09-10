import { create } from 'zustand';
import type { Product, Customer } from '@/types';
import { saleService } from '@/services/saleService';
import { useBusinessStore } from '@/store/businessStore';

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
  productId?: string | null;
  product?: Product;
  productRef?: string | null;
  batchId?: string | null;
  selectedPriceType?: string | null;
  priceLabel?: string;
  mrp?: number;
  availableQty?: number;
  priceSelectionRequired?: boolean;
  itemType: "inventory" | "non_stock_product" | "service";
  affectsInventory: boolean;
  itemCode: string;
  itemName: string;
  name?: string;
  description?: string;
  barcode?: string;
  customItem: boolean;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  rate: number;
  purchasePrice: number;
  taxPercent: number;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxType?: "CGST_SGST" | "IGST" | "NONE";
  total: number;
  totalAmount: number;
  discount: number;
  isInclusive: boolean; // if price includes tax
  incomeLedger?: string | null;
}

export interface POSBill {
  id: string;
  editingId?: string;
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
  godownId?: string;
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
  loadSaleForEditing: (id: string) => Promise<void>;
  
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
  updateBillField: (field: keyof POSBill, value: POSBill[keyof POSBill]) => void;
  resetActiveBill: () => void;
}

export const createPlaceholderItem = (): POSItem => ({
  id: crypto.randomUUID(),
  productId: null,
  productRef: null,
  batchId: null,
  selectedPriceType: null,
  priceLabel: '',
  mrp: 0,
  availableQty: 0,
  priceSelectionRequired: false,
  itemType: 'inventory',
  affectsInventory: true,
  itemCode: '',
  itemName: '',
  name: '',
  description: '',
  barcode: '',
  customItem: true,
  quantity: 1,
  unit: 'Pcs',
  pricePerUnit: 0,
  rate: 0,
  purchasePrice: 0,
  taxPercent: 0,
  taxRate: 0,
  taxableAmount: 0,
  taxAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  taxType: "NONE",
  total: 0,
  totalAmount: 0,
  discount: 0,
  isInclusive: false,
  incomeLedger: null,
});

export const calculatePOSItemAmounts = (
  item: POSItem,
  customerStateCode?: string | null,
  businessStateCode?: string | null
): POSItem => {
  const quantity = Math.max(0, Number(item.quantity || 0));
  const rate = Math.max(0, Number(item.pricePerUnit ?? item.rate ?? 0));
  const discount = Math.max(0, Math.min(100, Number(item.discount || 0)));
  const taxPercent = Math.max(0, Number(item.taxPercent ?? item.taxRate ?? 0));
  const grossAmount = quantity * rate;
  const discountAmount = grossAmount * (discount / 100);
  const taxableAmount = Math.max(0, grossAmount - discountAmount);

  let taxAmount = 0;
  let totalAmount = 0;
  if (item.isInclusive && taxPercent > 0) {
    const baseWithoutTax = taxableAmount / (1 + taxPercent / 100);
    taxAmount = taxableAmount - baseWithoutTax;
    totalAmount = taxableAmount;
  } else {
    taxAmount = taxableAmount * (taxPercent / 100);
    totalAmount = taxableAmount + taxAmount;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let taxType: "CGST_SGST" | "IGST" | "NONE" = "NONE";

  if (taxPercent > 0) {
    if (customerStateCode && businessStateCode && customerStateCode !== businessStateCode) {
      taxType = "IGST";
      igstAmount = Number(taxAmount.toFixed(2));
    } else {
      taxType = "CGST_SGST";
      cgstAmount = Number((taxAmount / 2).toFixed(2));
      sgstAmount = Number((taxAmount - cgstAmount).toFixed(2));
    }
  }

  return {
    ...item,
    quantity,
    pricePerUnit: rate,
    rate,
    discount,
    taxPercent,
    taxRate: taxPercent,
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxType,
    total: Number(totalAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

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

  loadSaleForEditing: async (id) => {
    const sale = await saleService.getById(id);

    set((state) => ({
      bills: state.bills.map((bill) => {
        if (bill.id !== state.activeBillId) return bill;

        const items: POSItem[] = sale.items.map((item) => {
          const product = typeof item.product === 'object' && item.product ? item.product : undefined;
          const productId = typeof item.product === 'string' ? item.product : product?._id || null;
          const itemType = item.itemType || (productId ? 'inventory' : 'non_stock_product');
          const rate = item.rate ?? item.unitPrice ?? 0;
          return calculatePOSItemAmounts({
            id: crypto.randomUUID(),
            productId,
            productRef: productId,
            batchId: item.batchId || null,
            selectedPriceType: item.selectedPriceType || null,
            priceLabel: item.selectedPriceType || '',
            mrp: item.mrp || rate,
            availableQty: item.availableQtyAtSale || 0,
            priceSelectionRequired: false,
            product,
            itemType,
            affectsInventory: item.affectsInventory ?? itemType === 'inventory',
            itemCode: item.sku || '',
            itemName: item.itemName || item.name || product?.name || 'Custom Item',
            name: item.name || item.itemName || product?.name || 'Custom Item',
            description: item.description || '',
            customItem: itemType !== 'inventory',
            quantity: item.quantity,
            unit: 'Pcs',
            pricePerUnit: rate,
            rate,
            purchasePrice: item.purchasePrice || 0,
            taxPercent: item.taxRate || item.gstRate || 0,
            taxRate: item.taxRate || item.gstRate || 0,
            taxableAmount: item.taxableAmount || 0,
            taxAmount: item.taxAmount || 0,
            total: item.totalAmount ?? item.total ?? 0,
            totalAmount: item.totalAmount ?? item.total ?? 0,
            discount: item.discount || 0,
            isInclusive: false,
            incomeLedger: item.incomeLedger || null,
          }, typeof sale.customer === 'object' && sale.customer ? sale.customer.stateCode : undefined, useBusinessStore.getState().profile?.stateCode);
        });

        return {
          ...bill,
          editingId: sale._id,
          customer: typeof sale.customer === 'object' && sale.customer ? sale.customer : WALK_IN_CUSTOMER,
          items: [...items, createPlaceholderItem()],
          selectedRowIndex: items.length,
          paymentMode: sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod === 'card' ? 'Card' : 'UPI',
          amountReceived: sale.amountPaid,
          remarks: sale.notes || '',
          cashBankAccountId: sale.cashBankAccountId || '',
          godownId: (sale.godownId as any)?._id || (sale.godownId as string) || undefined,
        };
      }),
    }));
  },

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
        productId: null,
        productRef: null,
        batchId: null,
        selectedPriceType: null,
        priceLabel: '',
        mrp: 0,
        availableQty: 0,
        priceSelectionRequired: false,
        itemType: 'inventory',
        affectsInventory: true,
        itemCode: '',
        itemName: '',
        name: '',
        description: '',
        customItem: false,
        quantity: 1,
        unit: 'Pcs',
        pricePerUnit: 0,
        rate: 0,
        purchasePrice: 0,
        taxPercent: 0,
        taxRate: 0,
        taxableAmount: 0,
        taxAmount: 0,
        total: 0,
        totalAmount: 0,
        discount: 0,
        isInclusive: false,
        incomeLedger: null,
        ...itemData,
      };

      const activeBill = state.bills.find(b => b.id === state.activeBillId);
      const customerStateCode = activeBill?.customer?.stateCode;
      const businessStateCode = useBusinessStore.getState().profile?.stateCode;

      const calculatedItem = calculatePOSItemAmounts(newItem, customerStateCode, businessStateCode);

      return {
        bills: state.bills.map((b) => {
          if (b.id !== state.activeBillId) return b;
          
          // Check if item already exists (if it's a product)
          if (calculatedItem.itemType === 'inventory' && calculatedItem.productId) {
            const existingIndex = b.items.findIndex(
              i => i.itemType === 'inventory'
                && i.productId === calculatedItem.productId
                && (i.batchId || null) === (calculatedItem.batchId || null)
            );
            if (existingIndex >= 0) {
              const items = [...b.items];
              const existing = items[existingIndex];
              items[existingIndex] = calculatePOSItemAmounts({
                ...existing,
                quantity: existing.quantity + 1,
              }, customerStateCode, businessStateCode);
              return { ...b, items, selectedRowIndex: existingIndex };
            }
          }
          
          return {
            ...b,
            items: [...b.items, calculatedItem],
            selectedRowIndex: b.items.length - 1, // Keep focus on the row we just added
          };
        })
      };
    });
  },

  updateItem: (id, updates) => {
    set((state) => {
      const activeBill = state.bills.find(b => b.id === state.activeBillId);
      const customerStateCode = activeBill?.customer?.stateCode;
      const businessStateCode = useBusinessStore.getState().profile?.stateCode;

      return {
        bills: state.bills.map((b) => {
          if (b.id !== state.activeBillId) return b;
          return {
            ...b,
            items: b.items.map((item) => {
              if (item.id !== id) return item;
              const updated = { ...item, ...updates };
              return calculatePOSItemAmounts(updated, customerStateCode, businessStateCode);
            })
          };
        })
      };
    });
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

      const customerStateCode = activeBill.customer?.stateCode;
      const businessStateCode = useBusinessStore.getState().profile?.stateCode;

      const calculatedItem = calculatePOSItemAmounts(updatedItem, customerStateCode, businessStateCode);

      const updatedItems = [...activeBill.items];
      updatedItems[itemIndex] = calculatedItem;

      let selectedIndex = itemIndex;
      if (calculatedItem.itemType === 'inventory' && calculatedItem.productId) {
        const duplicateIndex = updatedItems.findIndex(
          (i, idx) => idx !== itemIndex
            && i.itemType === 'inventory'
            && i.productId === calculatedItem.productId
            && (i.batchId || null) === (calculatedItem.batchId || null)
        );

        if (duplicateIndex >= 0) {
          const existing = updatedItems[duplicateIndex];
          const newQty = existing.quantity + calculatedItem.quantity;
          
          const mergedItem = calculatePOSItemAmounts({
            ...existing,
            quantity: newQty,
          }, customerStateCode, businessStateCode);

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
    set((state) => {
      const businessStateCode = useBusinessStore.getState().profile?.stateCode;
      
      return {
        bills: state.bills.map((b) => {
          if (b.id !== state.activeBillId) return b;
          
          // Re-calculate taxes for all items because customer changed
          const customerStateCode = customer?.stateCode;
          const updatedItems = b.items.map(item => 
            calculatePOSItemAmounts(item, customerStateCode, businessStateCode)
          );
          
          return { ...b, customer, items: updatedItems };
        })
      };
    });
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
