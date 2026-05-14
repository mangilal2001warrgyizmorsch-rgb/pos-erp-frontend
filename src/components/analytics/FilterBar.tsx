"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  product?: string;
  supplier?: string;
  customer?: string;
  search?: string;
}

interface FilterBarProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  filters?: AnalyticsFilters;
  onFiltersChange?: (filters: AnalyticsFilters) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function FilterBar({
  period,
  onPeriodChange,
  filters = {},
  onFiltersChange,
  onDateRangeChange,
  isLoading = false,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof AnalyticsFilters, value: string) => {
    onFiltersChange?.({ ...filters, [key]: value || undefined });
  };

  const activeFilterCount = [
    filters.search,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange?.({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Period tabs + filter toggle in one compact row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPeriodChange(p)}
              className={`h-9 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              disabled={isLoading}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </motion.button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-9 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 rounded-xl border border-border/40 bg-card/70 p-4 backdrop-blur-sm md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.search || ""}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder="Invoice, product, customer..."
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  className="h-9"
                  onChange={(e) => {
                    updateFilter("startDate", e.target.value);
                    if (e.target.value && filters.endDate)
                      onDateRangeChange?.(e.target.value, filters.endDate);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  className="h-9"
                  onChange={(e) => {
                    updateFilter("endDate", e.target.value);
                    if (filters.startDate && e.target.value)
                      onDateRangeChange?.(filters.startDate, e.target.value);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
