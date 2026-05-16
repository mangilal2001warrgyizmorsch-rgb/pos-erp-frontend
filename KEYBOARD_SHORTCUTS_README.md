# Keyboard Shortcuts System - Complete Implementation

## 🎯 Overview

A comprehensive keyboard shortcut system for the POS ERP application with:

- ✅ Global navigation shortcuts
- ✅ Module-specific shortcuts (POS, Sales, Purchase, Products, Parties, Reports)
- ✅ Barcode scanner support
- ✅ Form keyboard shortcuts
- ✅ Table keyboard navigation
- ✅ Beautiful help modal
- ✅ Shortcut badges for UI hints
- ✅ Smart input field detection
- ✅ User preferences storage
- ✅ Accessibility support

## 📁 File Structure

```
src/
├── hooks/
│   ├── useKeyboardShortcut.ts       # Core keyboard shortcut hook
│   ├── useBarcodeScanner.ts         # Barcode scanner detection
│   ├── usePOSShortcuts.ts           # POS-specific shortcuts
│   ├── useSalesShortcuts.ts         # Sales module shortcuts
│   ├── usePurchaseShortcuts.ts      # Purchase module shortcuts
│   ├── useProductsShortcuts.ts      # Products module shortcuts
│   ├── usePartiesShortcuts.ts       # Parties module shortcuts
│   └── useReportsShortcuts.ts       # Reports module shortcuts
│
├── components/shortcuts/
│   ├── ShortcutBadge.tsx            # Displays shortcut hints
│   ├── ShortcutButton.tsx           # Button with shortcut badge
│   ├── ShortcutHelpModal.tsx        # Comprehensive help modal
│   ├── DataTableKeyboardNavigation.tsx  # Table keyboard nav
│   ├── FormKeyboardShortcuts.tsx    # Form shortcuts
│   └── index.ts                     # Component exports
│
├── components/settings/
│   └── KeyboardShortcutsSettings.tsx  # Settings page section
│
├── providers/
│   └── KeyboardShortcutProvider.tsx   # App provider
│
├── store/
│   └── shortcutStore.ts             # Zustand store
│
├── constants/
│   └── shortcuts.ts                 # Shortcut configuration
│
└── types/
    └── shortcuts.ts                 # TypeScript types
```

## 🚀 Quick Start

### 1. The system is already integrated into your app!

The `KeyboardShortcutProvider` is already included in `src/providers/Providers.tsx`

### 2. Global shortcuts work automatically

Try these right now:
- `Ctrl/Cmd + K` - Command palette
- `Ctrl/Cmd + D` - Dashboard
- `Ctrl/Cmd + /` - Show help modal

### 3. Add shortcuts to a specific page

```typescript
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useRef } from 'react';

export default function POSPage() {
  const searchRef = useRef<HTMLInputElement>(null);

  const handlers = usePOSShortcuts({
    onFocusSearch: () => searchRef.current?.focus(),
    onCompleteSale: () => handleCompleteSale(),
    onPrintReceipt: () => handlePrint(),
  });

  return (
    <div>
      <input ref={searchRef} placeholder="Product search (F1)" />
      {/* Rest of POS UI */}
    </div>
  );
}
```

## 🎮 Keyboard Shortcuts Reference

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + D` | Dashboard |
| `Ctrl/Cmd + P` | POS Billing |
| `Ctrl/Cmd + I` | Products |
| `Ctrl/Cmd + S` | Sales |
| `Ctrl/Cmd + B` | Purchase |
| `Ctrl/Cmd + R` | Reports |
| `Ctrl/Cmd + E` | Expenses |
| `Ctrl/Cmd + ,` | Settings |
| `Ctrl/Cmd + /` | Help (shortcuts) |
| `Ctrl/Cmd + Shift + T` | Toggle theme |
| `Ctrl/Cmd + Shift + B` | Toggle sidebar |
| `Esc` | Close modal |

### POS Billing Shortcuts

| Shortcut | Action |
|----------|--------|
| `F1` | Focus product search |
| `F2` | Focus customer search |
| `F3` | Hold sale |
| `F4` | Open payment |
| `F5` | Complete sale |
| `F6` | Open cart |
| `F7` | Apply discount |
| `F8` | Cash payment |
| `F9` | Card payment |
| `F10` | UPI payment |
| `F11` | Print receipt |
| `F12` | New sale |
| `Ctrl/Cmd + Enter` | Complete sale (alt) |
| `Ctrl/Cmd + P` | Print invoice |
| `Ctrl/Cmd + H` | Hold sale (alt) |
| `Ctrl/Cmd + R` | Resume sale |
| `Alt + C` | Cash payment |
| `Alt + U` | UPI payment |
| `Alt + B` | Bank payment |

### Module Shortcuts

See `KEYBOARD_SHORTCUTS_GUIDE.md` for complete reference for:
- Sales module
- Purchase module
- Products module
- Parties module
- Reports module

## 🛠️ Hooks Reference

### useKeyboardShortcut

```typescript
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

// Register a single shortcut with handler
useKeyboardShortcut(shortcut, () => {
  console.log('Shortcut triggered!');
});

// Register multiple shortcuts
useKeyboardShortcut([shortcut1, shortcut2], handler, {
  enabled: true,
  preventDefault: true,
});
```

### useRegisterShortcut

```typescript
import { useRegisterShortcut } from '@/hooks/useKeyboardShortcut';

// Register shortcut globally
useRegisterShortcut({
  id: 'custom.action',
  name: 'Custom Action',
  keys: { key: 'x', modifiers: ['ctrl'] },
  scope: 'pos',
  action: () => { /* ... */ },
});
```

### useShortcutScope

```typescript
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';

// Automatically activate scope when component mounts
useShortcutScope('pos');

// Activate multiple scopes
useShortcutScope(['pos', 'forms']);
```

### usePOSShortcuts

```typescript
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';

const handlers = usePOSShortcuts({
  onFocusSearch: () => { /* ... */ },
  onCompleteSale: () => { /* ... */ },
  onPrintReceipt: () => { /* ... */ },
  // ... more handlers
});
```

Similar hooks exist for:
- `useSalesShortcuts`
- `usePurchaseShortcuts`
- `useProductsShortcuts`
- `usePartiesShortcuts`
- `useReportsShortcuts`

### useBarcodeScanner

```typescript
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

const { currentBarcode, isScanning } = useBarcodeScanner({
  enabled: true,
  minLength: 4,
  scanTimeout: 150,
  onScan: async (barcode) => {
    const product = await searchByBarcode(barcode);
    addToCart(product);
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

## 🎨 UI Components

### ShortcutBadge

```typescript
import { ShortcutBadge } from '@/components/shortcuts';

<ShortcutBadge 
  keys={{ key: 'F5' }}
  variant="default" // default | outline | subtle
/>

<ShortcutBadge 
  keys={{ key: 'p', modifiers: ['ctrl'] }}
/>
```

### ShortcutButton

```typescript
import { ShortcutButton } from '@/components/shortcuts';

<ShortcutButton
  shortcut={{ key: 'F5' }}
  onClick={handleClick}
  variant="default"
>
  Complete Sale
</ShortcutButton>
```

### DataTableKeyboardNavigation

```typescript
import { DataTableKeyboardNavigation } from '@/components/shortcuts';

<DataTableKeyboardNavigation
  rowCount={items.length}
  onRowSelect={(index) => setSelected(index)}
  onRowOpen={(index) => navigate(items[index]._id)}
  onRowDelete={(index) => deleteItem(items[index])}
  enabled={true}
/>
```

### FormKeyboardShortcuts

```typescript
import { FormKeyboardShortcuts } from '@/components/shortcuts';

<FormKeyboardShortcuts
  onSave={() => handleSave()}
  onSubmit={() => handleSubmit()}
  onCancel={() => handleCancel()}
  onReset={() => handleReset()}
/>
```

## 🎯 Zustand Store

```typescript
import { useShortcutStore } from '@/store/shortcutStore';

const store = useShortcutStore();

// State
store.shortcutsEnabled;
store.activeScopes;
store.barcodeModeEnabled;
store.helpModalOpen;

// Actions
store.enableShortcuts();
store.disableShortcuts();
store.toggleShortcuts();
store.setActiveScopes(['pos', 'forms']);
store.toggleBarcodeMode();
store.openHelpModal();
store.closeHelpModal();
store.registerShortcut(shortcut);
store.unregisterShortcut(shortcutId);
store.getShortcutsByScope('pos');
```

## ⚙️ Configuration

### Edit shortcuts in `src/constants/shortcuts.ts`

```typescript
import { createShortcuts } from '@/constants/shortcuts';

const shortcuts = createShortcuts(router, {
  'global.commandPalette': () => { /* ... */ },
  'pos.completeSale': () => { /* ... */ },
  // Add custom handlers
});
```

### Enable/Disable Shortcuts

In Settings page:
- Toggle "Enable Keyboard Shortcuts"
- Toggle "Enable Barcode Scanner Mode"
- View all shortcuts in help modal

Or programmatically:

```typescript
const { enableShortcuts, disableShortcuts } = useShortcutStore();

enableShortcuts();
disableShortcuts();
```

## 🔍 Smart Input Detection

The system automatically detects when you're typing in:
- Text inputs
- Textareas
- Select dropdowns
- Contenteditable elements

Shortcuts won't trigger in these contexts, but:
- POS barcode scanner still works in barcode input
- Form shortcuts work (Ctrl+S, Ctrl+Enter, etc.)
- Table shortcuts work for navigation

## 💾 Persistence

- Shortcuts enabled/disabled state is saved to localStorage
- Barcode mode preference is saved
- User preferences are restored on app reload

## 🧪 Testing Shortcuts

1. **Global shortcuts**: Try `Ctrl/Cmd + /` to open help
2. **POS shortcuts**: Navigate to POS, press `F1`
3. **Barcode scanner**: Connect USB scanner, scan barcode in POS
4. **Help modal**: Press `Ctrl/Cmd + /` to see all shortcuts

## 📱 Platform Support

- ✅ Windows (Ctrl key)
- ✅ Mac (Cmd key)
- ✅ Linux (Ctrl key)
- ✅ Mobile (limited support for hardware keyboards)

## ♿ Accessibility

- All shortcuts have clear labels
- Focus states are visible
- Help modal is accessible
- Keyboard-only navigation supported
- Screen reader friendly

## 🚨 Important Notes

1. **No Rebuild Needed**: The system is ready to use immediately
2. **Global Provider**: Shortcuts are already available app-wide
3. **Input Safety**: Shortcuts don't interfere with normal typing
4. **Mobile Ready**: Supports hardware keyboards on mobile
5. **Extensible**: Easy to add new shortcuts

## 🔗 Integration Checklist

- [x] Global navigation shortcuts
- [x] POS billing shortcuts
- [x] Sales module shortcuts
- [x] Purchase module shortcuts
- [x] Products module shortcuts
- [x] Parties module shortcuts
- [x] Reports module shortcuts
- [x] Barcode scanner support
- [x] Form shortcuts
- [x] Table navigation
- [x] Shortcut badges
- [x] Help modal
- [x] Settings integration
- [x] Zustand store
- [x] Accessibility support
- [x] Input field detection
- [x] Cross-platform support

## 📚 Further Reading

See `KEYBOARD_SHORTCUTS_GUIDE.md` for:
- Detailed integration examples
- Custom shortcut registration
- Advanced usage patterns
- Best practices
- Troubleshooting

## 🎓 Example: Complete POS Integration

```typescript
'use client';

import { useRef } from 'react';
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ShortcutButton } from '@/components/shortcuts';

export default function POSPage() {
  const searchRef = useRef<HTMLInputElement>(null);

  // POS shortcuts
  const posHandlers = usePOSShortcuts({
    onFocusSearch: () => searchRef.current?.focus(),
    onCompleteSale: () => completeSale(),
    onPrintReceipt: () => printReceipt(),
  });

  // Barcode scanner
  useBarcodeScanner({
    onScan: async (barcode) => {
      const product = await findProduct(barcode);
      addToCart(product);
    },
  });

  return (
    <div>
      <input
        ref={searchRef}
        placeholder="Search products (F1)"
        type="text"
      />

      <ShortcutButton
        shortcut={{ key: 'F5' }}
        onClick={completeSale}
      >
        Complete Sale
      </ShortcutButton>

      <ShortcutButton
        shortcut={{ key: 'F11' }}
        onClick={printReceipt}
      >
        Print Receipt
      </ShortcutButton>
    </div>
  );
}
```

---

**Ready to use!** The keyboard shortcut system is fully integrated and operational. Start using shortcuts immediately or customize them as needed.
