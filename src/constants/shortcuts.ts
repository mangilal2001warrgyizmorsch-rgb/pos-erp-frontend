/**
 * Global Keyboard Shortcuts Configuration
 * Centralized configuration for all keyboard shortcuts in the POS ERP app
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Shortcut, ShortcutConfig } from '@/types/shortcuts';

/**
 * Normalize key name for cross-platform compatibility
 */
export const normalizeKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'Enter': 'Enter',
    'Escape': 'Escape',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
  };
  
  if (!key) return '';
  
  // Handle F-keys
  if (key.startsWith('F') && /^F\d+$/.test(key)) {
    return key;
  }
  
  return keyMap[key] || key.toUpperCase();
};

/**
 * Format key combination for display
 * E.g., { key: 'k', modifiers: ['cmd'] } -> "Cmd+K"
 */
export const formatKeyCombo = (keyCombo: any): string => {
  const modifiers = (keyCombo.modifiers || []).map((m: string) => {
    if (m === 'cmd') return 'Cmd';
    if (m === 'ctrl') return 'Ctrl';
    if (m === 'shift') return 'Shift';
    if (m === 'alt') return 'Alt';
    return m;
  });
  
  const key = normalizeKey(keyCombo.key);
  
  if (modifiers.length === 0) {
    return key;
  }
  
  return `${modifiers.join('+')}+${key}`;
};

/**
 * Format key combo for user display (Mac vs Windows)
 */
export const getDisplayKeys = (keyCombo: any): string => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const modifiers = (keyCombo.modifiers || []).map((m: string) => {
    if (m === 'cmd' || m === 'ctrl') {
      return isMac ? '⌘' : 'Ctrl';
    }
    if (m === 'shift') return 'Shift';
    if (m === 'alt') return isMac ? '⌥' : 'Alt';
    return m;
  });
  
  const key = normalizeKey(keyCombo.key);
  
  if (modifiers.length === 0) {
    return key;
  }
  
  return `${modifiers.join('')}${key}`;
};

/**
 * Check if a keyboard event matches a key combo
 */
export const isKeyComboMatch = (event: KeyboardEvent, keyCombo: any): boolean => {
  // More robust Mac detection
  const isMac = typeof window !== 'undefined' && 
    (/Mac|iPhone|iPod|iPad/.test(navigator.platform) || 
     ((navigator as any).userAgentData && (navigator as any).userAgentData.platform === 'macOS') ||
     /Macintosh/.test(navigator.userAgent));
  
  // Check main key
  const normalizedEventKey = normalizeKey(event.key);
  const normalizedComboKey = normalizeKey(keyCombo.key);
  
  if (normalizedEventKey !== normalizedComboKey) {
    return false;
  }
  
  // Check modifiers
  const requiredModifiers = keyCombo.modifiers || [];
  
  // Normalized modifier checks
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;
  const hasCtrl = event.ctrlKey;
  const hasMeta = event.metaKey;
  
  // On Mac, we usually treat Cmd as Ctrl for shortcuts, but let's be flexible
  const hasCtrlOrCmd = hasCtrl || hasMeta;
  
  const expectsShift = requiredModifiers.includes('shift');
  const expectsAlt = requiredModifiers.includes('alt');
  const expectsCtrl = requiredModifiers.includes('ctrl');
  const expectsCmd = requiredModifiers.includes('cmd');
  const expectsCtrlOrCmd = expectsCtrl || expectsCmd;

  // Strict modifier matching
  if (hasShift !== expectsShift) return false;
  if (hasAlt !== expectsAlt) return false;
  
  // On Mac, either Ctrl or Cmd can satisfy a 'ctrl' or 'cmd' requirement 
  // to be more user-friendly and robust against platform differences
  if (isMac) {
    if (expectsCtrlOrCmd && !hasCtrlOrCmd) return false;
    if (!expectsCtrlOrCmd && hasCtrlOrCmd) return false;
  } else {
    // On Windows/Linux, be stricter about Ctrl vs Meta (Win key)
    if (expectsCtrl && !hasCtrl) return false;
    if (expectsCmd && !hasMeta) return false;
    if (!expectsCtrl && hasCtrl) return false;
    if (!expectsCmd && hasMeta) return false;
  }
  
  return true;
};

/**
 * Check if an element is an input field where we should not trigger shortcuts
 */
export const isInputElement = (element: Element | null): boolean => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const contentEditable = (element as HTMLElement).contentEditable === 'true';
  
  // Don't trigger shortcuts when in input, textarea, select, or contenteditable
  if (['input', 'textarea', 'select'].includes(tagName) || contentEditable) {
    // However, allow shortcuts in specific input types that need them
    if (tagName === 'input') {
      const inputType = (element as HTMLInputElement).type.toLowerCase();
      // These input types should not trigger shortcuts
      if (['text', 'email', 'password', 'search', 'url'].includes(inputType)) {
        return true;
      }
      // Allow shortcuts for button, checkbox, radio, etc.
      return false;
    }
    return true;
  }
  
  return false;
};

/**
 * Check if specific input field should allow shortcuts
 * (e.g., barcode scanner input in POS)
 */
export const shouldAllowShortcutInInput = (element: Element | null, shortcutId: string): boolean => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  if (tagName !== 'input') return false;
  
  const inputElement = element as HTMLInputElement;
  const inputType = inputElement.type.toLowerCase();
  
  // In POS context, allow specific shortcuts in barcode/search inputs
  if (shortcutId.includes('barcode') || shortcutId.includes('search')) {
    return inputType === 'text' || inputType === 'search';
  }
  
  return false;
};

/**
 * Create default shortcuts configuration
 * This is a factory function so it can use router hooks
 */
export const createShortcuts = (
  router: ReturnType<typeof useRouter>,
  handlers: Record<string, () => void | Promise<void>> = {}
): ShortcutConfig => {
  return {
    // Global Navigation
    'global.commandPalette': {
      id: 'global.commandPalette',
      name: 'Command Palette',
      description: 'Open global search and command palette',
      keys: { key: 'k', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => handlers['global.commandPalette']?.(),
      preventDefault: true,
      stopPropagation: true,
    },
    
    'global.dashboard': {
      id: 'global.dashboard',
      name: 'Dashboard',
      description: 'Navigate to Dashboard',
      keys: { key: 'd', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/dashboard'),
      preventDefault: true,
    },
    
    'global.pos': {
      id: 'global.pos',
      name: 'POS Billing',
      description: 'Navigate to POS Billing',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/pos'),
      preventDefault: true,
    },
    
    'global.products': {
      id: 'global.products',
      name: 'Products',
      description: 'Navigate to Products',
      keys: { key: 'i', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/inventory'),
      preventDefault: true,
    },
    
    'global.sales': {
      id: 'global.sales',
      name: 'Sales',
      description: 'Navigate to Sales',
      keys: { key: 's', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/sales'),
      preventDefault: true,
    },
    
    'global.purchase': {
      id: 'global.purchase',
      name: 'Purchase',
      description: 'Navigate to Purchase Bills',
      keys: { key: 'b', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/purchase'),
      preventDefault: true,
    },
    
    'global.reports': {
      id: 'global.reports',
      name: 'Reports',
      description: 'Navigate to Reports',
      keys: { key: 'r', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/reports'),
      preventDefault: true,
    },
    
    'global.expenses': {
      id: 'global.expenses',
      name: 'Expenses',
      description: 'Navigate to Expenses',
      keys: { key: 'e', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/expenses'),
      preventDefault: true,
    },
    
    'global.settings': {
      id: 'global.settings',
      name: 'Settings',
      description: 'Navigate to Settings',
      keys: { key: ',', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => router.push('/settings'),
      preventDefault: true,
    },
    
    // Utility
    'global.help': {
      id: 'global.help',
      name: 'Keyboard Shortcuts Help',
      description: 'Open keyboard shortcuts help modal',
      keys: { key: '/', modifiers: ['ctrl'] },
      scope: 'global',
      action: () => handlers['global.help']?.(),
      preventDefault: true,
      stopPropagation: true,
    },
    
    'global.closeModal': {
      id: 'global.closeModal',
      name: 'Close Modal',
      description: 'Close active modal or drawer',
      keys: { key: 'Escape' },
      scope: 'global',
      action: () => handlers['global.closeModal']?.(),
    },
    
    'global.toggleTheme': {
      id: 'global.toggleTheme',
      name: 'Toggle Theme',
      description: 'Toggle between light and dark theme',
      keys: { key: 't', modifiers: ['ctrl', 'shift'] },
      scope: 'global',
      action: () => handlers['global.toggleTheme']?.(),
      preventDefault: true,
    },
    
    'global.toggleSidebar': {
      id: 'global.toggleSidebar',
      name: 'Toggle Sidebar',
      description: 'Toggle sidebar visibility',
      keys: { key: 'b', modifiers: ['ctrl', 'shift'] },
      scope: 'global',
      action: () => handlers['global.toggleSidebar']?.(),
      preventDefault: true,
    },
    
    // POS Billing Shortcuts
    'pos.focusSearch': {
      id: 'pos.focusSearch',
      name: 'Focus Product Search',
      description: 'Focus product search field in POS',
      keys: { key: 'F1' },
      scope: 'pos',
      action: () => handlers['pos.focusSearch']?.(),
      preventDefault: true,
    },
    
    'pos.focusCustomer': {
      id: 'pos.focusCustomer',
      name: 'Focus Customer Search',
      description: 'Focus customer search field in POS',
      keys: { key: 'F2' },
      scope: 'pos',
      action: () => handlers['pos.focusCustomer']?.(),
      preventDefault: true,
    },
    
    'pos.holdSale': {
      id: 'pos.holdSale',
      name: 'Hold Sale',
      description: 'Hold / Park current sale',
      keys: { key: 'F3' },
      scope: 'pos',
      action: () => handlers['pos.holdSale']?.(),
      preventDefault: true,
    },
    
    'pos.openPayment': {
      id: 'pos.openPayment',
      name: 'Open Payment Section',
      description: 'Open payment section',
      keys: { key: 'F4' },
      scope: 'pos',
      action: () => handlers['pos.openPayment']?.(),
      preventDefault: true,
    },
    
    'pos.completeSale': {
      id: 'pos.completeSale',
      name: 'Complete Sale',
      description: 'Complete the current sale',
      keys: { key: 'F5' },
      scope: 'pos',
      action: () => handlers['pos.completeSale']?.(),
      preventDefault: true,
    },
    
    'pos.openCart': {
      id: 'pos.openCart',
      name: 'Open Cart Drawer',
      description: 'Open or close cart drawer',
      keys: { key: 'F6' },
      scope: 'pos',
      action: () => handlers['pos.openCart']?.(),
      preventDefault: true,
    },
    
    'pos.applyDiscount': {
      id: 'pos.applyDiscount',
      name: 'Apply Discount',
      description: 'Apply discount to cart',
      keys: { key: 'F7' },
      scope: 'pos',
      action: () => handlers['pos.applyDiscount']?.(),
      preventDefault: true,
    },
    
    'pos.selectCash': {
      id: 'pos.selectCash',
      name: 'Select Cash Payment',
      description: 'Select cash payment method',
      keys: { key: 'F8' },
      scope: 'pos',
      action: () => handlers['pos.selectCash']?.(),
      preventDefault: true,
    },
    
    'pos.selectCard': {
      id: 'pos.selectCard',
      name: 'Select Card Payment',
      description: 'Select card payment method',
      keys: { key: 'F9' },
      scope: 'pos',
      action: () => handlers['pos.selectCard']?.(),
      preventDefault: true,
    },
    
    'pos.selectUPI': {
      id: 'pos.selectUPI',
      name: 'Select UPI Payment',
      description: 'Select UPI payment method',
      keys: { key: 'F10' },
      scope: 'pos',
      action: () => handlers['pos.selectUPI']?.(),
      preventDefault: true,
    },
    
    'pos.printReceipt': {
      id: 'pos.printReceipt',
      name: 'Print Receipt',
      description: 'Print receipt for completed sale',
      keys: { key: 'F11' },
      scope: 'pos',
      action: () => handlers['pos.printReceipt']?.(),
      preventDefault: true,
    },
    
    'pos.newSale': {
      id: 'pos.newSale',
      name: 'New Sale',
      description: 'Start new sale / Clear completed sale',
      keys: { key: 'F12' },
      scope: 'pos',
      action: () => handlers['pos.newSale']?.(),
      preventDefault: true,
    },
    
    'pos.completeSaleCtrl': {
      id: 'pos.completeSaleCtrl',
      name: 'Complete Sale',
      description: 'Complete sale (alternative shortcut)',
      keys: { key: 'Enter', modifiers: ['ctrl'] },
      scope: 'pos',
      action: () => handlers['pos.completeSale']?.(),
      preventDefault: true,
    },
    
    'pos.printInvoice': {
      id: 'pos.printInvoice',
      name: 'Print Invoice',
      description: 'Print invoice or receipt',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'pos',
      action: () => handlers['pos.printInvoice']?.(),
      preventDefault: true,
    },
    
    'pos.holdSaleCtrl': {
      id: 'pos.holdSaleCtrl',
      name: 'Hold Sale',
      description: 'Hold sale (alternative shortcut)',
      keys: { key: 'h', modifiers: ['ctrl'] },
      scope: 'pos',
      action: () => handlers['pos.holdSale']?.(),
      preventDefault: true,
    },
    
    'pos.resumeSale': {
      id: 'pos.resumeSale',
      name: 'Resume Sale',
      description: 'Resume held sale',
      keys: { key: 'r', modifiers: ['ctrl'] },
      scope: 'pos',
      action: () => handlers['pos.resumeSale']?.(),
      preventDefault: true,
    },
    
    'pos.clearCart': {
      id: 'pos.clearCart',
      name: 'Clear Cart',
      description: 'Clear entire cart',
      keys: { key: 'Delete', modifiers: ['ctrl'] },
      scope: 'pos',
      action: () => handlers['pos.clearCart']?.(),
      preventDefault: true,
    },
    
    'pos.addProduct': {
      id: 'pos.addProduct',
      name: 'Add Product to Cart',
      description: 'Add selected product to cart',
      keys: { key: 'Enter' },
      scope: 'pos',
      action: () => handlers['pos.addProduct']?.(),
    },
    
    'pos.increaseQuantity': {
      id: 'pos.increaseQuantity',
      name: 'Increase Quantity',
      description: 'Increase selected cart item quantity',
      keys: { key: '+' },
      scope: 'pos',
      action: () => handlers['pos.increaseQuantity']?.(),
      preventDefault: true,
    },
    
    'pos.decreaseQuantity': {
      id: 'pos.decreaseQuantity',
      name: 'Decrease Quantity',
      description: 'Decrease selected cart item quantity',
      keys: { key: '-' },
      scope: 'pos',
      action: () => handlers['pos.decreaseQuantity']?.(),
      preventDefault: true,
    },
    
    'pos.removeItem': {
      id: 'pos.removeItem',
      name: 'Remove Item',
      description: 'Remove selected cart item',
      keys: { key: 'Delete' },
      scope: 'pos',
      action: () => handlers['pos.removeItem']?.(),
      preventDefault: true,
    },
    
    'pos.paymentCash': {
      id: 'pos.paymentCash',
      name: 'Payment: Cash',
      description: 'Select cash payment method',
      keys: { key: 'c', modifiers: ['alt'] },
      scope: 'pos',
      action: () => handlers['pos.paymentCash']?.(),
      preventDefault: true,
    },
    
    'pos.paymentUPI': {
      id: 'pos.paymentUPI',
      name: 'Payment: UPI',
      description: 'Select UPI payment method',
      keys: { key: 'u', modifiers: ['alt'] },
      scope: 'pos',
      action: () => handlers['pos.paymentUPI']?.(),
      preventDefault: true,
    },
    
    'pos.paymentBank': {
      id: 'pos.paymentBank',
      name: 'Payment: Bank/Card',
      description: 'Select bank/card payment method',
      keys: { key: 'b', modifiers: ['alt'] },
      scope: 'pos',
      action: () => handlers['pos.paymentBank']?.(),
      preventDefault: true,
    },
    
    'pos.paymentWallet': {
      id: 'pos.paymentWallet',
      name: 'Payment: Wallet',
      description: 'Select wallet payment method',
      keys: { key: 'w', modifiers: ['alt'] },
      scope: 'pos',
      action: () => handlers['pos.paymentWallet']?.(),
      preventDefault: true,
    },
    
    'pos.splitPayment': {
      id: 'pos.splitPayment',
      name: 'Payment: Split',
      description: 'Select split payment method',
      keys: { key: 's', modifiers: ['alt'] },
      scope: 'pos',
      action: () => handlers['pos.splitPayment']?.(),
      preventDefault: true,
    },
    
    // Sales Module Shortcuts
    'sales.focusSearch': {
      id: 'sales.focusSearch',
      name: 'Focus Product Search',
      description: 'Focus product/barcode search field',
      keys: { key: 'F1' },
      scope: 'sales',
      action: () => handlers['sales.focusSearch']?.(),
      preventDefault: true,
    },
    
    'sales.selectCustomer': {
      id: 'sales.selectCustomer',
      name: 'Select Customer',
      description: 'Focus customer selection field',
      keys: { key: 'F2' },
      scope: 'sales',
      action: () => handlers['sales.selectCustomer']?.(),
      preventDefault: true,
    },
    
    'sales.addItem': {
      id: 'sales.addItem',
      name: 'Add New Item',
      description: 'Add new product row',
      keys: { key: 'F3' },
      scope: 'sales',
      action: () => handlers['sales.addItem']?.(),
      preventDefault: true,
    },
    
    'sales.paymentSection': {
      id: 'sales.paymentSection',
      name: 'Payment Section',
      description: 'Open payment section',
      keys: { key: 'F4' },
      scope: 'sales',
      action: () => handlers['sales.paymentSection']?.(),
      preventDefault: true,
    },
    
    'sales.saveInvoice': {
      id: 'sales.saveInvoice',
      name: 'Save Invoice',
      description: 'Save/Submit invoice',
      keys: { key: 'F5' },
      scope: 'sales',
      action: () => handlers['sales.saveInvoice']?.(),
      preventDefault: true,
    },
    
    'sales.generateInvoice': {
      id: 'sales.generateInvoice',
      name: 'Generate Invoice',
      description: 'Generate invoice (alternative)',
      keys: { key: 'Enter', modifiers: ['ctrl'] },
      scope: 'sales',
      action: () => handlers['sales.generateInvoice']?.(),
      preventDefault: true,
    },
    
    'sales.printInvoice': {
      id: 'sales.printInvoice',
      name: 'Print Invoice',
      description: 'Print invoice',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'sales',
      action: () => handlers['sales.printInvoice']?.(),
      preventDefault: true,
    },
    
    'sales.newInvoice': {
      id: 'sales.newInvoice',
      name: 'New Invoice',
      description: 'Create new invoice',
      keys: { key: 'n', modifiers: ['ctrl'] },
      scope: 'sales',
      action: () => handlers['sales.newInvoice']?.(),
      preventDefault: true,
    },
    
    'sales.holdInvoice': {
      id: 'sales.holdInvoice',
      name: 'Hold Invoice',
      description: 'Hold invoice for later',
      keys: { key: 'h', modifiers: ['ctrl'] },
      scope: 'sales',
      action: () => handlers['sales.holdInvoice']?.(),
      preventDefault: true,
    },
    
    // Purchase Module Shortcuts
    'purchase.focusSearch': {
      id: 'purchase.focusSearch',
      name: 'Focus Product Search',
      description: 'Focus barcode/product search field',
      keys: { key: 'F1' },
      scope: 'purchase',
      action: () => handlers['purchase.focusSearch']?.(),
      preventDefault: true,
    },
    
    'purchase.selectSupplier': {
      id: 'purchase.selectSupplier',
      name: 'Select Supplier',
      description: 'Focus supplier selection field',
      keys: { key: 'F2' },
      scope: 'purchase',
      action: () => handlers['purchase.selectSupplier']?.(),
      preventDefault: true,
    },
    
    'purchase.addProduct': {
      id: 'purchase.addProduct',
      name: 'Add Product Row',
      description: 'Add new product row',
      keys: { key: 'F3' },
      scope: 'purchase',
      action: () => handlers['purchase.addProduct']?.(),
      preventDefault: true,
    },
    
    'purchase.addCharges': {
      id: 'purchase.addCharges',
      name: 'Add Charges',
      description: 'Add extra charges',
      keys: { key: 'F4' },
      scope: 'purchase',
      action: () => handlers['purchase.addCharges']?.(),
      preventDefault: true,
    },
    
    'purchase.submitPurchase': {
      id: 'purchase.submitPurchase',
      name: 'Submit Purchase',
      description: 'Submit/Save purchase bill',
      keys: { key: 'F5' },
      scope: 'purchase',
      action: () => handlers['purchase.submitPurchase']?.(),
      preventDefault: true,
    },
    
    'purchase.savePurchase': {
      id: 'purchase.savePurchase',
      name: 'Save Purchase',
      description: 'Save purchase bill (alternative)',
      keys: { key: 'Enter', modifiers: ['ctrl'] },
      scope: 'purchase',
      action: () => handlers['purchase.savePurchase']?.(),
      preventDefault: true,
    },
    
    'purchase.printBill': {
      id: 'purchase.printBill',
      name: 'Print Bill',
      description: 'Print purchase bill',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'purchase',
      action: () => handlers['purchase.printBill']?.(),
      preventDefault: true,
    },
    
    'purchase.newPurchase': {
      id: 'purchase.newPurchase',
      name: 'New Purchase',
      description: 'Create new purchase bill',
      keys: { key: 'n', modifiers: ['ctrl'] },
      scope: 'purchase',
      action: () => handlers['purchase.newPurchase']?.(),
      preventDefault: true,
    },
    
    'purchase.removeItem': {
      id: 'purchase.removeItem',
      name: 'Remove Item',
      description: 'Remove selected item row',
      keys: { key: 'Delete' },
      scope: 'purchase',
      action: () => handlers['purchase.removeItem']?.(),
      preventDefault: true,
    },
    
    // Products Module Shortcuts
    'products.addNew': {
      id: 'products.addNew',
      name: 'Add New Product',
      description: 'Create new product',
      keys: { key: 'n', modifiers: ['ctrl'] },
      scope: 'products',
      action: () => handlers['products.addNew']?.(),
      preventDefault: true,
    },
    
    'products.search': {
      id: 'products.search',
      name: 'Search Products',
      description: 'Focus product search field',
      keys: { key: 'f', modifiers: ['ctrl'] },
      scope: 'products',
      action: () => handlers['products.search']?.(),
      preventDefault: true,
    },
    
    'products.edit': {
      id: 'products.edit',
      name: 'Edit Product',
      description: 'Edit selected product',
      keys: { key: 'e', modifiers: ['ctrl'] },
      scope: 'products',
      action: () => handlers['products.edit']?.(),
      preventDefault: true,
    },
    
    'products.delete': {
      id: 'products.delete',
      name: 'Delete Product',
      description: 'Delete selected product',
      keys: { key: 'Delete' },
      scope: 'products',
      action: () => handlers['products.delete']?.(),
      preventDefault: true,
    },
    
    'products.uploadImage': {
      id: 'products.uploadImage',
      name: 'Upload Image',
      description: 'Upload product image',
      keys: { key: 'u', modifiers: ['ctrl'] },
      scope: 'products',
      action: () => handlers['products.uploadImage']?.(),
      preventDefault: true,
    },
    
    'products.generateBarcode': {
      id: 'products.generateBarcode',
      name: 'Generate Barcode',
      description: 'Generate product barcode',
      keys: { key: 'b', modifiers: ['ctrl'] },
      scope: 'products',
      action: () => handlers['products.generateBarcode']?.(),
      preventDefault: true,
    },
    
    // Parties Module Shortcuts
    'parties.addNew': {
      id: 'parties.addNew',
      name: 'Add New Party',
      description: 'Create new customer/supplier',
      keys: { key: 'n', modifiers: ['ctrl'] },
      scope: 'parties',
      action: () => handlers['parties.addNew']?.(),
      preventDefault: true,
    },
    
    'parties.search': {
      id: 'parties.search',
      name: 'Search',
      description: 'Focus search field',
      keys: { key: 'f', modifiers: ['ctrl'] },
      scope: 'parties',
      action: () => handlers['parties.search']?.(),
      preventDefault: true,
    },
    
    'parties.edit': {
      id: 'parties.edit',
      name: 'Edit Party',
      description: 'Edit selected party',
      keys: { key: 'e', modifiers: ['ctrl'] },
      scope: 'parties',
      action: () => handlers['parties.edit']?.(),
      preventDefault: true,
    },
    
    'parties.openDetails': {
      id: 'parties.openDetails',
      name: 'Open Details',
      description: 'Open party details',
      keys: { key: 'Enter' },
      scope: 'parties',
      action: () => handlers['parties.openDetails']?.(),
    },
    
    'parties.ledger': {
      id: 'parties.ledger',
      name: 'Party Ledger',
      description: 'Open party ledger',
      keys: { key: 'l', modifiers: ['ctrl'] },
      scope: 'parties',
      action: () => handlers['parties.ledger']?.(),
      preventDefault: true,
    },
    
    'parties.recordPayment': {
      id: 'parties.recordPayment',
      name: 'Record Payment',
      description: 'Record payment for party',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'parties',
      action: () => handlers['parties.recordPayment']?.(),
      preventDefault: true,
    },
    
    // Reports Module Shortcuts
    'reports.search': {
      id: 'reports.search',
      name: 'Search Reports',
      description: 'Focus report search field',
      keys: { key: 'f', modifiers: ['ctrl'] },
      scope: 'reports',
      action: () => handlers['reports.search']?.(),
      preventDefault: true,
    },
    
    'reports.export': {
      id: 'reports.export',
      name: 'Export Report',
      description: 'Export current report',
      keys: { key: 'e', modifiers: ['ctrl'] },
      scope: 'reports',
      action: () => handlers['reports.export']?.(),
      preventDefault: true,
    },
    
    'reports.print': {
      id: 'reports.print',
      name: 'Print Report',
      description: 'Print current report',
      keys: { key: 'p', modifiers: ['ctrl'] },
      scope: 'reports',
      action: () => handlers['reports.print']?.(),
      preventDefault: true,
    },
    
    'reports.inventory': {
      id: 'reports.inventory',
      name: 'Inventory Report',
      description: 'View inventory report',
      keys: { key: '1', modifiers: ['alt'] },
      scope: 'reports',
      action: () => handlers['reports.inventory']?.(),
      preventDefault: true,
    },
    
    'reports.sales': {
      id: 'reports.sales',
      name: 'Sales Report',
      description: 'View sales report',
      keys: { key: '2', modifiers: ['alt'] },
      scope: 'reports',
      action: () => handlers['reports.sales']?.(),
      preventDefault: true,
    },
    
    'reports.purchase': {
      id: 'reports.purchase',
      name: 'Purchase Report',
      description: 'View purchase report',
      keys: { key: '3', modifiers: ['alt'] },
      scope: 'reports',
      action: () => handlers['reports.purchase']?.(),
      preventDefault: true,
    },
    
    // Forms & Modals
    'forms.close': {
      id: 'forms.close',
      name: 'Close Form',
      description: 'Close modal/form',
      keys: { key: 'Escape' },
      scope: 'forms',
      action: () => handlers['forms.close']?.(),
    },
    
    'forms.submit': {
      id: 'forms.submit',
      name: 'Submit Form',
      description: 'Submit form',
      keys: { key: 'Enter', modifiers: ['ctrl'] },
      scope: 'forms',
      action: () => handlers['forms.submit']?.(),
      preventDefault: true,
    },
    
    'forms.save': {
      id: 'forms.save',
      name: 'Save Form',
      description: 'Save form',
      keys: { key: 's', modifiers: ['ctrl'] },
      scope: 'forms',
      action: () => handlers['forms.save']?.(),
      preventDefault: true,
    },
    
    'forms.reset': {
      id: 'forms.reset',
      name: 'Reset Form',
      description: 'Reset form to default values',
      keys: { key: 'Backspace', modifiers: ['ctrl'] },
      scope: 'forms',
      action: () => handlers['forms.reset']?.(),
      preventDefault: true,
    },
  };
};
