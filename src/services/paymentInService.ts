import api from './api';

export const paymentInService = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/payment-in', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/payment-in/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/payment-in', payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/payment-in/${id}`);
    return data;
  }
};
