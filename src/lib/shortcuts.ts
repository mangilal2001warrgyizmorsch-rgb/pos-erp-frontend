/**
 * Keyboard Shortcuts - All Exports
 * 
 * Centralized export file for easy importing across the app
 */

// Types
export * from '@/types/shortcuts';

// Hooks
export { useKeyboardShortcut, useRegisterShortcut, useShortcutScope, useShortcutsWithHandlers } from '@/hooks/useKeyboardShortcut';
export { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
export { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
export { useSalesShortcuts } from '@/hooks/useSalesShortcuts';
export { usePurchaseShortcuts } from '@/hooks/usePurchaseShortcuts';
export { useProductsShortcuts } from '@/hooks/useProductsShortcuts';
export { usePartiesShortcuts } from '@/hooks/usePartiesShortcuts';
export { useReportsShortcuts } from '@/hooks/useReportsShortcuts';

// Components
export { ShortcutBadge } from '@/components/shortcuts/ShortcutBadge';
export { ShortcutButton } from '@/components/shortcuts/ShortcutButton';
export { ShortcutHelpModal } from '@/components/shortcuts/ShortcutHelpModal';
export { DataTableKeyboardNavigation } from '@/components/shortcuts/DataTableKeyboardNavigation';
export { FormKeyboardShortcuts } from '@/components/shortcuts/FormKeyboardShortcuts';

// Store
export { useShortcutStore } from '@/store/shortcutStore';

// Provider
export { KeyboardShortcutProvider } from '@/providers/KeyboardShortcutProvider';

// Constants
export { createShortcuts, formatKeyCombo, getDisplayKeys, isKeyComboMatch, isInputElement, normalizeKey } from '@/constants/shortcuts';

// Example Components
export { ExamplePOSPageWithShortcuts } from '@/components/examples/ExamplePOSPageWithShortcuts';
