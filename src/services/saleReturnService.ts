import { SaleReturn, Pagination, ApiResponse } from "@/types";
import api from "./api";

export const saleReturnService = {
  // Get all sale returns / credit notes
  getAll: async (params?: any): Promise<ApiResponse<SaleReturn[]>> => {
    const { data } = await api.get("/sales-returns", { params });
    return data;
  },

  // Get single sale return / credit note
  getById: async (id: string): Promise<SaleReturn> => {
    const { data } = await api.get(`/sales-returns/${id}`);
    return data.data;
  },

  // Create new sale return / credit note
  create: async (payload: any): Promise<SaleReturn> => {
    const { data } = await api.post("/sales-returns", payload);
    return data.data;
  },

  // Update sale return / credit note
  update: async (id: string, payload: any): Promise<SaleReturn> => {
    const { data } = await api.put(`/sales-returns/${id}`, payload);
    return data.data;
  },

  // Cancel sale return / credit note
  cancel: async (id: string): Promise<SaleReturn> => {
    const { data } = await api.post(`/sales-returns/${id}/cancel`);
    return data.data;
  },

  // Get unreturned sales for a customer
  getUnreturnedSalesForCustomer: async (customerId: string) => {
    const { data } = await api.get(`/sales-returns/customer/${customerId}/unreturned`);
    return data.data;
  },

  // Get returnable items from a sale invoice
  getReturnableItemsFromInvoice: async (invoiceId: string) => {
    const { data } = await api.get(`/sales-returns/invoice/${invoiceId}/returnable-items`);
    return data.data;
  },
};
