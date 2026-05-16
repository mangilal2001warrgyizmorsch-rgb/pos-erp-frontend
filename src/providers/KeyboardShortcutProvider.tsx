/**
 * Keyboard Shortcut Provider
 * Wraps the app and provides global keyboard shortcut functionality
 */

'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useGlobalKeyboardListener } from '@/hooks/useGlobalKeyboardListener';
import type { Shortcut } from '@/types/shortcuts';

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({
  children,
}) => {
  const router = useRouter();
  const store = useShortcutStore();
  const registeredRef = useRef(false);
  const shortcutsRef = useRef<Record<string, Shortcut>>({});

  // Global shortcut handlers - memoized to prevent dependency changes
  const handlers = useMemo(() => ({
    'global.commandPalette': () => {
      // TODO: Implement command palette
      console.log('Open command palette');
    },
    'global.help': () => {
      store.openHelpModal();
    },
    'global.closeModal': () => {
      // Dispatch custom event to close modals
      window.dispatchEvent(new CustomEvent('closeModal'));
    },
    'global.toggleTheme': () => {
      // Dispatch custom event to toggle theme
      window.dispatchEvent(new CustomEvent('toggleTheme'));
    },
    'global.toggleSidebar': () => {
      // Dispatch custom event to toggle sidebar
      window.dispatchEvent(new CustomEvent('toggleSidebar'));
    },
  }), [store]);

  // Register shortcuts once on mount - use ref to prevent re-registration
  useEffect(() => {
    if (registeredRef.current) return;
    
    const shortcuts = createShortcuts(router, handlers);
    shortcutsRef.current = shortcuts;
    
    const shortcutIds = Object.keys(shortcuts);
    if (shortcutIds.length === 0) return;

    // Register all shortcuts in the store
    shortcutIds.forEach((id) => {
      store.registerShortcut(shortcuts[id]);
    });

    registeredRef.current = true;

    // Also store in localStorage for persistence
    try {
      const shortcutsEnabled = localStorage.getItem('shortcutsEnabled');
      if (shortcutsEnabled === 'false') {
        store.disableShortcuts();
      }
      
      const barcodeModeEnabled = localStorage.getItem('barcodeModeEnabled');
      if (barcodeModeEnabled === 'false') {
        // Already false by default, but explicit handling
      }
    } catch (error) {
      console.warn('Failed to read shortcuts settings from localStorage:', error);
    }
  }, [router, store, handlers]);

  // Save shortcuts preference when changed
  useEffect(() => {
    try {
      localStorage.setItem('shortcutsEnabled', String(store.shortcutsEnabled));
    } catch (error) {
      console.warn('Failed to save shortcuts setting:', error);
    }
  }, [store.shortcutsEnabled]);

  // Listen for global keyboard events
  useGlobalKeyboardListener();

  return <>{children}</>;
};

export default KeyboardShortcutProvider;
