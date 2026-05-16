import { useCallback, useEffect } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UsePurchaseShortcutsOptions {
  onFocusSearch?: () => void;
  onSelectSupplier?: () => void;
  onAddProduct?: () => void;
  onAddCharges?: () => void;
  onSubmitPurchase?: () => void;
  onSavePurchase?: () => void;
  onPrintBill?: () => void;
  onNewPurchase?: () => void;
  onRemoveItem?: () => void;
}

export const usePurchaseShortcuts = (options: UsePurchaseShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();

  // Activate purchase scope
  useShortcutScope('purchase');

  const handleFocusSearch = useCallback(() => {
    options.onFocusSearch?.();
  }, [options]);

  const handleSelectSupplier = useCallback(() => {
    options.onSelectSupplier?.();
  }, [options]);

  const handleAddProduct = useCallback(() => {
    options.onAddProduct?.();
    toast.success('New product row added');
  }, [options]);

  const handleAddCharges = useCallback(() => {
    options.onAddCharges?.();
    toast.success('Extra charges section opened');
  }, [options]);

  const handleSubmitPurchase = useCallback(() => {
    options.onSubmitPurchase?.();
    toast.success('Purchase submitted');
  }, [options]);

  const handleSavePurchase = useCallback(() => {
    options.onSavePurchase?.();
    toast.success('Purchase saved');
  }, [options]);

  const handlePrintBill = useCallback(() => {
    options.onPrintBill?.();
    toast.success('Printing purchase bill...');
  }, [options]);

  const handleNewPurchase = useCallback(() => {
    options.onNewPurchase?.();
    toast.success('New purchase bill created');
  }, [options]);

  const handleRemoveItem = useCallback(() => {
    options.onRemoveItem?.();
  }, [options]);

  // Register implementation handlers globally
  useEffect(() => {
    const purchaseHandlers = {
      'purchase.focusSearch': handleFocusSearch,
      'purchase.selectSupplier': handleSelectSupplier,
      'purchase.addProduct': handleAddProduct,
      'purchase.addCharges': handleAddCharges,
      'purchase.submitPurchase': handleSubmitPurchase,
      'purchase.savePurchase': handleSavePurchase,
      'purchase.printBill': handlePrintBill,
      'purchase.newPurchase': handleNewPurchase,
      'purchase.removeItem': handleRemoveItem,
    };

    const shortcuts = createShortcuts(router, purchaseHandlers);
    
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('purchase.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [
    router, registerShortcut, 
    handleFocusSearch, handleSelectSupplier, handleAddProduct, handleAddCharges,
    handleSubmitPurchase, handleSavePurchase, handlePrintBill, handleNewPurchase,
    handleRemoveItem
  ]);

  return {
    handleFocusSearch,
    handleSelectSupplier,
    handleAddProduct,
    handleAddCharges,
    handleSubmitPurchase,
    handleSavePurchase,
    handlePrintBill,
    handleNewPurchase,
    handleRemoveItem,
  };
};

export default usePurchaseShortcuts;
