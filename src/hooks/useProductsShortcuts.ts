import { useCallback, useEffect } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseProductsShortcutsOptions {
  onAddNew?: () => void;
  onSearch?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUploadImage?: () => void;
  onGenerateBarcode?: () => void;
}

export const useProductsShortcuts = (options: UseProductsShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();

  // Activate products scope
  useShortcutScope('products');

  const handleAddNew = useCallback(() => {
    options.onAddNew?.();
    toast.success('New product form opened');
  }, [options]);

  const handleSearch = useCallback(() => {
    options.onSearch?.();
  }, [options]);

  const handleEdit = useCallback(() => {
    options.onEdit?.();
    toast.success('Edit mode activated');
  }, [options]);

  const handleDelete = useCallback(() => {
    options.onDelete?.();
  }, [options]);

  const handleUploadImage = useCallback(() => {
    options.onUploadImage?.();
  }, [options]);

  const handleGenerateBarcode = useCallback(() => {
    options.onGenerateBarcode?.();
    toast.success('Generating barcode...');
  }, [options]);

  // Register implementation handlers globally
  useEffect(() => {
    const productsHandlers = {
      'products.addNew': handleAddNew,
      'products.search': handleSearch,
      'products.edit': handleEdit,
      'products.delete': handleDelete,
      'products.uploadImage': handleUploadImage,
      'products.generateBarcode': handleGenerateBarcode,
    };

    const shortcuts = createShortcuts(router, productsHandlers);
    
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('products.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [
    router, registerShortcut, 
    handleAddNew, handleSearch, handleEdit, handleDelete,
    handleUploadImage, handleGenerateBarcode
  ]);

  return {
    handleAddNew,
    handleSearch,
    handleEdit,
    handleDelete,
    handleUploadImage,
    handleGenerateBarcode,
  };
};

export default useProductsShortcuts;
