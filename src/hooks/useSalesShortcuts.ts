import { useCallback, useEffect } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseSalesShortcutsOptions {
  onFocusSearch?: () => void;
  onSelectCustomer?: () => void;
  onAddItem?: () => void;
  onPaymentSection?: () => void;
  onSaveInvoice?: () => void;
  onGenerateInvoice?: () => void;
  onPrintInvoice?: () => void;
  onNewInvoice?: () => void;
  onHoldInvoice?: () => void;
}

export const useSalesShortcuts = (options: UseSalesShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();

  // Activate sales scope
  useShortcutScope('sales');

  const handleFocusSearch = useCallback(() => {
    options.onFocusSearch?.();
  }, [options]);

  const handleSelectCustomer = useCallback(() => {
    options.onSelectCustomer?.();
  }, [options]);

  const handleAddItem = useCallback(() => {
    options.onAddItem?.();
    toast.success('New item row added');
  }, [options]);

  const handlePaymentSection = useCallback(() => {
    options.onPaymentSection?.();
  }, [options]);

  const handleSaveInvoice = useCallback(() => {
    options.onSaveInvoice?.();
    toast.success('Invoice saved');
  }, [options]);

  const handleGenerateInvoice = useCallback(() => {
    options.onGenerateInvoice?.();
    toast.success('Invoice generated');
  }, [options]);

  const handlePrintInvoice = useCallback(() => {
    options.onPrintInvoice?.();
    toast.success('Printing invoice...');
  }, [options]);

  const handleNewInvoice = useCallback(() => {
    options.onNewInvoice?.();
    toast.success('New invoice created');
  }, [options]);

  const handleHoldInvoice = useCallback(() => {
    options.onHoldInvoice?.();
    toast.success('Invoice held for later');
  }, [options]);

  // Register implementation handlers globally
  useEffect(() => {
    const salesHandlers = {
      'sales.focusSearch': handleFocusSearch,
      'sales.selectCustomer': handleSelectCustomer,
      'sales.addItem': handleAddItem,
      'sales.paymentSection': handlePaymentSection,
      'sales.saveInvoice': handleSaveInvoice,
      'sales.generateInvoice': handleGenerateInvoice,
      'sales.printInvoice': handlePrintInvoice,
      'sales.newInvoice': handleNewInvoice,
      'sales.holdInvoice': handleHoldInvoice,
    };

    const shortcuts = createShortcuts(router, salesHandlers);
    
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('sales.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [
    router, registerShortcut, 
    handleFocusSearch, handleSelectCustomer, handleAddItem, handlePaymentSection,
    handleSaveInvoice, handleGenerateInvoice, handlePrintInvoice, handleNewInvoice,
    handleHoldInvoice
  ]);

  return {
    handleFocusSearch,
    handleSelectCustomer,
    handleAddItem,
    handlePaymentSection,
    handleSaveInvoice,
    handleGenerateInvoice,
    handlePrintInvoice,
    handleNewInvoice,
    handleHoldInvoice,
  };
};

export default useSalesShortcuts;
