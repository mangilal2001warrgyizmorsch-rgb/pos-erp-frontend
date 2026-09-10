import api from "./api";

export interface Campaign {
  _id: string;
  name: string;
  messageTemplate: string;
  mediaUrl?: string;
  targetAudience: string;
  status: "draft" | "scheduled" | "processing" | "completed" | "failed";
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdAt: string;
}

export interface CampaignLog {
  _id: string;
  customerId: { _id: string; name: string; phone: string };
  phone: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  errorMessage?: string;
  createdAt: string;
}

export const marketingService = {
  getCampaigns: async (): Promise<{ success: boolean; data: Campaign[] }> => {
    const { data } = await api.get("/marketing/campaigns");
    return data;
  },
  
  createCampaign: async (payload: Partial<Campaign>): Promise<{ success: boolean; data: Campaign }> => {
    const { data } = await api.post("/marketing/campaigns", payload);
    return data;
  },

  getCampaignLogs: async (id: string): Promise<{ success: boolean; data: CampaignLog[] }> => {
    const { data } = await api.get(`/marketing/campaigns/${id}/logs`);
    return data;
  },

  deleteCampaign: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete(`/marketing/campaigns/${id}`);
    return data;
  }
};
