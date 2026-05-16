/**
 * FormKeyboardShortcuts Component
 * Handles common form keyboard shortcuts
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';

interface FormKeyboardShortcutsProps {
  /**
   * Callback when Ctrl+S or Cmd+S is pressed
   */
  onSave?: () => void;

  /**
   * Callback when Ctrl+Enter or Cmd+Enter is pressed
   */
  onSubmit?: () => void;

  /**
   * Callback when Escape is pressed
   */
  onCancel?: () => void;

  /**
   * Callback when Ctrl+Backspace is pressed
   */
  onReset?: () => void;

  /**
   * Whether to enable keyboard navigation
   */
  enabled?: boolean;
}

export const FormKeyboardShortcuts: React.FC<FormKeyboardShortcutsProps> = ({
  onSave,
  onSubmit,
  onCancel,
  onReset,
  enabled = true,
}) => {
  const { shortcutsEnabled } = useShortcutStore();

  // Activate forms scope
  useShortcutScope('forms');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !shortcutsEnabled) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + S = Save
      if (isCtrlOrCmd && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave?.();
      }

      // Ctrl/Cmd + Enter = Submit
      if (isCtrlOrCmd && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
      }

      // Escape = Cancel
      if (event.key === 'Escape') {
        onCancel?.();
      }

      // Ctrl/Cmd + Backspace = Reset
      if (isCtrlOrCmd && event.key === 'Backspace') {
        event.preventDefault();
        onReset?.();
      }
    },
    [enabled, shortcutsEnabled, onSave, onSubmit, onCancel, onReset]
  );

  useEffect(() => {
    if (!enabled || !shortcutsEnabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, shortcutsEnabled, handleKeyDown]);

  return null; // This is a non-rendering component
};

export default FormKeyboardShortcuts;
