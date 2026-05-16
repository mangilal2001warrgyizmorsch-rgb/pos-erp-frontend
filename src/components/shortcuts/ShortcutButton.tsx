/**
 * ShortcutButton Component
 * Button component with integrated shortcut badge
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShortcutBadge } from './ShortcutBadge';
import type { KeyCombo } from '@/types/shortcuts';
import type { ButtonHTMLAttributes } from 'react';

interface ShortcutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shortcut?: KeyCombo;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showShortcutOnRight?: boolean;
}

export const ShortcutButton: React.FC<ShortcutButtonProps> = ({
  shortcut,
  children,
  variant = 'default',
  size = 'default',
  showShortcutOnRight = false,
  className = '',
  ...props
}) => {
  const content =
    typeof children === 'string' ? (
      <span>{children}</span>
    ) : (
      children
    );

  return (
    <Button
      variant={variant}
      size={size}
      className={`
        ${showShortcutOnRight ? 'flex items-center justify-between gap-2' : 'relative'}
        ${className}
      `}
      {...props}
    >
      {showShortcutOnRight ? (
        <>
          {content}
          {shortcut && <ShortcutBadge keys={shortcut} variant="subtle" />}
        </>
      ) : (
        <div className="flex items-center justify-center gap-1">
          {content}
        </div>
      )}
    </Button>
  );
};

export default ShortcutButton;
