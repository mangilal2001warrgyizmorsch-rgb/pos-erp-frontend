import api from "./api";
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
    
    const { data } = await api.post<ApiResponse<{ imageUrl: string }>>(
      `/upload/single/${folder}`, 
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    
    // Construct the full URL
    // We expect backend to return relative path like "/uploads/products/image.jpg"
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace("/api", "");
    return `${baseUrl}${data.data.imageUrl}`;
  },

  /**
   * Upload multiple images to a specific folder
   */
  uploadMultiple: async (files: File[], folder: UploadFolder = 'others'): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    
    const { data } = await api.post<ApiResponse<{ imageUrl: string }[]>>(
      `/upload/multiple/${folder}`, 
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace("/api", "");
    return data.data.map((item) => `${baseUrl}${item.imageUrl}`);
  },

  /**
   * Legacy wrapper for backward compatibility if needed
   */
  uploadImage: async (file: File): Promise<string> => {
    return uploadService.uploadSingle(file, 'others');
  }
};
