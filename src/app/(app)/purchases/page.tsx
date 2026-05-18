"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Receipt, Plus, Eye, Trash2, Loader2, Search, FileText, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { purchaseService } from "@/services/purchaseService";
import { formatCurrency } from "@/lib/utils";
import type { Purchase, PurchaseStatus, PurchasePaymentStatus } from "@/types";
import { getSocket } from "@/lib/socket";

const statusColors: Record<PurchaseStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  received: "bg-emerald-500/10 text-emerald-500",
  cancelled: "bg-red-500/10 text-red-500",
  returned: "bg-amber-500/10 text-amber-500",
};

const paymentColors: Record<PurchasePaymentStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-500",
  pending: "bg-amber-500/10 text-amber-500",
  partial: "bg-blue-500/10 text-blue-500",
};

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { search, limit: 50 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.paymentStatus = paymentFilter;
      const result = await purchaseService.getAll(params as Parameters<typeof purchaseService.getAll>[0]);
      setPurchases(result.data);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleLiveUpdate = () => {
      load();
    };

    socket.on("purchase:created", handleLiveUpdate);
    socket.on("purchaseReturn:created", handleLiveUpdate);
    
    return () => {
      socket.off("purchase:created", handleLiveUpdate);
      socket.off("purchaseReturn:created", handleLiveUpdate);
    };
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await purchaseService.delete(deleteId);
      toast.success("Purchase deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Bills"
        description="Manage all purchase transactions"
        icon={Receipt}
        action={{
          label: "Create Purchase",
          onClick: () => router.push("/purchases/create"),
          icon: Plus,
        }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by purchase no, supplier..."
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : purchases.length === 0 ? (
        <EmptyState
          title="No purchases found"
          description="Create your first purchase bill"
        >
          <Button onClick={() => router.push("/purchases/create")}>
            <Plus className="h-4 w-4 mr-2" />Create Purchase
          </Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sr No</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Purchase No</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Payment</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/purchases/${p._id}`)}
                  >
                    <td className="p-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-medium">{p.purchaseNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">{p.supplierName}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(p.purchaseDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 text-sm text-right font-semibold">
                      {formatCurrency(p.totalAmount)}
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                      <Badge className={statusColors[p.status]} variant="secondary">
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-center hidden lg:table-cell">
                      <Badge className={paymentColors[p.paymentStatus]} variant="secondary">
                        {p.paymentStatus.charAt(0).toUpperCase() + p.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => router.push(`/purchases/${p._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeleteId(p._id);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Purchase"
        description="This will permanently delete this purchase bill. Stock changes will be reversed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
