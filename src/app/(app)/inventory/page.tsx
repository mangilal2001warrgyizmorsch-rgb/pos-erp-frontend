"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Warehouse, AlertTriangle, ArrowUpDown, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/services/productService";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
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

  useEffect(() => {
    load();
  }, [load]);

  const getStockStatus = (stock: number, threshold: number = 10) => {
    if (stock <= 0) return { label: "Out of Stock", variant: "destructive", icon: AlertTriangle };
    if (stock <= threshold) return { label: "Low Stock", variant: "warning", icon: ArrowUpDown };
    return { label: "In Stock", variant: "default", icon: CheckCircle2 };
  };

  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Current Stock"
        description="Monitor inventory levels and stock value"
        icon={Warehouse}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product by name, SKU, or barcode..."
          className="max-w-md w-full"
        />
        <Card className="px-4 py-2 border-primary/20 bg-primary/5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Inventory Value</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>
        </Card>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : products.length === 0 ? (
        <EmptyState title="No stock found" description="Adjust your search filters" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Product Details</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Purchase Rate</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Sales Rate</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Current Stock</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
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
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 text-sm text-muted-foreground">{i + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="h-full w-full rounded-lg object-cover" />
                            ) : (
                              <Warehouse className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {p.sku} {p.barcode ? `| Barcode: ${p.barcode}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm hidden md:table-cell">
                        {typeof p.category === "object" && p.category !== null && "name" in p.category 
                          ? String(p.category.name) 
                          : typeof p.category === "string" ? p.category : "—"}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="p-4 text-sm text-right font-medium text-primary">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-lg font-bold">
                          {p.stock}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1 uppercase">{p.unit}</span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge 
                          variant={status.variant as any} 
                          className="px-2.5 py-1"
                        >
                          <StatusIcon className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
}
