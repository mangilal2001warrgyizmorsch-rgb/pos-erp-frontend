"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import { saleService } from "@/services/saleService";
import { productService } from "@/services/productService";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart, DollarSign, TrendingUp, Package,
} from "lucide-react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesReport, setSalesReport] = useState<{
    report: Array<{ _id: string; totalSales: number; totalRevenue: number; avgOrderValue: number }>;
    summary: { totalSales: number; totalRevenue: number; totalDiscount: number; totalTax: number; avgOrderValue: number };
  } | null>(null);
  const [productStats, setProductStats] = useState<{
    totalProducts: number; lowStockProducts: number; outOfStock: number;
    inventoryValue: number; inventoryCost: number;
  } | null>(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [sales, products] = await Promise.all([
        saleService.getSalesReport({ startDate: startDate || undefined, endDate: endDate || undefined, groupBy: "day" }),
        productService.getStats(),
      ]);
      setSalesReport(sales);
      setProductStats(products);
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  };

  const chartData = salesReport?.report.map((r) => ({
    date: r._id,
    revenue: r.totalRevenue,
    sales: r.totalSales,
    avg: Math.round(r.avgOrderValue),
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" icon={BarChart3} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Business analytics & insights" icon={BarChart3}>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />Export
        </Button>
      </PageHeader>

      {/* Date filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
        </div>
        <Button size="sm" onClick={loadReports}>Apply</Button>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Sales" value={salesReport?.summary.totalSales || 0} icon={ShoppingCart} color="indigo" />
            <StatCard title="Total Revenue" value={formatCurrency(salesReport?.summary.totalRevenue || 0)} icon={DollarSign} color="emerald" />
            <StatCard title="Avg Order Value" value={formatCurrency(salesReport?.summary.avgOrderValue || 0)} icon={TrendingUp} color="blue" />
            <StatCard title="Total Discount" value={formatCurrency(salesReport?.summary.totalDiscount || 0)} icon={DollarSign} color="amber" />
          </div>

          {/* Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length > 0 ? chartData : [{ date: "No data", revenue: 0, sales: 0, avg: 0 }]}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales Count Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle>Daily Sales Count</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.length > 0 ? chartData : [{ date: "No data", revenue: 0, sales: 0, avg: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)" }} />
                      <Bar dataKey="sales" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Products" value={productStats?.totalProducts || 0} icon={Package} color="indigo" />
            <StatCard title="Low Stock" value={productStats?.lowStockProducts || 0} icon={Package} color="amber" />
            <StatCard title="Out of Stock" value={productStats?.outOfStock || 0} icon={Package} color="rose" />
            <StatCard title="Inventory Value" value={formatCurrency(productStats?.inventoryValue || 0)} icon={DollarSign} color="emerald" />
          </div>

          <Card>
            <CardHeader><CardTitle>Inventory Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Inventory Value (Selling)</p>
                  <p className="text-2xl font-bold">{formatCurrency(productStats?.inventoryValue || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Inventory Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(productStats?.inventoryCost || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Potential Profit</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency((productStats?.inventoryValue || 0) - (productStats?.inventoryCost || 0))}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Items Needing Restock</p>
                  <p className="text-2xl font-bold text-amber-600">{productStats?.lowStockProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
