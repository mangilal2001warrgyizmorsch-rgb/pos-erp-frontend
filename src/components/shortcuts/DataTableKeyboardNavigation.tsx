/**
 * DataTableKeyboardNavigation Component
 * Reusable component for keyboard navigation in TanStack tables
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { isInputElement } from '@/constants/shortcuts';
import { useShortcutStore } from '@/store/shortcutStore';

interface DataTableKeyboardNavigationProps {
  /**
   * Total number of rows in the table
   */
  rowCount: number;

  /**
   * Callback when a row is selected
   */
  onRowSelect?: (rowIndex: number) => void;

  /**
   * Callback when Enter is pressed on a row
   */
  onRowOpen?: (rowIndex: number) => void;

  /**
   * Callback when Delete is pressed on a row
   */
  onRowDelete?: (rowIndex: number) => void;

  /**
   * Callback for edit action
   */
  onRowEdit?: (rowIndex: number) => void;

  /**
   * Whether to enable keyboard navigation
   */
  enabled?: boolean;
}

export const DataTableKeyboardNavigation: React.FC<DataTableKeyboardNavigationProps> = ({
  rowCount,
  onRowSelect,
  onRowOpen,
  onRowDelete,
  onRowEdit,
  enabled = true,
}) => {
  const { selectedTableRow, setSelectedTableRow } = useShortcutStore();
  const { shortcutsEnabled } = useShortcutStore();

  // Activate tables scope
  useShortcutScope('tables');

  const currentIndex = selectedTableRow ? parseInt(selectedTableRow, 10) : 0;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !shortcutsEnabled || rowCount === 0) {
        return;
      }

      // Don't trigger in input fields
      const target = event.target as Element;
      if (isInputElement(target)) {
        return;
      }

      let newIndex = currentIndex;
      let handled = false;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(0, currentIndex - 1);
          handled = true;
          break;

        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(rowCount - 1, currentIndex + 1);
          handled = true;
          break;

        case 'Enter':
          event.preventDefault();
          onRowOpen?.(currentIndex);
          handled = true;
          break;

        case 'Delete':
          event.preventDefault();
          onRowDelete?.(currentIndex);
          handled = true;
          break;

        default:
          break;
      }

      if (handled) {
        setSelectedTableRow(String(newIndex));
        onRowSelect?.(newIndex);
      }

      // Check for Ctrl+E (Edit)
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'e') {
          event.preventDefault();
          onRowEdit?.(currentIndex);
        }
      }
    },
    [enabled, shortcutsEnabled, rowCount, currentIndex, onRowSelect, onRowOpen, onRowDelete, onRowEdit, setSelectedTableRow]
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

export default DataTableKeyboardNavigation;
