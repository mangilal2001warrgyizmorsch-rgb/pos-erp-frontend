/**
 * Hook for global keyboard shortcut listening
 * Listens for all keyboard events and executes registered shortcuts
 */

import { useEffect, useRef } from 'react';
import { useShortcutStore } from '@/store/shortcutStore';
import { isInputElement, isKeyComboMatch } from '@/constants/shortcuts';
import type { Shortcut } from '@/types/shortcuts';

/**
 * Listen for global keyboard shortcuts
 * This hook should be called once in the app provider
 */
export function useGlobalKeyboardListener() {
  const store = useShortcutStore();
  const shortcutsRef = useRef<Map<string, Shortcut>>(new Map());
  
  // Keep shortcutsRef updated without re-running the effect
  useEffect(() => {
    shortcutsRef.current = store.registeredShortcuts;
  }, [store.registeredShortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if shortcuts are globally disabled
      if (!store.shortcutsEnabled) return;

      const shortcuts = Array.from(shortcutsRef.current.values());
      const activeScopes = store.activeScopes;

      for (const shortcut of shortcuts) {
        // Check if this shortcut is enabled
        if (shortcut.enabled === false) {
          continue;
        }

        // Check if the current scope allows this shortcut
        const scopes = Array.isArray(shortcut.scope) ? shortcut.scope : [shortcut.scope];
        const isScopeActive = scopes.some((scope) => activeScopes.includes(scope));

        if (!isScopeActive) {
          continue;
        }

        // Check if key combo matches
        if (!isKeyComboMatch(event, shortcut.keys)) {
          continue;
        }

        // Check if we should allow shortcut in input field
        if (isInputElement(event.target as HTMLElement)) {
          // Allow specific shortcuts in input fields
          const isFKey = /^F\d+$/.test(event.key);
          const allowedKeys = ['Escape', 'Enter', 'Tab', ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`)];
          
          if (!allowedKeys.includes(event.key) && !isFKey) {
            continue;
          }
        }

        // Found a matching shortcut
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        if (shortcut.stopPropagation !== false) {
          event.stopPropagation();
        }

        // Execute the action
        shortcut.action?.();
        break; // Only execute the first matching shortcut
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [store.shortcutsEnabled, store.activeScopes.join(',')]); // Stabilize array dependency
}
