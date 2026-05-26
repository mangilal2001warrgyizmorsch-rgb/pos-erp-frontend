"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "orange" | "indigo" | "slate" | "emerald" | "amber" | "rose" | "blue";
  className?: string;
}

const colorMap = {
  orange:
    "from-orange-500/10 to-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20",
  indigo:
    "from-orange-500/10 to-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20",
  emerald:
    "from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  slate:
    "from-slate-500/10 to-slate-500/5 text-slate-600 dark:text-slate-400 border-slate-500/20",
  amber:
    "from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
  rose: "from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20",
  blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

const iconBgMap = {
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  indigo: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "indigo",
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-shadow duration-300 hover:shadow-lg",
        colorMap[color],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-xl p-3 absolute top-2 right-2",
            iconBgMap[color],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
