"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Percent,
  Gift,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

interface SalesAnalyticsDashboardProps {
  period?: Period;
  filters?: AnalyticsFilters;
}

export function SalesAnalyticsDashboard({
  period = "monthly",
  filters = {},
}: SalesAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getSalesAnalytics({ ...filters, period });
      setData(result);
    } catch (error) {
      toast.error("Failed to load sales analytics");
    } finally {
      setLoading(false);
    }
  }, [period, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-5">
      {/* Summary Cards - Row 1 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Sales"
          value={data?.summary?.totalSales || 0}
          icon={ShoppingCart}
          color="orange"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Total Revenue"
          value={data?.summary?.totalRevenue || 0}
          icon={DollarSign}
          color="emerald"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Gross Profit"
          value={data?.summary?.grossProfit || 0}
          icon={TrendingUp}
          color="slate"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Net Profit"
          value={data?.summary?.netProfit || 0}
          icon={BarChart3}
          color="orange"
          format="currency"
          loading={loading}
        />
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Avg Order Value"
          value={data?.summary?.averageOrderValue || 0}
          icon={DollarSign}
          color="cyan"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Total Discount"
          value={data?.summary?.totalDiscounts || 0}
          icon={Gift}
          color="amber"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Total Tax"
          value={data?.summary?.totalTax || 0}
          icon={Percent}
          color="rose"
          format="currency"
          loading={loading}
        />
        <AnalyticsCard
          title="Purchase Cost"
          value={data?.summary?.purchaseCost || 0}
          icon={ShoppingCart}
          color="orange"
          format="currency"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Sales Trend */}
        <ReportChartCard
          title="Sales Trend"
          description="Sales value over time"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts?.salesTrend || []}>
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
                  dataKey="totalSales"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="Sales Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>

        {/* Revenue Trend */}
        <ReportChartCard
          title="Revenue Trend"
          description="Revenue trend (after costs & expenses)"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Category-wise Sales */}
        <ReportChartCard
          title="Category-wise Sales"
          description="Sales distribution by product category"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.categoryWiseSales || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  interval={0}
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
                <Bar
                  dataKey="totalSales"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  name="Sales Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>

        {/* Top Selling Products */}
        <ReportChartCard
          title="Top 5 Selling Products"
          description="By quantity sold"
          loading={loading}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data?.charts?.topSellingProducts || []).slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  dataKey="productName"
                  type="category"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  width={100}
                  tickFormatter={(v) => v?.length > 14 ? v.slice(0, 14) + "…" : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Bar
                  dataKey="quantitySold"
                  fill="#10b981"
                  radius={[0, 6, 6, 0]}
                  name="Qty Sold"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportChartCard>
      </div>

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 grid-cols-2 lg:grid-cols-4"
      >
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Profit Margin</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {(data?.summary?.totalSales || 0) > 0
              ? (
                  ((data?.summary?.netProfit || 0) /
                    (data?.summary?.totalSales || 1)) *
                  100
                ).toFixed(2)
              : 0}
            %
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {formatCurrency(data?.summary?.expenses || 0)}
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Gross Profit %</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">
            {(data?.summary?.totalSales || 0) > 0
              ? (
                  ((data?.summary?.grossProfit || 0) /
                    (data?.summary?.totalSales || 1)) *
                  100
                ).toFixed(2)
              : 0}
            %
          </p>
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">
            {data?.summary?.orderCount || 0}
          </p>
        </div>
      </motion.div>

      {/* Sales Table */}
      <ReportTable
        title="Recent Sales Transactions"
        data={data?.table || []}
        columns={[
          { key: "invoiceNumber" as any, label: "Invoice" },
          { key: "customerName" as any, label: "Customer" },
          { key: "productsCount" as any, label: "Products" },
          {
            key: "totalAmount" as any,
            label: "Amount",
            format: (v) => formatCurrency(v),
          },
          {
            key: "discount" as any,
            label: "Discount",
            format: (v) => formatCurrency(v),
          },
          {
            key: "tax" as any,
            label: "Tax",
            format: (v) => formatCurrency(v),
          },
          {
            key: "revenue" as any,
            label: "Revenue",
            format: (v) => formatCurrency(v),
          },
          {
            key: "date" as any,
            label: "Date",
            format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-",
          },
        ]}
        maxRows={15}
        loading={loading}
      />
    </div>
  );
}
