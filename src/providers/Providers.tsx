"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { Toaster } from "sonner";
import { KeyboardShortcutProvider } from "@/providers/KeyboardShortcutProvider";
import { ShortcutHelpModal } from "@/components/shortcuts/ShortcutHelpModal";

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
        {children}
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
