"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Warehouse, 
  AlertTriangle, 
  ArrowUpDown, 
  CheckCircle2, 
  History, 
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService } from "@/services/productService";
import { stockService } from "@/services/stockService";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { getSocket } from "@/lib/socket";
import { format } from "date-fns";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("current");
  
  // Tab 1: Current Stock levels state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Tab 2: Stock history state
  const [movements, setMovements] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("all");

  // Load current stock
  const loadCurrentStock = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productService.getAll({ search, limit: 100 });
      setProducts(result.data);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Load stock movements history
  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const params: any = { limit: 100 };
      if (historySearch) params.search = historySearch;
      if (historyType !== "all") params.type = historyType;
      
      const res = await stockService.getMovements(params);
      setMovements(res.data);
    } catch {
      toast.error("Failed to load stock movements");
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch, historyType]);

  useEffect(() => {
    loadCurrentStock();
  }, [loadCurrentStock]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    
    const handleInventoryUpdated = (data: { productId: string; stock: number }) => {
      setProducts((prevProducts) => 
        prevProducts.map((p) => 
          p._id === data.productId ? { ...p, stock: data.stock } : p
        )
      );
      if (activeTab === "history") {
        loadHistory();
      }
    };

    socket.on("inventory:updated", handleInventoryUpdated);
    
    return () => {
      socket.off("inventory:updated", handleInventoryUpdated);
    };
  }, [activeTab, loadHistory]);

  const getStockStatus = (stock: number, threshold: number = 10) => {
    if (stock <= 0) return { label: "Out of Stock", variant: "destructive", icon: AlertTriangle };
    if (stock <= threshold) return { label: "Low Stock", variant: "warning", icon: ArrowUpDown };
    return { label: "In Stock", variant: "default", icon: CheckCircle2 };
  };

  // Calculate dynamic unified inventory value
  const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchasePrice || 0)), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Manager"
        description="Monitor current levels, low stock parameters, and historical stock movements in real time"
        icon={Warehouse}
      />

      {/* Top Aggregate valuation banner */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
              <TabsTrigger value="current" className="text-xs font-semibold flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                <span>Current Stock</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-semibold flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                <span>Stock Movement</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/inventory/opening-stock" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-xs font-semibold gap-1.5 h-9 rounded-xl shadow-md">
              <Boxes className="h-4 w-4" />
              Opening Stock Entry
            </Button>
          </Link>
        </div>

        <Card className="px-4 py-2 border-primary/20 bg-primary/5 flex items-center gap-3 w-full sm:w-auto shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Inventory Valuation</p>
            <p className="text-lg font-bold text-primary font-mono tracking-tight">{formatCurrency(totalValue)}</p>
          </div>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "current" ? (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Tab 1: Current Stock Levels Search input */}
            <div className="flex items-center justify-between">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search products by SKU, name or barcode..."
                className="max-w-md w-full"
              />
            </div>

            {loading ? (
              <TableSkeleton rows={8} />
            ) : products.length === 0 ? (
              <EmptyState title="No stock items found" description="Try adjusting your current search parameters." />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground w-12 whitespace-nowrap">#</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Product Details</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell whitespace-nowrap">Category</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Current Stock</th>
                        <th className="text-center p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => {
                        const status = getStockStatus(p.stock, p.lowStockThreshold);
                        const StatusIcon = status.icon;

                        return (
                          <motion.tr
                            key={p._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="border-b border-border/50 hover:bg-muted/15 transition-colors whitespace-nowrap"
                          >
                            <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap">{i + 1}</td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="h-full w-full rounded-lg object-cover" />
                                  ) : (
                                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="whitespace-nowrap">
                                  <p className="font-semibold text-sm text-foreground whitespace-nowrap">{p.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                                    SKU: {p.sku} {p.barcode ? `| Barcode: ${p.barcode}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm hidden md:table-cell whitespace-nowrap text-muted-foreground">
                              {typeof p.category === "object" && p.category !== null && "name" in p.category 
                                ? String(p.category.name) 
                                : typeof p.category === "string" ? p.category : "—"}
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <span className="text-base sm:text-lg font-bold font-mono text-foreground">
                                {p.stock}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold ml-1.5 uppercase">{p.unit}</span>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <Badge 
                                variant={status.variant as any} 
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                              >
                                <StatusIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                {status.label}
                              </Badge>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Tab 2: Stock History Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SearchInput
                value={historySearch}
                onChange={setHistorySearch}
                placeholder="Filter movements by product details, reference ID..."
                className="flex-1 max-w-none w-full"
              />

              <div className="w-full sm:w-48">
                <Select value={historyType} onValueChange={setHistoryType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="purchase">Purchases (+)</SelectItem>
                    <SelectItem value="sale">Sales (-)</SelectItem>
                    <SelectItem value="return">Returns (Refunds/Claims)</SelectItem>
                    <SelectItem value="adjustment">Adjustments (+/-)</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                    <SelectItem value="cancellation">Cancellations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historyLoading ? (
              <TableSkeleton rows={8} />
            ) : movements.length === 0 ? (
              <EmptyState title="No movements found" description="Try clearing filters or checking adjustments." />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Date & Time</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Product Details</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Change Type</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground text-right whitespace-nowrap">Change Qty</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground text-center whitespace-nowrap">Stock Shift</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Reference</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell whitespace-nowrap">Operator</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m, i) => {
                        const isPositive = m.quantity > 0;
                        return (
                          <motion.tr
                            key={m._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="border-b border-border/50 hover:bg-muted/15 transition-colors whitespace-nowrap"
                          >
                            {/* Date & Time */}
                            <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
                                {format(new Date(m.createdAt), "dd/MM/yyyy hh:mm a")}
                              </div>
                            </td>

                            {/* Product Details */}
                            <td className="p-4 whitespace-nowrap">
                              <div className="whitespace-nowrap">
                                <p className="font-semibold text-sm text-foreground whitespace-nowrap">
                                  {m.productName || m.product?.name || "Deleted Product"}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                                  SKU: {m.product?.sku || "—"}
                                </p>
                              </div>
                            </td>

                            {/* Change Type badge */}
                            <td className="p-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                  m.type === "purchase" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                                } ${
                                  m.type === "sale" && "bg-orange-500/10 text-orange-600 dark:text-orange-500"
                                } ${
                                  m.type === "return" && "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                                } ${
                                  m.type === "adjustment" && "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                                } ${
                                  m.type === "transfer" && "bg-orange-500/10 text-orange-600 dark:text-orange-500"
                                } ${
                                  m.type === "cancellation" && "bg-rose-500/10 text-rose-600 dark:text-rose-500"
                                }`}
                              >
                                {m.type}
                              </span>
                            </td>

                            {/* Change Quantity adjustment */}
                            <td className="p-4 text-right whitespace-nowrap">
                              <span
                                className={`text-base font-black font-mono flex items-center justify-end gap-1 whitespace-nowrap ${
                                  isPositive ? "text-emerald-500" : "text-rose-500"
                                }`}
                              >
                                {isPositive ? (
                                  <ArrowUpRight className="h-4.5 w-4.5 shrink-0 inline" />
                                ) : (
                                  <ArrowDownLeft className="h-4.5 w-4.5 shrink-0 inline" />
                                )}
                                {isPositive ? `+${m.quantity}` : `${m.quantity}`}
                              </span>
                            </td>

                            {/* Shift shift: Previous -> New */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 text-xs font-mono whitespace-nowrap text-muted-foreground">
                                <span className="font-bold">{m.previousStock || 0}</span>
                                <span className="opacity-60">→</span>
                                <span className="font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">{m.newStock || 0}</span>
                              </div>
                            </td>

                            {/* Reference document */}
                            <td className="p-4 whitespace-nowrap">
                              {m.reference ? (
                                <Badge variant="outline" className="font-mono text-[11px] font-bold rounded-lg border-border/50 px-2 py-0.5 whitespace-nowrap">
                                  {m.reference}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">—</span>
                              )}
                            </td>

                            {/* Operator / Creator */}
                            <td className="p-4 text-xs hidden lg:table-cell whitespace-nowrap text-muted-foreground">
                              {m.createdBy?.name || "System"}
                            </td>

                            {/* Notes/Remarks */}
                            <td className="p-4 text-xs whitespace-nowrap text-muted-foreground truncate max-w-[150px]" title={m.notes || ""}>
                              {m.notes || "—"}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
