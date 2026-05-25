"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Trash2, Printer, Search, Calendar, FileText, Edit } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddPaymentOutModal } from "@/components/payments/AddPaymentOutModal";
import { paymentOutService } from "@/services/paymentOutService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentOutPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentOutService.getAll();
      setPayments(res.data);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await paymentOutService.delete(id);
      toast.success("Payment deleted");
      load();
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  const handleEdit = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setAddModalOpen(true);
  };

  const handleModalClose = () => {
    setAddModalOpen(false);
    setSelectedPaymentId(null);
  };

  const filtered = payments.filter(p => 
    p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Payment-Out" description="Money paid to suppliers" icon={Wallet}>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2 h-11 px-6">
          <Plus className="h-4 w-4" /> Add Payment-Out
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by receipt or supplier name..." 
          className="flex-1 max-w-sm"
        />
      </div>

      {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? (
        <EmptyState 
          title="No payments found" 
          description="Record a supplier payment to see it here" 
          icon={Wallet} 
          action={{ label: "Add Payment-Out", onClick: () => setAddModalOpen(true) }}
        />
      ) : (
        <Card className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="app-table-head border-b">
                  <th className="text-left p-4">Receipt</th>
                  <th className="text-left p-4">Supplier</th>
                  <th className="text-center p-4">Date</th>
                  <th className="text-center p-4">Mode</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <motion.tr 
                    key={p._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <p className="receipt-code text-sm">{p.receiptNo}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">{p.partyName}</td>
                    <td className="p-4 text-sm text-muted-foreground text-center">{formatDate(p.date)}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="rounded-full px-3">{p.paymentMode}</Badge>
                    </td>
                    <td className="p-4 text-sm text-right amount-negative tabular-nums">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => handleEdit(p._id)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p._id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
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

      <AddPaymentOutModal 
        open={addModalOpen} 
        onOpenChange={handleModalClose} 
        onSuccess={load}
        paymentId={selectedPaymentId}
      />
    </div>
  );
}
