/**
 * useBarcodeScanner Hook
 * Detects and handles barcode scanner input
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useShortcutStore } from '@/store/shortcutStore';
import { isInputElement } from '@/constants/shortcuts';
import type { BarcodeOptions } from '@/types/shortcuts';

interface UseBarcodeOptions extends BarcodeOptions {
  enabled?: boolean;
  onScan: (barcode: string) => void | Promise<void>;
  onError?: (error: string) => void;
}

/**
 * Hook to detect and handle barcode scanner input
 * Most USB barcode scanners behave like keyboard input
 * 
 * They typically:
 * - Enter barcode quickly
 * - End with Enter key
 * - System identifies it as barcode scan
 * 
 * @param options - Configuration options
 */
export const useBarcodeScanner = (options: UseBarcodeOptions) => {
  const {
    enabled = true,
    minLength = 3,
    scanTimeout = 100,
    endKeys = ['Enter'],
    onScan,
    onError,
  } = options;

  const { barcodeModeEnabled, shortcutsEnabled } = useShortcutStore();
  const barcodeRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanStartRef = useRef<number>(0);
  const lastCharTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  // Keep refs up to date
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  const resetBarcode = useCallback(() => {
    barcodeRef.current = '';
    scanStartRef.current = 0;
    lastCharTimeRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const completeScan = useCallback(async () => {
    const barcode = barcodeRef.current.trim();

    if (barcode.length < minLength) {
      if (onErrorRef.current) {
        onErrorRef.current(`Barcode too short (${barcode.length} < ${minLength})`);
      }
      resetBarcode();
      return;
    }

    try {
      await onScanRef.current(barcode);
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error instanceof Error ? error.message : 'Barcode scan failed');
      }
    }

    resetBarcode();
  }, [minLength, resetBarcode]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !barcodeModeEnabled || !shortcutsEnabled) {
        return;
      }

      // Ignore function keys (F1 - F12)
      if (event.key.startsWith('F') && /^F\d+$/.test(event.key)) {
        return;
      }

      const currentTime = Date.now();

      // Check if this is an end key (usually Enter)
      if (endKeys.includes(event.key)) {
        // Only treat as barcode scan if we have accumulated characters and they were entered fast
        const timeSinceLastChar = currentTime - lastCharTimeRef.current;
        if (barcodeRef.current.length > 0 && timeSinceLastChar <= 50) {
          event.preventDefault();
          event.stopPropagation();
          completeScan();
        } else {
          resetBarcode();
        }
        return;
      }

      // Check if we're in an input field
      const target = event.target as Element;
      const isInput = isInputElement(target);

      // If we are in an input element, only accumulate if it is explicitly designated as barcode input
      if (isInput && target.getAttribute('data-barcode-input') !== 'true') {
        return;
      }

      // Check for printable characters (no modifiers except shift)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Ignore special keys
      const specialKeys = [
        'Escape',
        'Tab',
        'Backspace',
        'Delete',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ];

      if (specialKeys.includes(event.key)) {
        return;
      }

      // Start scan timing on first character
      if (barcodeRef.current === '') {
        scanStartRef.current = currentTime;
      } else {
        // If the interval between characters is too long (> 50ms), it's probably manual input
        const timeSinceLastChar = currentTime - lastCharTimeRef.current;
        if (timeSinceLastChar > 50) {
          resetBarcode();
          scanStartRef.current = currentTime;
        }
      }
      lastCharTimeRef.current = currentTime;

      // Check if input is taking too long overall
      const timeSinceStart = currentTime - scanStartRef.current;
      if (timeSinceStart > 5000) {
        resetBarcode();
        return;
      }

      // Accumulate barcode
      barcodeRef.current += event.key;

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to complete scan if no more input
      timeoutRef.current = setTimeout(() => {
        if (barcodeRef.current.length >= minLength) {
          completeScan();
        }
        resetBarcode();
      }, scanTimeout);
    },
    [enabled, barcodeModeEnabled, shortcutsEnabled, scanTimeout, minLength, endKeys, completeScan, resetBarcode]
  );

  useEffect(() => {
    if (!enabled || !barcodeModeEnabled || !shortcutsEnabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      resetBarcode();
    };
  }, [enabled, barcodeModeEnabled, shortcutsEnabled, handleKeyDown, resetBarcode]);

  return {
    currentBarcode: barcodeRef.current,
    isScanning: barcodeRef.current.length > 0,
    reset: resetBarcode,
    complete: completeScan,
  };
};

export default useBarcodeScanner;
