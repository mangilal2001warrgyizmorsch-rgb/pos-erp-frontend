"use client";

import { useEffect, useState, useCallback, use } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Pencil, 
  MessageSquare, 
  Phone, 
  Clock, 
  Search, 
  Printer, 
  FileDown,
  MoreVertical
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supplierService } from "@/services/supplierService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Supplier } from "@/types";
import { format } from "date-fns";
import { SupplierModal } from "@/components/shared/SupplierModal";
import { partyLedgerService, LedgerEntry } from "@/services/partyLedgerService";


export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [supData, ledgerRes] = await Promise.all([
        supplierService.getById(id),
        partyLedgerService.getLedger(id)
      ]);
      
      setSupplier(supData);
      setLedger(ledgerRes.data);
    } catch (error) {
      toast.error("Failed to load supplier details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!supplier) return <div>Supplier not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Suppliers
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-primary border-primary hover:bg-primary/5"
            onClick={() => setEditModalOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      {/* Supplier Info Card */}
      <Card className="p-6 overflow-hidden border-0 shadow-sm bg-card">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20 shrink-0 aspect-square">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="page-title flex items-center gap-2">
                  {supplier.name}
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="text-primary"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </h1>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {supplier.gstNumber || "No GST Number"}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-medium">{supplier.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium">{supplier.email || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing Address</p>
                <p className="text-sm font-medium leading-relaxed">{supplier.address || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payable Balance</p>
                <p className={cn(
                  "text-sm font-bold",
                  (supplier.outstandingBalance > 0) ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatCurrency(supplier.outstandingBalance || 0)}
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-start gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-all">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-all">
              <Clock className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Purchase History</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-48 hidden sm:block">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-8 h-9 text-sm bg-card border-muted-foreground/20" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><FileDown className="h-4 w-4" /></Button>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  <th className="text-left p-4 w-[200px] whitespace-nowrap">Type</th>
                  <th className="text-left p-4 whitespace-nowrap">Number</th>
                  <th className="text-left p-4 whitespace-nowrap">Date</th>
                  <th className="text-right p-4 whitespace-nowrap">Credit (Purchase)</th>
                  <th className="text-right p-4 whitespace-nowrap">Debit (Payment)</th>
                  <th className="text-right p-4 whitespace-nowrap">Outstanding Balance</th>
                  <th className="p-4 w-[50px] whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground text-sm italic">
                      No transactions found for this supplier.
                    </td>
                  </tr>
                ) : (
                  ledger.map((t, i) => (
                    <motion.tr 
                      key={t._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/10 transition-colors group whitespace-nowrap",
                        t.type === 'opening_balance' && "bg-muted/5 font-medium"
                      )}
                    >
                      <td className="p-4 text-sm font-medium capitalize whitespace-nowrap">{t.type.replace('_', ' ')}</td>
                      <td className="p-4 receipt-code text-sm whitespace-nowrap">{t.receiptNo || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                        {t.date ? format(new Date(t.date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="p-4 text-sm text-right font-semibold text-rose-500 whitespace-nowrap">
                        {t.creditAmount > 0 ? `+${formatCurrency(t.creditAmount)}` : "—"}
                      </td>
                      <td className="p-4 text-sm text-right font-semibold text-emerald-500 whitespace-nowrap">
                        {t.debitAmount > 0 ? `-${formatCurrency(t.debitAmount)}` : "—"}
                      </td>
                      <td className="p-4 text-sm text-right font-bold whitespace-nowrap">
                        {formatCurrency(t.balanceAfter)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Summary Footer Bar */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Transactions</p>
            <p className="text-lg font-bold text-primary">{ledger.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Outstanding Balance</p>
            <p className={cn(
              "text-lg font-bold",
              (supplier.outstandingBalance || 0) > 0 ? "text-rose-600" : "text-emerald-600"
            )}>
              {formatCurrency(supplier.outstandingBalance || 0)}
            </p>
          </div>

        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          Pay Supplier
        </Button>
      </div>

      <SupplierModal 
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        supplier={supplier}
        onSuccess={loadData}
      />
    </div>
  );
}
