/**
 * useKeyboardShortcut Hook
 * Reusable hook for handling keyboard shortcuts
 */

'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useShortcutStore } from '@/store/shortcutStore';
import { isInputElement, isKeyComboMatch, shouldAllowShortcutInInput } from '@/constants/shortcuts';
import type { Shortcut } from '@/types/shortcuts';

interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Hook to register and handle a single keyboard shortcut
 * @param shortcut - The shortcut configuration
 * @param handler - Callback when shortcut is triggered
 * @param options - Optional configuration
 */
export const useKeyboardShortcut = (
  shortcut: Shortcut | Shortcut[],
  handler?: () => void | Promise<void>,
  options: UseKeyboardShortcutOptions = {}
) => {
  const { enabled: optionEnabled = true, preventDefault = true, stopPropagation = true } = options;
  const { shortcutsEnabled, activeScopes } = useShortcutStore();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if shortcuts are globally disabled
      if (!shortcutsEnabled || !optionEnabled) {
        return;
      }

      const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];

      for (const sc of shortcuts) {
        // Check if this shortcut is enabled
        if (sc.enabled === false) {
          continue;
        }

        // Check if the current scope allows this shortcut
        const scopes = Array.isArray(sc.scope) ? sc.scope : [sc.scope];
        const isScopeActive = scopes.some((scope) => activeScopes.includes(scope));

        if (!isScopeActive) {
          continue;
        }

        // Check if key combo matches
        if (!isKeyComboMatch(event, sc.keys)) {
          continue;
        }

        // Check if we're in an input field
        const target = event.target as Element;
        const isInput = isInputElement(target);

        // Allow shortcut if it should work in input fields
        if (isInput && !shouldAllowShortcutInInput(target, sc.id)) {
          continue;
        }

        // Found a matching shortcut
        if (sc.preventDefault ?? preventDefault) {
          event.preventDefault();
        }

        if (sc.stopPropagation ?? stopPropagation) {
          event.stopPropagation();
        }

        // Execute the action or custom handler
        if (handlerRef.current) {
          handlerRef.current();
        } else if (sc.action) {
          sc.action(event);
        }

        break; // Only execute the first matching shortcut
      }
    },
    [shortcut, optionEnabled, shortcutsEnabled, activeScopes]
  );

  useEffect(() => {
    if (!shortcutsEnabled || !optionEnabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, shortcutsEnabled, optionEnabled]);
};

/**
 * Hook to register a shortcut globally
 * Useful for page-specific shortcuts
 */
export const useRegisterShortcut = (shortcut: Shortcut, enabled = true) => {
  const { registerShortcut, unregisterShortcut } = useShortcutStore();

  useEffect(() => {
    if (enabled) {
      registerShortcut({ ...shortcut, enabled: true });
      return () => {
        unregisterShortcut(shortcut.id);
      };
    }
  }, [shortcut, enabled, registerShortcut, unregisterShortcut]);
};

/**
 * Hook to manage active scopes
 * Automatically add/remove scope when component mounts/unmounts
 */
export const useShortcutScope = (scope: string | string[]) => {
  const { addActiveScope, removeActiveScope } = useShortcutStore();
  
  // Memoize scopes to prevent unnecessary effect runs
  const scopes = useMemo(() => 
    Array.isArray(scope) ? scope : [scope], 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Array.isArray(scope) ? scope.join(',') : scope]
  );

  useEffect(() => {
    scopes.forEach((s) => addActiveScope(s as any));
    return () => {
      scopes.forEach((s) => removeActiveScope(s as any));
    };
  }, [scopes, addActiveScope, removeActiveScope]);
};

/**
 * Hook to listen for shortcuts in bulk
 * Register multiple shortcuts at once with their handlers
 */
export const useShortcutsWithHandlers = (
  shortcuts: Array<{
    shortcut: Shortcut;
    handler: () => void | Promise<void>;
    enabled?: boolean;
  }>,
  globalEnabled = true
) => {
  const { shortcutsEnabled } = useShortcutStore();
  const handlersRef = useRef<Map<string, () => void>>(new Map());

  // Update handlers ref
  useEffect(() => {
    const handlersMap = new Map<string, () => void>();
    shortcuts.forEach(({ shortcut, handler }) => {
      handlersMap.set(shortcut.id, handler);
    });
    handlersRef.current = handlersMap;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!shortcutsEnabled || !globalEnabled) {
        return;
      }

      for (const { shortcut, enabled = true } of shortcuts) {
        if (!enabled || shortcut.enabled === false) {
          continue;
        }

        if (!isKeyComboMatch(event, shortcut.keys)) {
          continue;
        }

        const target = event.target as Element;
        const isInput = isInputElement(target);

        if (isInput && !shouldAllowShortcutInInput(target, shortcut.id)) {
          continue;
        }

        if (shortcut.preventDefault ?? true) {
          event.preventDefault();
        }

        if (shortcut.stopPropagation ?? true) {
          event.stopPropagation();
        }

        const handler = handlersRef.current.get(shortcut.id);
        if (handler) {
          handler();
        } else if (shortcut.action) {
          shortcut.action(event);
        }

        break;
      }
    },
    [shortcuts, shortcutsEnabled, globalEnabled]
  );

  useEffect(() => {
    if (!shortcutsEnabled || !globalEnabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, shortcutsEnabled, globalEnabled]);
};

export default useKeyboardShortcut;
