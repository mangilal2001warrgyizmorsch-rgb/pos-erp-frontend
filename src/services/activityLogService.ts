import api from "./api";
import type { ActivityLog, ApiResponse, Pagination } from "@/types";

export const activityLogService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    user?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: ActivityLog[]; pagination: Pagination }> => {
    const { data } = await api.get<ApiResponse<ActivityLog[]>>("/activity-logs", { params });
    return { data: data.data, pagination: data.pagination! };
  },
};
