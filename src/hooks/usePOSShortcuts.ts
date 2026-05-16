import { useCallback, useEffect, useRef } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Shortcut } from '@/types/shortcuts';

interface UsePOSShortcutsOptions {
  onFocusSearch?: () => void;
  onFocusCustomer?: () => void;
  onHoldSale?: () => void;
  onOpenPayment?: () => void;
  onCompleteSale?: () => void;
  onOpenCart?: () => void;
  onApplyDiscount?: () => void;
  onSelectCash?: () => void;
  onSelectCard?: () => void;
  onSelectUPI?: () => void;
  onPrintReceipt?: () => void;
  onNewSale?: () => void;
  onPrintInvoice?: () => void;
  onResumeSale?: () => void;
  onClearCart?: () => void;
  onAddProduct?: () => void;
  onIncreaseQuantity?: () => void;
  onDecreaseQuantity?: () => void;
  onRemoveItem?: () => void;
  onPaymentCash?: () => void;
  onPaymentUPI?: () => void;
  onPaymentBank?: () => void;
  onPaymentWallet?: () => void;
  onSplitPayment?: () => void;
}

/**
 * Custom hook to manage POS-specific shortcuts
 * Automatically activates the 'pos' scope on mount and deactivates on unmount
 */
export const usePOSShortcuts = (options: UsePOSShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();
  const optionsRef = useRef(options);

  // Update options ref whenever options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Activate POS scope
  useShortcutScope('pos');

  // Wrap handlers with ref-based execution
  const handleFocusSearch = useCallback(() => {
    optionsRef.current.onFocusSearch?.();
  }, []);

  const handleFocusCustomer = useCallback(() => {
    optionsRef.current.onFocusCustomer?.();
  }, []);

  const handleHoldSale = useCallback(() => {
    optionsRef.current.onHoldSale?.();
    toast.success('Sale held successfully');
  }, []);

  const handleOpenPayment = useCallback(() => {
    optionsRef.current.onOpenPayment?.();
  }, []);

  const handleCompleteSale = useCallback(() => {
    optionsRef.current.onCompleteSale?.();
    toast.success('Sale completed');
  }, []);

  const handleOpenCart = useCallback(() => {
    optionsRef.current.onOpenCart?.();
  }, []);

  const handleApplyDiscount = useCallback(() => {
    optionsRef.current.onApplyDiscount?.();
  }, []);

  const handleSelectCash = useCallback(() => {
    optionsRef.current.onSelectCash?.();
    toast.success('Cash payment selected');
  }, []);

  const handleSelectCard = useCallback(() => {
    optionsRef.current.onSelectCard?.();
    toast.success('Card payment selected');
  }, []);

  const handleSelectUPI = useCallback(() => {
    optionsRef.current.onSelectUPI?.();
    toast.success('UPI payment selected');
  }, []);

  const handlePrintReceipt = useCallback(() => {
    optionsRef.current.onPrintReceipt?.();
    toast.success('Printing receipt...');
  }, []);

  const handleNewSale = useCallback(() => {
    optionsRef.current.onNewSale?.();
    toast.success('New sale started');
  }, []);

  const handlePrintInvoice = useCallback(() => {
    optionsRef.current.onPrintInvoice?.();
    toast.success('Printing invoice...');
  }, []);

  const handleResumeSale = useCallback(() => {
    optionsRef.current.onResumeSale?.();
    toast.success('Sale resumed');
  }, []);

  const handleClearCart = useCallback(() => {
    optionsRef.current.onClearCart?.();
    toast.info('Cart cleared');
  }, []);

  const handleAddProduct = useCallback(() => {
    optionsRef.current.onAddProduct?.();
  }, []);

  const handleIncreaseQuantity = useCallback(() => {
    optionsRef.current.onIncreaseQuantity?.();
  }, []);

  const handleDecreaseQuantity = useCallback(() => {
    optionsRef.current.onDecreaseQuantity?.();
  }, []);

  const handleRemoveItem = useCallback(() => {
    optionsRef.current.onRemoveItem?.();
  }, []);

  const handlePaymentCash = useCallback(() => {
    optionsRef.current.onPaymentCash?.();
    toast.success('Cash payment selected');
  }, []);

  const handlePaymentUPI = useCallback(() => {
    optionsRef.current.onPaymentUPI?.();
    toast.success('UPI payment selected');
  }, []);

  const handlePaymentBank = useCallback(() => {
    optionsRef.current.onPaymentBank?.();
    toast.success('Bank/Card payment selected');
  }, []);

  const handlePaymentWallet = useCallback(() => {
    optionsRef.current.onPaymentWallet?.();
    toast.success('Wallet payment selected');
  }, []);

  const handleSplitPayment = useCallback(() => {
    optionsRef.current.onSplitPayment?.();
    toast.success('Split payment selected');
  }, []);

  // Register implementation handlers globally ONCE
  useEffect(() => {
    const posHandlers = {
      'pos.focusSearch': handleFocusSearch,
      'pos.focusCustomer': handleFocusCustomer,
      'pos.holdSale': handleHoldSale,
      'pos.openPayment': handleOpenPayment,
      'pos.completeSale': handleCompleteSale,
      'pos.openCart': handleOpenCart,
      'pos.applyDiscount': handleApplyDiscount,
      'pos.selectCash': handleSelectCash,
      'pos.selectCard': handleSelectCard,
      'pos.selectUPI': handleSelectUPI,
      'pos.printReceipt': handlePrintReceipt,
      'pos.newSale': handleNewSale,
      'pos.printInvoice': handlePrintInvoice,
      'pos.resumeSale': handleResumeSale,
      'pos.clearCart': handleClearCart,
      'pos.addProduct': handleAddProduct,
      'pos.increaseQuantity': handleIncreaseQuantity,
      'pos.decreaseQuantity': handleDecreaseQuantity,
      'pos.removeItem': handleRemoveItem,
      'pos.paymentCash': handlePaymentCash,
      'pos.paymentUPI': handlePaymentUPI,
      'pos.paymentBank': handlePaymentBank,
      'pos.paymentWallet': handlePaymentWallet,
      'pos.splitPayment': handleSplitPayment,
    };

    const shortcuts = createShortcuts(router, posHandlers);
    
    // Only register POS shortcuts
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('pos.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [router, registerShortcut, handleFocusSearch, handleFocusCustomer, handleHoldSale, handleOpenPayment, handleCompleteSale, handleOpenCart, handleApplyDiscount, handleSelectCash, handleSelectCard, handleSelectUPI, handlePrintReceipt, handleNewSale, handlePrintInvoice, handleResumeSale, handleClearCart, handleAddProduct, handleIncreaseQuantity, handleDecreaseQuantity, handleRemoveItem, handlePaymentCash, handlePaymentUPI, handlePaymentBank, handlePaymentWallet, handleSplitPayment]);

  return {
    handleFocusSearch,
    handleFocusCustomer,
    handleHoldSale,
    handleOpenPayment,
    handleCompleteSale,
    handleOpenCart,
    handleApplyDiscount,
    handleSelectCash,
    handleSelectCard,
    handleSelectUPI,
    handlePrintReceipt,
    handleNewSale,
    handlePrintInvoice,
    handleResumeSale,
    handleClearCart,
    handleAddProduct,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveItem,
    handlePaymentCash,
    handlePaymentUPI,
    handlePaymentBank,
    handlePaymentWallet,
    handleSplitPayment,
  };
};

export default usePOSShortcuts;
