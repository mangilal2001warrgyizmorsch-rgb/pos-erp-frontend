"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import api from "@/services/api";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";

const RETRY_INTERVAL_MS = 30_000; // Retry every 30 seconds when there are pending items

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await db.offlineSales.where('status').anyOf('pending', 'failed').count();
      const queuePending = await db.syncQueue.where('status').anyOf('pending', 'failed').count();
      setPendingCount(pending + queuePending);
      return pending + queuePending;
    } catch {
      return 0;
    }
  }, []);

  const syncData = useCallback(async () => {
    if (!navigator.onLine) return;
    if (isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // 1. Sync Offline Sales (pending AND failed — retry failed ones too)
      const pendingSales = await db.offlineSales
        .where('status')
        .anyOf('pending', 'failed')
        .toArray();
      
      for (const sale of pendingSales) {
        try {
          await db.offlineSales.update(sale.id!, { status: 'syncing' });
          
          await api.post("/sales", sale.payload);
          
          await db.offlineSales.delete(sale.id!);
          syncedCount++;
          console.log(`[OfflineSync] Synced offline sale: ${sale.uuid}`);
        } catch (error: any) {
          failedCount++;
          const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
          const isAuthError = error.response?.status === 401;
          
          console.error("[OfflineSync] Failed to sync sale:", sale.uuid, error.message);
          
          await db.offlineSales.update(sale.id!, { 
            status: 'failed',
            errorMessage: isAuthError
              ? 'Authentication expired. Please log in again.'
              : isNetworkError
                ? 'Server unreachable. Will retry automatically.'
                : error?.response?.data?.message || error?.message || 'Unknown error'
          });
          
          // If it's a network error, stop trying the rest — server is down
          if (isNetworkError) break;
        }
      }

      // 2. Sync Queue (e.g. created customers)
      const pendingQueue = await db.syncQueue
        .where('status')
        .anyOf('pending', 'failed')
        .toArray();
      
      for (const item of pendingQueue) {
        try {
          await db.syncQueue.update(item.id!, { status: 'syncing' });
          
          if (item.operation === 'create_customer') {
            await api.post("/customers", item.payload);
          }
          
          await db.syncQueue.delete(item.id!);
          syncedCount++;
          console.log(`[OfflineSync] Synced queue item: ${item.operation}`);
        } catch (error: any) {
          failedCount++;
          const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
          
          await db.syncQueue.update(item.id!, { 
            status: 'failed',
            errorMessage: error?.response?.data?.message || error?.message || 'Unknown error'
          });
          
          if (isNetworkError) break;
        }
      }

      if (syncedCount > 0) {
        toast.success(`${syncedCount} offline ${syncedCount === 1 ? 'entry' : 'entries'} synced successfully!`);
      }
    } catch (error) {
      console.error("[OfflineSync] Sync process encountered an error:", error);
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [isSyncing, refreshPendingCount]);

  // Online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing data...");
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are offline. Operating in offline mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync on mount
    if (navigator.onLine) {
      // Small delay to let auth initialize
      setTimeout(() => {
        syncData();
      }, 3000);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncData]);

  // Periodic retry timer — fires every 30s if there are pending items
  useEffect(() => {
    const startRetryTimer = async () => {
      const count = await refreshPendingCount();
      
      // Clear existing timer
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      
      if (count > 0 && navigator.onLine) {
        retryTimerRef.current = setInterval(async () => {
          if (navigator.onLine && !isSyncing) {
            console.log("[OfflineSync] Periodic retry triggered...");
            await syncData();
            const remaining = await refreshPendingCount();
            if (remaining === 0 && retryTimerRef.current) {
              clearInterval(retryTimerRef.current);
              retryTimerRef.current = null;
            }
          }
        }, RETRY_INTERVAL_MS);
      }
    };
    
    startRetryTimer();
    
    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
      }
    };
  }, [pendingCount, isSyncing, syncData, refreshPendingCount]);

  // Check pending count on mount and periodically
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10_000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Only show banner when there are pending items
  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500 shrink-0" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
            {pendingCount} offline {pendingCount === 1 ? 'entry' : 'entries'} pending sync
          </span>
        </div>
        
        {isOnline && (
          <button
            onClick={() => syncData()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
