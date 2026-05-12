import api from "./api";
import type { Notification, ApiResponse, Pagination } from "@/types";

export const notificationService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<{ data: Notification[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<Notification[]>>("/notifications", { params });
    return { data: data.data, pagination: data.pagination! };
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>("/notifications/unread-count");
    return data.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
