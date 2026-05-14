"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saleService } from "@/services/saleService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit: 20, search };
      if (paymentFilter !== "all") params.paymentMethod = paymentFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await saleService.getAll(
        params as Parameters<typeof saleService.getAll>[0]
      );
      setSales(result.data);
      setTotalPages(result.pagination.pages);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const viewSale = async (id: string) => {
    try {
      const sale = await saleService.getById(id);
      setSelectedSale(sale);
      setDetailOpen(true);
    } catch {
      toast.error("Failed to load sale details");
    }
  };

  const pmColors: Record<string, string> = {
    cash: "success", card: "default", upi: "secondary",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="View sales history" icon={ShoppingCart}>
        <Link href="/sales/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Sale
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search invoice or customer..." className="flex-1 max-w-sm" />
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 items-center">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[150px]" />
          <span className="text-muted-foreground text-sm">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[150px]" />
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} /> : sales.length === 0 ? (
        <EmptyState title="No sales found" description="Complete a sale from the POS to see it here" icon={ShoppingCart} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Payment</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => (
                  <motion.tr key={sale._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/sales/${sale._id}`)}
                  >
                    <td className="p-4">
                      <p className="text-sm font-mono font-medium">{sale.invoiceNumber}</p>
                    </td>
                    <td className="p-4 text-sm">{sale.customerName}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{formatDate(sale.createdAt)}</td>
                    <td className="p-4 hidden sm:table-cell">
                      <Badge variant={pmColors[sale.paymentMethod] as "success" | "default" | "secondary"}>
                        {sale.paymentMethod.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-right font-semibold">{formatCurrency(sale.totalAmount)}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); viewSale(sale._id); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Sale Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Sale Details
            </DialogTitle>
            <DialogDescription>{selectedSale?.invoiceNumber}</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="text-xs text-muted-foreground">Customer</Label><p className="font-medium">{selectedSale.customerName}</p></div>
                <div><Label className="text-xs text-muted-foreground">Date</Label><p className="font-medium">{formatDate(selectedSale.createdAt)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Payment</Label><p className="font-medium capitalize">{selectedSale.paymentMethod}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="success">{selectedSale.paymentStatus}</Badge>
                </div>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30 border-b">
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr></thead>
                  <tbody>
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedSale.subtotal)}</span></div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(selectedSale.discountAmount)}</span></div>
                )}
                {selectedSale.taxAmount > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax ({selectedSale.taxRate}%)</span><span>{formatCurrency(selectedSale.taxAmount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span><span className="text-primary">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
