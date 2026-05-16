/**
 * ShortcutHelpModal Component
 * Beautiful modal showing all keyboard shortcuts organized by category
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useShortcutStore } from '@/store/shortcutStore';
import { ShortcutBadge } from './ShortcutBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Keyboard, Command, MousePointer2 } from 'lucide-react';
import type { ShortcutScope, Shortcut } from '@/types/shortcuts';

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: '🌐 Global',
  pos: '💳 POS Billing',
  sales: '📊 Sales',
  purchase: '📦 Purchase',
  products: '📦 Products',
  parties: '👥 Parties',
  reports: '📈 Reports',
  tables: '📋 Tables',
  forms: '📝 Forms',
};

interface ShortcutGroup {
  scope: ShortcutScope;
  label: string;
  shortcuts: Shortcut[];
}

export const ShortcutHelpModal: React.FC = () => {
  const { helpModalOpen, closeHelpModal, registeredShortcuts } = useShortcutStore();
  const [searchTerm, setSearchTerm] = useState('');

  const groups = useMemo(() => {
    const groupMap = new Map<ShortcutScope, Shortcut[]>();

    // Initialize groups
    const scopes: ShortcutScope[] = ['global', 'pos', 'sales', 'purchase', 'products', 'parties', 'reports', 'tables', 'forms'];
    scopes.forEach((scope) => {
      groupMap.set(scope, []);
    });

    // Group shortcuts
    Array.from(registeredShortcuts.values()).forEach((shortcut) => {
      const shortcutScopes = Array.isArray(shortcut.scope) ? shortcut.scope : [shortcut.scope];
      shortcutScopes.forEach((scope) => {
        if (groupMap.has(scope)) {
          groupMap.get(scope)!.push(shortcut);
        }
      });
    });

    // Convert to array and sort by scope order
    const result: ShortcutGroup[] = scopes
      .map((scope) => ({
        scope,
        label: SCOPE_LABELS[scope],
        shortcuts: (groupMap.get(scope) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }))
      .filter((group) => group.shortcuts.length > 0);

    return result;
  }, [registeredShortcuts]);

  // Filter shortcuts based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return groups;
    }

    const term = searchTerm.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (shortcut) =>
            shortcut.name.toLowerCase().includes(term) ||
            shortcut.description.toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.shortcuts.length > 0);
  }, [groups, searchTerm]);

  return (
    <Dialog open={helpModalOpen} onOpenChange={closeHelpModal}>
      <DialogContent className="max-w-2xl h-[85vh] sm:h-[75vh] flex flex-col p-0 gap-0 overflow-hidden border-gray-800 bg-[#0a0c10]/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="p-6 pb-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Keyboard className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Master these shortcuts to optimize your workflow
              </DialogDescription>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-colors group-focus-within:text-blue-400" />
            <Input
              placeholder="Search by action or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-white placeholder:text-gray-600 rounded-xl transition-all h-11"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 mt-6">
          {filteredGroups.length > 0 ? (
            <Tabs
              defaultValue={filteredGroups[0]?.scope || 'global'}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Scrollable Tabbar */}
              <div className="px-6 border-b border-gray-800/50">
                <TabsList className="w-full flex justify-start h-auto p-0 bg-transparent overflow-x-auto no-scrollbar scroll-smooth gap-2 pb-2">
                  {filteredGroups.map((group) => (
                    <TabsTrigger
                      key={group.scope}
                      value={group.scope}
                      className="flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg border border-transparent transition-all
                        data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/20
                        data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-300 data-[state=inactive]:hover:bg-gray-800/50"
                    >
                      {group.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 relative">
                {filteredGroups.map((group) => (
                  <TabsContent
                    key={group.scope}
                    value={group.scope}
                    className="absolute inset-0 mt-0 focus-visible:outline-none data-[state=active]:flex flex-col"
                  >
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 no-scrollbar">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-800/40 hover:border-gray-700/50 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">
                              {shortcut.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {shortcut.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <ShortcutBadge
                              keys={shortcut.keys}
                              variant="outline"
                              className="scale-110 shadow-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-3">
              <Search className="w-12 h-12 text-gray-800" />
              <p className="text-sm font-medium">No shortcuts found matching "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-xs text-blue-400 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="p-4 px-6 border-t border-gray-800/50 bg-gray-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" />
              Click to view
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              Power user mode
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 italic">
            Tip: Shortcuts are disabled in text fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelpModal;

