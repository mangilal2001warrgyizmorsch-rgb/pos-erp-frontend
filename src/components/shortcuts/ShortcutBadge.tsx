/**
 * ShortcutBadge Component
 * Displays keyboard shortcut hints on buttons and UI elements
 */

'use client';

import React from 'react';
import { getDisplayKeys } from '@/constants/shortcuts';
import type { KeyCombo } from '@/types/shortcuts';

interface ShortcutBadgeProps {
  keys: KeyCombo;
  className?: string;
  variant?: 'default' | 'outline' | 'subtle';
}

export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({
  keys,
  className = '',
  variant = 'default',
}) => {
  const displayKeys = getDisplayKeys(keys);

  const variantStyles = {
    default: 'bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]',
    outline: 'border border-gray-700 text-gray-400 bg-gray-900 shadow-[0_2px_0_0_rgba(0,0,0,0.5)]',
    subtle: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]',
  };

  return (
    <kbd
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 min-w-[1.5rem]
        text-[10px] font-bold rounded-md
        border font-sans uppercase
        transition-all duration-150
        ${variantStyles[variant]}
        ${className}
      `}
      title={`Keyboard shortcut: ${displayKeys}`}
    >
      {displayKeys}
    </kbd>
  );
};

export default ShortcutBadge;

