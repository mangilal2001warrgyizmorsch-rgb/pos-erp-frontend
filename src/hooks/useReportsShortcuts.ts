/**
 * useReportsShortcuts Hook
 * Handles all Reports module shortcuts
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useShortcutScope } from '@/hooks/useKeyboardShortcut';
import { useShortcutStore } from '@/store/shortcutStore';
import { createShortcuts } from '@/constants/shortcuts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseReportsShortcutsOptions {
  onGenerate?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onDateRange?: () => void;
}

export const useReportsShortcuts = (options: UseReportsShortcutsOptions = {}) => {
  const router = useRouter();
  const { registerShortcut } = useShortcutStore();

  // Activate reports scope
  useShortcutScope('reports');

  const handleGenerate = useCallback(() => {
    options.onGenerate?.();
    toast.success('Generating report...');
  }, [options]);

  const handleExportPDF = useCallback(() => {
    options.onExportPDF?.();
    toast.success('Exporting to PDF...');
  }, [options]);

  const handleExportExcel = useCallback(() => {
    options.onExportExcel?.();
    toast.success('Exporting to Excel...');
  }, [options]);

  const handlePrint = useCallback(() => {
    options.onPrint?.();
    toast.success('Printing report...');
  }, [options]);

  const handleDateRange = useCallback(() => {
    options.onDateRange?.();
  }, [options]);

  // Register implementation handlers globally
  useEffect(() => {
    const reportsHandlers = {
      'reports.generate': handleGenerate,
      'reports.exportPDF': handleExportPDF,
      'reports.exportExcel': handleExportExcel,
      'reports.print': handlePrint,
      'reports.dateRange': handleDateRange,
    };

    const shortcuts = createShortcuts(router, reportsHandlers);
    
    Object.keys(shortcuts).forEach(id => {
      if (id.startsWith('reports.')) {
        registerShortcut(shortcuts[id]);
      }
    });
  }, [
    router, registerShortcut, 
    handleGenerate, handleExportPDF, handleExportExcel, handlePrint, handleDateRange
  ]);

  return {
    handleGenerate,
    handleExportPDF,
    handleExportExcel,
    handlePrint,
    handleDateRange,
  };
};

export default useReportsShortcuts;
