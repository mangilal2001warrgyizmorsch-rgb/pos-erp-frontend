import api from './api';

export const paymentOutService = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/payment-out', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/payment-out/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/payment-out', payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/payment-out/${id}`);
    return data;
  }
};
