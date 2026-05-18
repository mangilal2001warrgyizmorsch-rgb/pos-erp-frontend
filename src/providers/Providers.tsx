"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { Toaster } from "sonner";
import { KeyboardShortcutProvider } from "@/providers/KeyboardShortcutProvider";
import { ShortcutHelpModal } from "@/components/shortcuts/ShortcutHelpModal";
import { SyncProvider } from "@/providers/SyncProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <KeyboardShortcutProvider>
        <SyncProvider>
          {children}
        </SyncProvider>
        <ShortcutHelpModal />
      </KeyboardShortcutProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={theme}
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
        }}
      />
    </>
  );
}
