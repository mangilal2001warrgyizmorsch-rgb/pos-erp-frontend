"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Trash2, Printer, Search, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddPaymentInModal } from "@/components/payments/AddPaymentInModal";
import { paymentInService } from "@/services/paymentInService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentInPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentInService.getAll();
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
      await paymentInService.delete(id);
      toast.success("Payment deleted");
      load();
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  const filtered = payments.filter(p => 
    p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Payment-In" description="Money received from customers" icon={Wallet}>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Payment-In
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by receipt or party name..." 
          className="flex-1 max-w-sm"
        />
      </div>

      {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? (
        <EmptyState 
          title="No payments found" 
          description="Record a customer payment to see it here" 
          icon={Wallet} 
          action={{ label: "Add Payment-In", onClick: () => setAddModalOpen(true) }}
        />
      ) : (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receipt</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Party Name</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Date</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Mode</th>
                  <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
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
                      <p className="text-sm font-mono font-bold text-primary">{p.receiptNo}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">{p.partyName}</td>
                    <td className="p-4 text-sm text-muted-foreground text-center">{formatDate(p.date)}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="rounded-full px-3">{p.paymentMode}</Badge>
                    </td>
                    <td className="p-4 text-sm text-right font-black text-emerald-500 tabular-nums">
                      {formatCurrency(p.amountReceived)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p._id)}>
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

      <AddPaymentInModal 
        open={addModalOpen} 
        onOpenChange={setAddModalOpen} 
        onSuccess={load} 
      />
    </div>
  );
}
