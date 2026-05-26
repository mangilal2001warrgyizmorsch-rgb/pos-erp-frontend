"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  color?: "orange" | "emerald" | "slate" | "amber" | "rose" | "violet" | "cyan";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: "currency" | "number" | "percent";
  loading?: boolean;
}

const colorClasses = {
  orange: "text-orange-500 bg-orange-500/10",
  emerald: "text-emerald-500 bg-emerald-500/10",
  slate: "text-slate-500 bg-slate-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  rose: "text-rose-500 bg-rose-500/10",
  violet: "text-orange-500 bg-orange-500/10",
  cyan: "text-cyan-500 bg-cyan-500/10",
};

/**
 * Compact currency formatter that abbreviates large values
 * to prevent overflow in tight grid cells.
 * e.g. 6714906 → "₹67.1L", 42796 → "₹42,796"
 */
function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return formatCurrency(value);
}

export function AnalyticsCard({
  title,
  value,
  icon: Icon,
  color = "orange",
  trend,
  format = "number",
  loading = false,
}: AnalyticsCardProps) {
  const numValue = typeof value === "number" ? value : 0;

  const displayValue =
    format === "currency"
      ? formatCompactCurrency(numValue)
      : format === "percent"
        ? `${numValue.toFixed(2)}%`
        : typeof value === "number"
          ? value.toLocaleString("en-IN")
          : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-w-0"
    >
      <Card className="relative overflow-hidden border border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:border-border/60 transition-colors h-full">
        <CardHeader className="pb-1 pt-3 px-3 flex flex-row items-start justify-between space-y-0 gap-1">
          <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`p-1.5 rounded-lg shrink-0 ${colorClasses[color]}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="truncate text-xl font-bold tracking-tight leading-tight">
            {loading ? (
              <div className="h-7 w-20 bg-muted rounded animate-pulse" />
            ) : (
              displayValue
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-[10px] mt-1">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
              )}
              <span
                className={
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
