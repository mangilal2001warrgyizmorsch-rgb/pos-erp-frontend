/**
 * Keyboard Shortcuts Settings Component
 * Settings for managing keyboard shortcuts
 */

'use client';

import React, { useState } from 'react';
import { useShortcutStore } from '@/store/shortcutStore';
import { ShortcutHelpModal } from '@/components/shortcuts/ShortcutHelpModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Keyboard, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

interface KeyboardShortcutsSettingsProps {
  className?: string;
}

export const KeyboardShortcutsSettings: React.FC<KeyboardShortcutsSettingsProps> = ({
  className = '',
}) => {
  const {
    shortcutsEnabled,
    barcodeModeEnabled,
    toggleShortcuts,
    toggleBarcodeMode,
    openHelpModal,
    getShortcutsByScope,
  } = useShortcutStore();

  const [showHelp, setShowHelp] = useState(false);

  const handleToggleShortcuts = () => {
    toggleShortcuts();
    toast.success(shortcutsEnabled ? 'Shortcuts disabled' : 'Shortcuts enabled');
  };

  const handleToggleBarcodeMode = () => {
    toggleBarcodeMode();
    toast.success(barcodeModeEnabled ? 'Barcode mode disabled' : 'Barcode mode enabled');
  };

  const totalShortcuts = Array.from(useShortcutStore.getState().registeredShortcuts.values()).length;
  const posShortcuts = getShortcutsByScope('pos');
  const salesShortcuts = getShortcutsByScope('sales');
  const purchaseShortcuts = getShortcutsByScope('purchase');
  const productShortcuts = getShortcutsByScope('products');

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>
            Configure keyboard shortcuts and improve your productivity
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Shortcuts Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Total Shortcuts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalShortcuts}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                POS Shortcuts
              </p>
              <p className="text-2xl font-bold text-blue-600">{posShortcuts.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Sales Shortcuts
              </p>
              <p className="text-2xl font-bold text-green-600">{salesShortcuts.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Purchase Shortcuts
              </p>
              <p className="text-2xl font-bold text-orange-600">{purchaseShortcuts.length}</p>
            </div>
          </div>

          {/* Enable/Disable Shortcuts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <Label className="text-base font-semibold cursor-pointer">
                  Enable Keyboard Shortcuts
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {shortcutsEnabled
                    ? 'Keyboard shortcuts are currently active'
                    : 'Keyboard shortcuts are currently disabled'}
                </p>
              </div>
              <Switch checked={shortcutsEnabled} onCheckedChange={handleToggleShortcuts} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Enable Barcode Scanner Mode
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {barcodeModeEnabled
                    ? 'Barcode scanner input is enabled'
                    : 'Barcode scanner input is disabled'}
                </p>
              </div>
              <Switch checked={barcodeModeEnabled} onCheckedChange={handleToggleBarcodeMode} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Shortcut Categories</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Badge variant="outline" className="justify-center">
                🌐 Global
              </Badge>
              <Badge variant="outline" className="justify-center">
                💳 POS ({posShortcuts.length})
              </Badge>
              <Badge variant="outline" className="justify-center">
                📊 Sales ({salesShortcuts.length})
              </Badge>
              <Badge variant="outline" className="justify-center">
                📦 Purchase ({purchaseShortcuts.length})
              </Badge>
              <Badge variant="outline" className="justify-center">
                📦 Products ({productShortcuts.length})
              </Badge>
              <Badge variant="outline" className="justify-center">
                👥 Parties
              </Badge>
            </div>
          </div>

          {/* Help Button */}
          <div className="pt-4 border-t space-y-3">
            <Button
              onClick={() => openHelpModal()}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              View All Keyboard Shortcuts
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-mono">Ctrl+/</kbd> anytime to open this help
            </p>
          </div>

          {/* Information */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <SettingsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Keyboard Shortcuts Tips:</p>
                <ul className="space-y-1 text-xs opacity-90">
                  <li>• Shortcuts don't work when typing in text fields</li>
                  <li>• Use the global search shortcut (Ctrl+K) to navigate quickly</li>
                  <li>• POS page has special shortcuts for faster billing (F1-F12)</li>
                  <li>• Barcode scanner mode auto-detects rapid barcode input</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShortcutHelpModal />
    </>
  );
};

export default KeyboardShortcutsSettings;
