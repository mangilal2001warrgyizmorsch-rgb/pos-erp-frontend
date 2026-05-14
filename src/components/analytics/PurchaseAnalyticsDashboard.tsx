"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Building2,
  Package,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

interface PurchaseAnalyticsDashboardProps {
  period?: Period;
  filters?: AnalyticsFilters;
}

export function PurchaseAnalyticsDashboard({
  period = "monthly",
  filters = {},
}: PurchaseAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getPurchaseAnalytics({ ...filters, period });
      setData(result);
    } catch (error) {
      toast.error("Failed to load purchase analytics");
    } finally {
      setLoading(false);
    }
  }, [period, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <AnalyticsCard
          title="Total Purchases"
          value={data?.summary?.totalPurchases || 0}
          icon={ShoppingCart}
          color="indigo"
          format="number"
          loading={loading}
        />
        <AnalyticsCard
          title="Purchase Amount"
          value={data?.summary?.totalPurchaseAmount || 0}
          icon={DollarSign}
          color="emerald"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Suppliers"
          value={data?.summary?.supplierCount || 0}
          icon={Building2}
          color="violet"
          format="number"
          loading={loading}
        />
        <AnalyticsCard
          title="Avg Purchase"
          value={data?.summary?.averagePurchaseValue || 0}
          icon={TrendingUp}
          color="blue"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Pending Payments"
          value={data?.summary?.pendingPayments || 0}
          icon={Clock}
          color="amber"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Products Purchased"
          value={data?.summary?.totalPurchasedProducts || 0}
          icon={Package}
          color="cyan"
          format="number"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Purchase Trend */}
        <ReportChartCard
          title="Purchase Trend"
          description="Purchase count over time"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts?.purchaseTrend || []}>
                <defs>
                  <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="_id"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalPurchases"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorPurchase)"
                  name="Purchase Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>

        {/* Purchase Amount Trend */}
        <ReportChartCard
          title="Purchase Amount Trend"
          description="Total purchase value over time"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.purchaseTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="_id"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalPurchaseAmount"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Purchase Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Supplier-wise Purchases */}
        <ReportChartCard
          title="Top Suppliers"
          description="Purchase amount by supplier"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data?.charts?.supplierPurchaseChart || []).slice(0, 8)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  dataKey="supplierName"
                  type="category"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  width={120}
                  tickFormatter={(v) => v?.length > 16 ? v.slice(0, 16) + "…" : v}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Bar
                  dataKey="totalPurchaseAmount"
                  fill="#6366f1"
                  radius={[0, 6, 6, 0]}
                  name="Purchase Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>

        {/* Category-wise Purchases */}
        <ReportChartCard
          title="Category-wise Purchases"
          description="Purchase distribution by category"
          loading={loading}
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts?.purchaseCategoryChart || []}
                  dataKey="purchaseAmount"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={40}
                >
                  {(data?.charts?.purchaseCategoryChart || []).map((_: any, index: number) => (
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

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 md:grid-cols-3"
      >
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Tax</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(data?.charts?.purchaseTrend?.reduce((sum: number, item: any) => sum + (item.totalTax || 0), 0) || 0)}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Supplier Count</p>
          <p className="text-2xl font-bold text-indigo-500 mt-1">
            {data?.summary?.supplierCount || 0}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Category Count</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {data?.charts?.purchaseCategoryChart?.length || 0}
          </p>
        </div>
      </motion.div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable
          title="Top Suppliers"
          data={data?.charts?.supplierPurchaseChart || []}
          columns={[
            { key: "supplierName" as any, label: "Supplier" },
            { key: "totalPurchases" as any, label: "Orders" },
            {
              key: "totalPurchaseAmount" as any,
              label: "Total Amount",
              format: (v) => formatCurrency(v),
            },
          ]}
          maxRows={8}
          loading={loading}
        />

        <ReportTable
          title="Recent Purchases"
          data={data?.table || []}
          columns={[
            { key: "purchaseInvoice" as any, label: "PO Number" },
            { key: "supplierName" as any, label: "Supplier" },
            { key: "productCount" as any, label: "Products" },
            {
              key: "purchaseAmount" as any,
              label: "Amount",
              format: (v) => formatCurrency(v),
            },
            {
              key: "tax" as any,
              label: "Tax",
              format: (v) => formatCurrency(v),
            },
            { key: "paymentStatus" as any, label: "Payment" },
            {
              key: "date" as any,
              label: "Date",
              format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-",
            },
          ]}
          maxRows={8}
          loading={loading}
        />
      </div>
    </div>
  );
}
