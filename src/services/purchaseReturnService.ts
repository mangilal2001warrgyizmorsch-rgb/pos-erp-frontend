import { PurchaseReturnModel, Pagination, ApiResponse } from "@/types";
import api from "./api";

export const purchaseReturnService = {
  // Get all purchase returns / debit notes
  getAll: async (params?: any): Promise<ApiResponse<PurchaseReturnModel[]>> => {
    const { data } = await api.get("/purchases-returns", { params });
    return data;
  },

  // Get single purchase return / debit note
  getById: async (id: string): Promise<PurchaseReturnModel> => {
    const { data } = await api.get(`/purchases-returns/${id}`);
    return data.data;
  },

  // Create new purchase return / debit note
  create: async (payload: any): Promise<PurchaseReturnModel> => {
    const { data } = await api.post("/purchases-returns", payload);
    return data.data;
  },

  // Update purchase return / debit note
  update: async (id: string, payload: any): Promise<PurchaseReturnModel> => {
    const { data } = await api.put(`/purchases-returns/${id}`, payload);
    return data.data;
  },

  // Delete purchase return / debit note
  delete: async (id: string): Promise<void> => {
    await api.delete(`/purchases-returns/${id}`);
  },

  // Cancel purchase return / debit note
  cancel: async (id: string): Promise<PurchaseReturnModel> => {
    const { data } = await api.post(`/purchases-returns/${id}/cancel`);
    return data.data;
  },

  // Get unreturned purchases for a supplier
  getUnreturnedPurchasesForSupplier: async (supplierId: string) => {
    const { data } = await api.get(`/purchases-returns/supplier/${supplierId}/unreturned`);
    return data.data;
  },

  // Get returnable items from a purchase bill
  getReturnableItemsFromBill: async (billId: string) => {
    const { data } = await api.get(`/purchases-returns/bill/${billId}/returnable-items`);
    return data.data;
  },
};
