/**
 * usePartiesShortcuts Hook
 * Handles all Parties (Customers/Suppliers) module shortcuts
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UsePartiesShortcutsOptions {
  onAddNew?: () => void;
  onSearch?: () => void;
  onEdit?: () => void;
  onOpenDetails?: () => void;
  onLedger?: () => void;
  onRecordPayment?: () => void;
}

export const usePartiesShortcuts = (options: UsePartiesShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();

  // Activate parties scope
  useShortcutScope('parties');

  const handleAddNew = useCallback(() => {
    options.onAddNew?.();
    toast.success('New party form opened');
  }, [options]);

  const handleSearch = useCallback(() => {
    options.onSearch?.();
  }, [options]);

  const handleEdit = useCallback(() => {
    options.onEdit?.();
    toast.success('Edit mode activated');
  }, [options]);

  const handleOpenDetails = useCallback(() => {
    options.onOpenDetails?.();
  }, [options]);

  const handleLedger = useCallback(() => {
    options.onLedger?.();
    toast.success('Opening party ledger...');
  }, [options]);

  const handleRecordPayment = useCallback(() => {
    options.onRecordPayment?.();
    toast.success('Payment recording form opened');
  }, [options]);

  // Register implementation handlers globally
  useEffect(() => {
    const partiesHandlers = {
      'parties.addNew': handleAddNew,
      'parties.search': handleSearch,
      'parties.edit': handleEdit,
      'parties.openDetails': handleOpenDetails,
      'parties.ledger': handleLedger,
      'parties.recordPayment': handleRecordPayment,
    };

    const shortcuts = createShortcuts(router, partiesHandlers);
    
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('parties.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [
    router, registerShortcut, 
    handleAddNew, handleSearch, handleEdit, handleOpenDetails, handleLedger, handleRecordPayment
  ]);

  return {
    handleAddNew,
    handleSearch,
    handleEdit,
    handleOpenDetails,
    handleLedger,
    handleRecordPayment,
  };
};

export default usePartiesShortcuts;
