/**
 * Zustand Store for Keyboard Shortcuts
 */

import { create } from 'zustand';
import type { ShortcutScope, Shortcut } from '@/types/shortcuts';

interface ShortcutStore {
  // State
  shortcutsEnabled: boolean;
  activeScopes: ShortcutScope[];
  barcodeModeEnabled: boolean;
  helpModalOpen: boolean;
  registeredShortcuts: Map<string, Shortcut>;
  selectedTableRow: string | null;
  selectedCartItem: string | null;
  
  // Actions
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  toggleShortcuts: () => void;
  setActiveScopes: (scopes: ShortcutScope[]) => void;
  addActiveScope: (scope: ShortcutScope) => void;
  removeActiveScope: (scope: ShortcutScope) => void;
  toggleBarcodeMode: () => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (shortcutId: string) => void;
  getShortcut: (shortcutId: string) => Shortcut | undefined;
  getShortcutsByScope: (scope: ShortcutScope) => Shortcut[];
  setSelectedTableRow: (rowId: string | null) => void;
  setSelectedCartItem: (itemId: string | null) => void;
}

export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  // Initial state
  shortcutsEnabled: true,
  activeScopes: ['global'],
  barcodeModeEnabled: true,
  helpModalOpen: false,
  registeredShortcuts: new Map(),
  selectedTableRow: null,
  selectedCartItem: null,
  
  // Actions
  enableShortcuts: () => set({ shortcutsEnabled: true }),
  
  disableShortcuts: () => set({ shortcutsEnabled: false }),
  
  toggleShortcuts: () =>
    set((state) => ({ shortcutsEnabled: !state.shortcutsEnabled })),
  
  setActiveScopes: (scopes: ShortcutScope[]) =>
    set({ activeScopes: ['global', ...scopes] }),
  
  addActiveScope: (scope: ShortcutScope) =>
    set((state) => {
      const scopes = Array.from(new Set([...state.activeScopes, scope]));
      return { activeScopes: scopes };
    }),
  
  removeActiveScope: (scope: ShortcutScope) =>
    set((state) => ({
      activeScopes: state.activeScopes.filter((s) => s !== scope),
    })),
  
  toggleBarcodeMode: () =>
    set((state) => ({ barcodeModeEnabled: !state.barcodeModeEnabled })),
  
  openHelpModal: () => set({ helpModalOpen: true }),
  
  closeHelpModal: () => set({ helpModalOpen: false }),
  
  registerShortcut: (shortcut: Shortcut) =>
    set((state) => {
      const newMap = new Map(state.registeredShortcuts);
      newMap.set(shortcut.id, shortcut);
      return { registeredShortcuts: newMap };
    }),
  
  unregisterShortcut: (shortcutId: string) =>
    set((state) => {
      const newMap = new Map(state.registeredShortcuts);
      newMap.delete(shortcutId);
      return { registeredShortcuts: newMap };
    }),
  
  getShortcut: (shortcutId: string) => {
    return get().registeredShortcuts.get(shortcutId);
  },
  
  getShortcutsByScope: (scope: ShortcutScope) => {
    const shortcuts = Array.from(get().registeredShortcuts.values());
    return shortcuts.filter((shortcut) => {
      if (Array.isArray(shortcut.scope)) {
        return shortcut.scope.includes(scope);
      }
      return shortcut.scope === scope;
    });
  },
  
  setSelectedTableRow: (rowId: string | null) =>
    set({ selectedTableRow: rowId }),
  
  setSelectedCartItem: (itemId: string | null) =>
    set({ selectedCartItem: itemId }),
}));

export default useShortcutStore;
