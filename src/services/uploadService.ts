import api from "./api";
import { API_BASE_URL } from "@/constants";
import type { ApiResponse } from "@/types";

export type UploadFolder = 
  | 'products' 
  | 'categories' 
  | 'subcategories' 
  | 'profiles' 
  | 'brands' 
  | 'settings' 
  | 'others';

export const uploadService = {
  /**
   * Upload a single image to a specific folder
   */
  uploadSingle: async (file: File, folder: UploadFolder = 'others'): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const { data } = await api.post<ApiResponse<{ imageUrl: string }>>(
        `/upload/single/${folder}`, 
        formData
      );
      
      // Construct the full URL
      const baseUrl = API_BASE_URL.replace("/api", "");
      return `${baseUrl}${data.data.imageUrl}`;
    } catch (error: any) {
      console.error("Upload error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
        folder: folder,
      });
      throw error;
    }
  },

  /**
   * Upload multiple images to a specific folder
   */
  uploadMultiple: async (files: File[], folder: UploadFolder = 'others'): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    
    const { data } = await api.post<ApiResponse<{ imageUrl: string }[]>>(
      `/upload/multiple/${folder}`, 
      formData
    );
    
    const baseUrl = API_BASE_URL.replace("/api", "");
    return data.data.map((item) => `${baseUrl}${item.imageUrl}`);
  },

  /**
   * Legacy wrapper for backward compatibility if needed
   */
  uploadImage: async (file: File): Promise<string> => {
    return uploadService.uploadSingle(file, 'others');
  }
};
