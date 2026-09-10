"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { GodownSettings } from "@/components/settings/GodownSettings";
import { useAuthStore } from "@/store/authStore";

export default function GodownsPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <PageHeader title="Stores / Godowns" />
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card rounded-xl border border-border/50">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access godown management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Stores / Godowns" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GodownSettings />
      </motion.div>
    </div>
  );
}
