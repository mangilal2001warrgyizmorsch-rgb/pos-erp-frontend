"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { AnalyticsCard } from "./AnalyticsCard";
import { ReportChartCard } from "./ReportChartCard";
import { ReportTable } from "./ReportTable";
import { analyticsService } from "@/services/analyticsService";
import type { AnalyticsFilters } from "./FilterBar";
import { formatCurrency } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface InventoryAnalyticsDashboardProps {
  period?: Period;
  filters?: AnalyticsFilters;
}

export function InventoryAnalyticsDashboard({
  period = "monthly",
  filters = {},
}: InventoryAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getInventoryAnalytics({ ...filters, period });
      setData(result);
    } catch (error) {
      toast.error("Failed to load inventory analytics");
    } finally {
      setLoading(false);
    }
  }, [period, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const stockOverview = data?.charts?.stockOverview
    ? [
        { name: "In Stock", value: data.charts.stockOverview.inStock },
        { name: "Low Stock", value: data.charts.stockOverview.lowStock },
        { name: "Out of Stock", value: data.charts.stockOverview.outOfStock },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <AnalyticsCard
          title="Total Products"
          value={data?.summary?.totalProducts || 0}
          icon={Package}
          color="indigo"
          format="number"
          loading={loading}
        />
        <AnalyticsCard
          title="Inventory Value"
          value={data?.summary?.currentInventoryValue || 0}
          icon={DollarSign}
          color="emerald"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Inventory Cost"
          value={data?.summary?.totalInventoryCost || 0}
          icon={DollarSign}
          color="blue"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Potential Profit"
          value={data?.summary?.potentialProfit || 0}
          icon={TrendingUp}
          color="violet"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Low Stock"
          value={data?.summary?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="amber"
          format="number"
          loading={loading}
        />
        <AnalyticsCard
          title="Out of Stock"
          value={data?.summary?.outOfStockProducts || 0}
          icon={AlertCircle}
          color="rose"
          format="number"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Inventory Overview Bar Chart */}
        <ReportChartCard
          title="Inventory Overview"
          description="Stock quantity vs value distribution (in thousands)"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Metrics",
                    "Value": (data?.summary?.currentInventoryValue || 0) / 1000,
                    "Cost": (data?.summary?.totalInventoryCost || 0) / 1000,
                    "Profit": (data?.summary?.potentialProfit || 0) / 1000,
                  },
                ]}
                margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}K`}
                  width={65}
                />
                <Tooltip
                  formatter={(value) => `₹${Number(value || 0).toFixed(1)}K`}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Bar dataKey="Value" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Cost" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>

        {/* Category-wise Inventory Pie */}
        <ReportChartCard
          title="Category-wise Inventory"
          description="Inventory value distribution by category"
          loading={loading}
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.categoryWiseInventory || []}
                  dataKey="inventoryValue"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={40}
                >
                  {(data?.charts?.categoryWiseInventory || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      </div>

      {/* Stock Overview Donut Chart */}
      {stockOverview.length > 0 && stockOverview.some((s) => s.value > 0) && (
        <ReportChartCard
          title="Stock Status Overview"
          description="Products by stock status"
          loading={loading}
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockOverview}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  innerRadius={45}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      )}

      {/* Summary Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 md:grid-cols-3"
      >
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Inventory Cost</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(data?.summary?.totalInventoryCost || 0)}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Potential Profit</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {formatCurrency(data?.summary?.potentialProfit || 0)}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Profit Margin</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">
            {(data?.summary?.currentInventoryValue || 0) > 0
              ? (
                  ((data?.summary?.potentialProfit || 0) /
                    (data?.summary?.currentInventoryValue || 1)) *
                  100
                ).toFixed(2)
              : 0}
            %
          </p>
        </div>
      </motion.div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable
          title="Inventory Valuation"
          data={data?.table || []}
          columns={[
            { key: "productName" as any, label: "Product" },
            { key: "barcode" as any, label: "Barcode" },
            { key: "category" as any, label: "Category" },
            { key: "currentStock" as any, label: "Stock" },
            {
              key: "inventoryValue" as any,
              label: "Value",
              format: (v) => formatCurrency(v),
            },
            { key: "status" as any, label: "Status" },
          ]}
          searchKey={"productName" as any}
          maxRows={8}
          loading={loading}
        />

        <ReportTable
          title="Low Stock Alerts"
          data={data?.widgets?.lowStockAlerts || []}
          columns={[
            { key: "name" as any, label: "Product" },
            { key: "sku" as any, label: "SKU" },
            { key: "stock" as any, label: "Stock" },
            { key: "lowStockThreshold" as any, label: "Threshold" },
            {
              key: "sellingPrice" as any,
              label: "Price",
              format: (v) => formatCurrency(v),
            },
          ]}
          maxRows={8}
          loading={loading}
        />
      </div>
    </div>
  );
}
