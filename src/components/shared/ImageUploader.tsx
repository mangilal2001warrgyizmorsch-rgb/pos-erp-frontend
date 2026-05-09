"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, X, ImageIcon, Loader2, Plus } from "lucide-react";
import { uploadService, type UploadFolder } from "@/services/uploadService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  folder?: UploadFolder;
  maxFiles?: number;
  className?: string;
}

export function ImageUploader({ 
  value, 
  onChange, 
  multiple = false, 
  folder = 'others',
  maxFiles = 5,
  className 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize previews from value
  useEffect(() => {
    if (value) {
      setPreviews(Array.isArray(value) ? value : [value]);
    } else {
      setPreviews([]);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files for multiple upload
    if (multiple && previews.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images`);
      return;
    }

    try {
      setUploading(true);
      if (multiple) {
        const urls = await uploadService.uploadMultiple(files, folder);
        const newUrls = Array.isArray(value) ? [...value, ...urls] : urls;
        onChange(newUrls);
      } else {
        const url = await uploadService.uploadSingle(files[0], folder);
        onChange(url);
      }
      toast.success("Uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter((_, i) => i !== indexToRemove);
      onChange(newValues);
    } else {
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex flex-wrap gap-4">
        {/* Render Previews */}
        {previews.map((url, i) => (
          <div 
            key={i} 
            className="relative group w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-muted bg-muted/50 transition-all hover:border-primary/50 shadow-sm"
          >
            <img 
              src={url} 
              alt={`Preview ${i}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Error';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-lg"
                onClick={() => removeImage(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Upload Trigger */}
        {(multiple ? previews.length < maxFiles : previews.length === 0) && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              "w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden relative",
              uploading 
                ? "bg-muted/30 border-muted cursor-not-allowed" 
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 shadow-sm"
            )}
          >
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              multiple={multiple}
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center animate-in fade-in duration-300">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary mb-1" />
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Uploading</span>
              </div>
            ) : (
              <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full mb-1 group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground group-hover:text-primary">Add Image</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!multiple && previews.length === 0 && !uploading && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
          <ImageIcon className="h-3 w-3" />
          Recommended: square JPG, PNG or WEBP up to 5MB
        </p>
      )}
    </div>
  );
}
