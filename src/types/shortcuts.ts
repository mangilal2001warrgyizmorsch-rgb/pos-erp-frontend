/**
 * Keyboard Shortcut Types and Interfaces
 */

export type KeyboardModifier = 'ctrl' | 'cmd' | 'shift' | 'alt';
export type ShortcutScope = 'global' | 'pos' | 'sales' | 'purchase' | 'products' | 'parties' | 'reports' | 'tables' | 'forms';

export interface KeyCombo {
  key: string; // The main key (e.g., 'k', 'Enter', 'F1')
  modifiers?: KeyboardModifier[]; // Modifiers like Ctrl, Cmd, Shift, Alt
}

export interface Shortcut {
  id: string;
  name: string;
  description: string;
  keys: KeyCombo;
  scope: ShortcutScope | ShortcutScope[]; // Which pages/contexts this applies to
  action: (event?: KeyboardEvent) => void | Promise<void>;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: Shortcut[];
}

export interface ShortcutConfig {
  [key: string]: Shortcut;
}

export interface ShortcutContextType {
  shortcutsEnabled: boolean;
  activeScope: ShortcutScope[];
  barcodeModeEnabled: boolean;
  helpModalOpen: boolean;
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  setActiveScope: (scope: ShortcutScope[]) => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  toggleBarcodeMode: () => void;
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (shortcutId: string) => void;
  getRegisteredShortcuts: () => Shortcut[];
}

export interface BarcodeOptions {
  minLength?: number; // Minimum barcode length (default: 3)
  scanTimeout?: number; // Time to wait for scanner input in ms (default: 100)
  endKeys?: string[]; // Keys that mark end of barcode scan (default: ['Enter'])
}
