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
import { purchaseService } from "@/services/purchaseService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Supplier, Purchase } from "@/types";
import { format } from "date-fns";
import { SupplierModal } from "@/components/shared/SupplierModal";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [supData, purchasesData] = await Promise.all([
        supplierService.getById(id),
        purchaseService.getAll({ supplier: id, limit: 100 })
      ]);
      
      setSupplier(supData);
      
      // Combine opening balance with purchases for a ledger view
      const ledger: any[] = [];
      
      // 1. Add Opening Balance if exists
      if (supData.openingBalance && supData.openingBalance > 0) {
        ledger.push({
          _id: "opening-bal",
          type: supData.openingBalanceType === "Payable" ? "Payable Opening Bal" : "Receivable Opening Bal",
          date: supData.openingBalanceDate || new Date().toISOString(),
          total: supData.openingBalance,
          balance: supData.openingBalance,
          status: "Unpaid",
          isOpening: true,
        });
      }
      
      // 2. Add Purchases
      const purchasesLedger = purchasesData.data.map((p: Purchase) => ({
        _id: p._id,
        type: "Purchase",
        number: p.purchaseNumber,
        date: p.createdAt,
        total: p.totalAmount,
        balance: p.totalAmount - (p.amountPaid || 0),
        status: p.paymentStatus === "paid" ? "Paid" : "Unpaid",
      }));
      
      ledger.push(...purchasesLedger);
      
      // Sort by date
      setTransactions(ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
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
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
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
                  (supplier.outstandingAmount > 0) ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatCurrency(supplier.outstandingAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
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
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest w-[250px]">Type</th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Number</th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Balance</th>
                  <th className="text-center p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="p-4 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground text-sm italic">
                      No transactions found for this supplier.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t, i) => (
                    <motion.tr 
                      key={t._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/10 transition-colors group",
                        t.isOpening && "bg-muted/5 font-medium"
                      )}
                    >
                      <td className="p-4 text-sm font-medium">{t.type}</td>
                      <td className="p-4 text-sm text-muted-foreground">{t.number || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {t.date ? format(new Date(t.date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="p-4 text-sm text-right font-semibold">
                        {formatCurrency(t.total)}
                      </td>
                      <td className="p-4 text-sm text-right font-medium">
                        {formatCurrency(t.balance)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            t.status === "Paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          )}
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
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
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Purchases</p>
            <p className="text-lg font-bold text-primary">{transactions.filter(t => t.type === 'Purchase').length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Outstanding Balance</p>
            <p className="text-lg font-bold text-rose-600">
              {formatCurrency(transactions.reduce((acc, t) => acc + t.balance, 0))}
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
