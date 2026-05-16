/**
 * KEYBOARD SHORTCUTS SYSTEM - INTEGRATION GUIDE
 * 
 * This guide explains how to use the keyboard shortcuts system in your POS ERP app.
 */

// ============================================
// 1. GLOBAL SHORTCUTS (Automatic)
// ============================================

/*
The following shortcuts work globally everywhere:

Navigation:
- Ctrl/Cmd + K → Open Global Search / Command Palette
- Ctrl/Cmd + D → Dashboard
- Ctrl/Cmd + P → POS Billing
- Ctrl/Cmd + I → Items / Products
- Ctrl/Cmd + S → Sales
- Ctrl/Cmd + B → Purchase Bills
- Ctrl/Cmd + R → Reports
- Ctrl/Cmd + E → Expenses
- Ctrl/Cmd + , → Settings

Utility:
- Ctrl/Cmd + / → Open Keyboard Shortcuts Help Modal
- Esc → Close active modal/drawer
- Ctrl/Cmd + Shift + T → Toggle Theme
- Ctrl/Cmd + Shift + B → Toggle Sidebar

These shortcuts are automatically available and don't require any setup.
*/

// ============================================
// 2. POS PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into POS page

import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useRef } from 'react';

export default function POSPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  
  const {
    handleFocusSearch,
    handleFocusCustomer,
    handleCompleteSale,
    handlePrintReceipt,
    // ... other handlers
  } = usePOSShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onFocusCustomer: () => customerSearchRef.current?.focus(),
    onCompleteSale: () => handleCompleteSaleAction(),
    onPrintReceipt: () => handlePrintReceiptAction(),
  });

  return (
    // Your POS page JSX
  );
}

POS SHORTCUTS REFERENCE:
- F1 → Focus Product Search
- F2 → Focus Customer Search
- F3 → Hold Sale
- F4 → Open Payment Section
- F5 → Complete Sale
- F6 → Open Cart Drawer
- F7 → Apply Discount
- F8 → Select Cash Payment
- F9 → Select Card Payment
- F10 → Select UPI Payment
- F11 → Print Receipt
- F12 → New Sale
- Ctrl/Cmd + Enter → Complete Sale
- Ctrl/Cmd + P → Print Invoice
- Ctrl/Cmd + H → Hold Sale
- Ctrl/Cmd + R → Resume Sale
- Ctrl/Cmd + Delete → Clear Cart
- Alt + C → Cash Payment
- Alt + U → UPI Payment
- Alt + B → Bank/Card Payment
- Alt + W → Wallet Payment
- Alt + S → Split Payment
*/

// ============================================
// 3. SALES PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into Sales page

import { useSalesShortcuts } from '@/hooks/useSalesShortcuts';

export default function SalesPage() {
  const { handleSaveInvoice, handlePrintInvoice } = useSalesShortcuts({
    onSaveInvoice: () => { /* handle save */ },
    onPrintInvoice: () => { /* handle print */ },
  });

  return (
    // Your Sales page JSX
  );
}

SALES SHORTCUTS:
- F1 → Focus Product Search
- F2 → Select Customer
- F3 → Add New Item
- F4 → Payment Section
- F5 → Save Invoice
- Ctrl/Cmd + Enter → Generate Invoice
- Ctrl/Cmd + P → Print Invoice
- Ctrl/Cmd + N → New Invoice
- Ctrl/Cmd + H → Hold Invoice
*/

// ============================================
// 4. PURCHASE PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into Purchase page

import { usePurchaseShortcuts } from '@/hooks/usePurchaseShortcuts';

export default function PurchasePage() {
  const { handleSavePurchase, handlePrintBill } = usePurchaseShortcuts({
    onSavePurchase: () => { /* handle save */ },
    onPrintBill: () => { /* handle print */ },
  });

  return (
    // Your Purchase page JSX
  );
}

PURCHASE SHORTCUTS:
- F1 → Focus Product Search
- F2 → Select Supplier
- F3 → Add New Product
- F4 → Add Charges
- F5 → Submit Purchase
- Ctrl/Cmd + Enter → Save Purchase
- Ctrl/Cmd + P → Print Bill
- Ctrl/Cmd + N → New Purchase
- Delete → Remove Item
*/

// ============================================
// 5. PRODUCTS PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into Products page

import { useProductsShortcuts } from '@/hooks/useProductsShortcuts';

export default function ProductsPage() {
  const { handleAddNew, handleEdit, handleDelete } = useProductsShortcuts({
    onAddNew: () => { /* open add product form */ },
    onEdit: () => { /* edit selected product */ },
    onDelete: () => { /* delete selected product */ },
  });

  return (
    // Your Products page JSX
  );
}

PRODUCTS SHORTCUTS:
- Ctrl/Cmd + N → Add New Product
- Ctrl/Cmd + F → Focus Search
- Ctrl/Cmd + E → Edit Selected Product
- Delete → Delete Selected Product
- Ctrl/Cmd + U → Upload Product Image
- Ctrl/Cmd + B → Generate Barcode
- Arrow Up → Previous row
- Arrow Down → Next row
- Enter → Open selected product
*/

// ============================================
// 6. PARTIES PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into Parties page

import { usePartiesShortcuts } from '@/hooks/usePartiesShortcuts';

export default function PartiesPage() {
  const { handleAddNew, handleEdit, handleLedger } = usePartiesShortcuts({
    onAddNew: () => { /* open add party form */ },
    onEdit: () => { /* edit selected party */ },
    onLedger: () => { /* open party ledger */ },
  });

  return (
    // Your Parties page JSX
  );
}

PARTIES SHORTCUTS:
- Ctrl/Cmd + N → Add New Party
- Ctrl/Cmd + F → Focus Search
- Ctrl/Cmd + E → Edit Selected Party
- Enter → Open Party Details
- Ctrl/Cmd + L → Open Party Ledger
- Ctrl/Cmd + P → Record Payment
*/

// ============================================
// 7. REPORTS PAGE SHORTCUTS
// ============================================

/*
Example: Integrating shortcuts into Reports page

import { useReportsShortcuts } from '@/hooks/useReportsShortcuts';

export default function ReportsPage() {
  const { handleExport, handlePrint } = useReportsShortcuts({
    onExport: () => { /* export report */ },
    onPrint: () => { /* print report */ },
  });

  return (
    // Your Reports page JSX
  );
}

REPORTS SHORTCUTS:
- Ctrl/Cmd + F → Focus Report Search
- Ctrl/Cmd + E → Export Report
- Ctrl/Cmd + P → Print Report
- Alt + 1 → Inventory Report
- Alt + 2 → Sales Report
- Alt + 3 → Purchase Report
*/

// ============================================
// 8. TABLE KEYBOARD NAVIGATION
// ============================================

/*
Example: Using DataTableKeyboardNavigation in tables

import { DataTableKeyboardNavigation } from '@/components/shortcuts';

export default function ProductsTable() {
  const handleRowSelect = (rowIndex) => {
    setSelectedRow(rowIndex);
  };

  const handleRowOpen = (rowIndex) => {
    // Navigate to product details
  };

  return (
    <>
      <DataTableKeyboardNavigation
        rowCount={products.length}
        onRowSelect={handleRowSelect}
        onRowOpen={handleRowOpen}
        enabled={true}
      />
      
      {/* Your table JSX */}
    </>
  );
}

TABLE NAVIGATION SHORTCUTS:
- Arrow Up → Previous row
- Arrow Down → Next row
- Enter → Open selected row
- Ctrl/Cmd + E → Edit selected row
- Delete → Delete selected row
- Ctrl/Cmd + Shift + E → Export table
*/

// ============================================
// 9. FORM KEYBOARD SHORTCUTS
// ============================================

/*
Example: Using FormKeyboardShortcuts in forms

import { FormKeyboardShortcuts } from '@/components/shortcuts';

export default function ProductForm() {
  const handleSubmit = () => {
    // Submit form
  };

  const handleSave = () => {
    // Save form
  };

  const handleReset = () => {
    // Reset form
  };

  return (
    <>
      <FormKeyboardShortcuts
        onSubmit={handleSubmit}
        onSave={handleSave}
        onReset={handleReset}
      />
      
      {/* Your form JSX */}
    </>
  );
}

FORM SHORTCUTS:
- Ctrl/Cmd + S → Save Form
- Ctrl/Cmd + Enter → Submit Form
- Escape → Cancel Form
- Ctrl/Cmd + Backspace → Reset Form
- Tab → Move to next field
- Shift + Tab → Move to previous field
*/

// ============================================
// 10. BARCODE SCANNER INTEGRATION
// ============================================

/*
Example: Using useBarcodeScanner for barcode detection

import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export default function POSPage() {
  const { addProduct } = useCartStore();

  const { currentBarcode, isScanning } = useBarcodeScanner({
    enabled: true,
    minLength: 4,
    scanTimeout: 150,
    onScan: async (barcode) => {
      try {
        const product = await productService.searchByBarcode(barcode);
        if (product) {
          addProduct(product);
          toast.success(`${product.name} added to cart`);
        } else {
          toast.error('Product not found');
        }
      } catch (error) {
        toast.error('Barcode scan failed');
      }
    },
    onError: (error) => {
      toast.error(`Barcode error: ${error}`);
    },
  });

  return (
    // Your POS page JSX
  );
}

BARCODE SCANNER FEATURES:
- Auto-detects fast barcode input from USB scanners
- Configurable timeout and minimum length
- Auto-adds product to cart when found
- Shows error toast if product not found
- Respects shortcut enable/disable state
*/

// ============================================
// 11. SHORTCUT BADGES IN UI
// ============================================

/*
Example: Adding shortcut hints to buttons

import { ShortcutBadge, ShortcutButton } from '@/components/shortcuts';

export default function POSToolbar() {
  return (
    <div className="flex gap-2">
      {/* Using ShortcutBadge with regular button */}
      <div className="relative">
        <button onClick={completeSale} className="px-4 py-2 bg-blue-600 text-white rounded">
          Complete Sale
        </button>
        <ShortcutBadge 
          keys={{ key: 'F5' }}
          className="absolute -top-2 -right-2"
        />
      </div>

      {/* Using ShortcutButton for integrated hint */}
      <ShortcutButton
        shortcut={{ key: 'F3' }}
        onClick={holdSale}
        variant="outline"
      >
        Hold Sale
      </ShortcutButton>

      {/* ShortcutBadge with modifiers */}
      <button className="flex items-center gap-2">
        Print Receipt
        <ShortcutBadge 
          keys={{ key: 'p', modifiers: ['ctrl'] }}
          variant="subtle"
        />
      </button>
    </div>
  );
}

SHORTCUTBADGE VARIANTS:
- default: Filled badge (good for primary actions)
- outline: Bordered badge
- subtle: Light background badge
*/

// ============================================
// 12. HELP MODAL INTEGRATION
// ============================================

/*
The ShortcutHelpModal is automatically integrated and can be opened:
- By pressing Ctrl/Cmd + /
- By clicking "View All Keyboard Shortcuts" button

The modal shows all shortcuts organized by category with search functionality.
*/

// ============================================
// 13. MANAGING SHORTCUT STATE
// ============================================

/*
Use the useShortcutStore to manage shortcut state:

import { useShortcutStore } from '@/store/shortcutStore';

function MyComponent() {
  const {
    shortcutsEnabled,
    barcodeModeEnabled,
    activeScopes,
    enableShortcuts,
    disableShortcuts,
    toggleShortcuts,
    setActiveScopes,
    toggleBarcodeMode,
    openHelpModal,
    closeHelpModal,
  } = useShortcutStore();

  return (
    <div>
      <button onClick={toggleShortcuts}>
        {shortcutsEnabled ? 'Disable' : 'Enable'} Shortcuts
      </button>
      <button onClick={openHelpModal}>
        Show Help
      </button>
    </div>
  );
}
*/

// ============================================
// 14. REGISTERING CUSTOM SHORTCUTS
// ============================================

/*
Example: Register page-specific shortcuts

import { useRegisterShortcut } from '@/hooks/useKeyboardShortcut';
import type { Shortcut } from '@/types/shortcuts';

export default function CustomPage() {
  const customShortcut: Shortcut = {
    id: 'custom.action',
    name: 'Custom Action',
    description: 'Performs a custom action',
    keys: { key: 'x', modifiers: ['ctrl'] },
    scope: 'pos', // Only active on POS page
    action: () => {
      console.log('Custom action triggered!');
    },
    preventDefault: true,
  };

  useRegisterShortcut(customShortcut);

  return (
    // Your page JSX
  );
}
*/

// ============================================
// 15. KEYBOARD EVENT HANDLING BEST PRACTICES
// ============================================

/*
DO:
✅ Use the provided hooks (useKeyboardShortcut, usePOSShortcuts, etc.)
✅ Let the system handle input field detection
✅ Use ShortcutBadge to show hints to users
✅ Use FormKeyboardShortcuts in forms
✅ Use DataTableKeyboardNavigation in tables

DON'T:
❌ Manually attach window.addEventListener for shortcuts
❌ Try to trigger shortcuts while in text inputs
❌ Create duplicate shortcuts for the same action
❌ Use preventDefault without good reason
*/

// ============================================
// 16. ACCESSIBILITY & UX TIPS
// ============================================

/*
ACCESSIBILITY:
- All shortcuts have aria-labels
- Focus states are clearly visible
- Keyboard navigation is intuitive
- Help modal is accessible via Ctrl+/

UX TIPS:
- Show shortcut badges on important buttons
- Use consistent modifier keys (Ctrl on Windows, Cmd on Mac)
- Test shortcuts on both keyboard and with barcode scanner
- Provide visual feedback (toasts) for shortcut actions
- Document shortcuts in help modal
- Don't break normal typing in input fields
*/

export default {};
