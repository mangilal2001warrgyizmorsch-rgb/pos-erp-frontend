import { create } from "zustand";
import type { Product, CartItem, Customer } from "@/types";

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  taxRate: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  paymentMethod: "cash" | "card" | "upi";
  amountPaid: number;
  notes: string;

  // Computed
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalAmount: number;
  changeAmount: number;

  // Actions
  addItem: (product: Product, pricing: { salesPrice: number, purchasePrice: number, batchNo?: string, taxRate: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setTaxRate: (rate: number) => void;
  setDiscount: (type: "percentage" | "fixed", value: number) => void;
  setPaymentMethod: (method: "cash" | "card" | "upi") => void;
  setAmountPaid: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  recalculate: () => void;
}

const calculateTotals = (
  items: CartItem[],
  taxRate: number,
  discountType: "percentage" | "fixed",
  discountValue: number,
  amountPaid: number,
  customer: Customer | null
) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const afterDiscount = subtotal - discountAmount;
  
  // GST Logic: Split tax if local, full IGST if inter-state
  const SHOP_STATE_CODE = "27"; 
  const isLocal = !customer || !customer.stateCode || customer.stateCode === SHOP_STATE_CODE;
  
  // Calculate per-item tax and return updated items
  const updatedItems = items.map(item => {
    const itemTax = (item.total * (item.taxRate || 0)) / 100;
    return {
      ...item,
      cgst: isLocal ? itemTax / 2 : 0,
      sgst: isLocal ? itemTax / 2 : 0,
      igst: isLocal ? 0 : itemTax,
    };
  });

  const taxAmount = (afterDiscount * taxRate) / 100;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  if (isLocal) {
    totalCgst = taxAmount / 2;
    totalSgst = taxAmount / 2;
  } else {
    totalIgst = taxAmount;
  }

  const totalAmount = afterDiscount + taxAmount;
  const changeAmount = Math.max(0, amountPaid - totalAmount);

  return { items: updatedItems, subtotal, discountAmount, taxAmount, totalCgst, totalSgst, totalIgst, totalAmount, changeAmount };
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  taxRate: 0,
  discountType: "fixed",
  discountValue: 0,
  paymentMethod: "cash",
  amountPaid: 0,
  notes: "",
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalCgst: 0,
  totalSgst: 0,
  totalIgst: 0,
  totalAmount: 0,
  changeAmount: 0,

  addItem: (product, pricing) => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (item) => item.product._id === product._id
    );

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = state.items.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * item.unitPrice,
            }
          : item
      );
    } else {
      newItems = [
        ...state.items,
        {
          product,
          quantity: 1,
          unitPrice: pricing.salesPrice,
          purchasePrice: pricing.purchasePrice,
          taxRate: pricing.taxRate,
          total: pricing.salesPrice,
          batchNo: pricing.batchNo,
        },
      ];
    }

    const totals = calculateTotals(
      newItems,
      state.taxRate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      state.customer
    );
    set({ ...totals });
  },

  removeItem: (productId) => {
    const state = get();
    const newItems = state.items.filter(
      (item) => item.product._id !== productId
    );
    const totals = calculateTotals(
      newItems,
      state.taxRate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      state.customer
    );
    set({ ...totals });
  },

  updateQuantity: (productId, quantity) => {
    const state = get();
    if (quantity <= 0) {
      const newItems = state.items.filter(
        (item) => item.product._id !== productId
      );
      const totals = calculateTotals(
        newItems,
        state.taxRate,
        state.discountType,
        state.discountValue,
        state.amountPaid,
        state.customer
      );
      set({ ...totals });
      return;
    }

    const newItems = state.items.map((item) =>
      item.product._id === productId
        ? { ...item, quantity, total: quantity * item.unitPrice }
        : item
    );
    const totals = calculateTotals(
      newItems,
      state.taxRate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      state.customer
    );
    set({ ...totals });
  },

  setCustomer: (customer) => {
    const state = get();
    const totals = calculateTotals(
      state.items,
      state.taxRate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      customer
    );
    set({ customer, ...totals });
  },

  setTaxRate: (rate) => {
    const state = get();
    const totals = calculateTotals(
      state.items,
      rate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      state.customer
    );
    set({ taxRate: rate, ...totals });
  },

  setDiscount: (type, value) => {
    const state = get();
    const totals = calculateTotals(
      state.items,
      state.taxRate,
      type,
      value,
      state.amountPaid,
      state.customer
    );
    set({ discountType: type, discountValue: value, ...totals });
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setAmountPaid: (amount) => {
    const state = get();
    const totals = calculateTotals(
      state.items,
      state.taxRate,
      state.discountType,
      state.discountValue,
      amount,
      state.customer
    );
    set({ amountPaid: amount, ...totals });
  },

  setNotes: (notes) => set({ notes }),

  clearCart: () => {
    set({
      items: [],
      customer: null,
      taxRate: 0,
      discountType: "fixed",
      discountValue: 0,
      paymentMethod: "cash",
      amountPaid: 0,
      notes: "",
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalAmount: 0,
      changeAmount: 0,
    });
  },

  recalculate: () => {
    const state = get();
    const totals = calculateTotals(
      state.items,
      state.taxRate,
      state.discountType,
      state.discountValue,
      state.amountPaid,
      state.customer
    );
    set(totals);
  },
}));
