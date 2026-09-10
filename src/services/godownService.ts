import api from './api';
import { Godown, ApiResponse } from '../types';

export const godownService = {
  getAllGodowns: async (): Promise<ApiResponse<Godown[]>> => {
    const response = await api.get('/godowns');
    return response.data;
  },

  getGodownById: async (id: string): Promise<ApiResponse<Godown>> => {
    const response = await api.get(`/godowns/${id}`);
    return response.data;
  },

  createGodown: async (data: Partial<Godown>): Promise<ApiResponse<Godown>> => {
    const response = await api.post('/godowns', data);
    return response.data;
  },

  updateGodown: async (id: string, data: Partial<Godown>): Promise<ApiResponse<Godown>> => {
    const response = await api.put(`/godowns/${id}`, data);
    return response.data;
  },

  deleteGodown: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/godowns/${id}`);
    return response.data;
  }
};
