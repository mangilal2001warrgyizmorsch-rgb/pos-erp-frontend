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
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { customerService } from "@/services/customerService";
import { saleService } from "@/services/saleService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Customer, Sale } from "@/types";
import { format } from "date-fns";
import { CustomerModal } from "@/components/shared/CustomerModal";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [custData, salesData] = await Promise.all([
        customerService.getById(id),
        saleService.getAll({ customer: id, limit: 100 })
      ]);
      
      setCustomer(custData);
      
      // Combine opening balance with sales for a ledger view
      const ledger: any[] = [];
      
      // 1. Add Opening Balance if exists
      if (custData.openingBalance && custData.openingBalance > 0) {
        ledger.push({
          _id: "opening-bal",
          type: custData.openingBalanceType === "Receivable" ? "Receivable Opening Bal" : "Payable Opening Bal",
          date: custData.openingBalanceDate || new Date().toISOString(),
          total: custData.openingBalance,
          balance: custData.openingBalance,
          status: "Unpaid", // Opening balance is usually considered unpaid until settled
          isOpening: true,
        });
      }
      
      // 2. Add Sales
      const salesLedger = salesData.data.map((s: Sale) => ({
        _id: s._id,
        type: "Sale",
        number: s.invoiceNumber,
        date: s.createdAt,
        total: s.totalAmount,
        balance: s.totalAmount - (s.amountPaid || 0),
        status: s.paymentStatus === "paid" ? "Paid" : "Unpaid",
      }));
      
      ledger.push(...salesLedger);
      
      // Sort by date (Opening balance usually comes first if we assume it's older)
      setTransactions(ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
    } catch (error) {
      toast.error("Failed to load customer details");
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

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
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

      {/* Customer Info Card */}
      <Card className="p-6 overflow-hidden border-0 shadow-sm bg-card">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className="text-primary"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium">{customer.email || "—"}</p>
              </div>
              {customer.gstNumber && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Number</p>
                  <p className="text-sm font-medium">{customer.gstNumber}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</p>
                <p className={cn(
                  "text-sm font-bold",
                  (customer.totalSpent > 0) ? "text-primary" : "text-emerald-600"
                )}>
                  {formatCurrency(customer.totalSpent || 0)}
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
          <h2 className="text-lg font-bold">Transactions</h2>
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
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><Search className="h-4 w-4 sm:hidden" /></Button>
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
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Balance/Unused</th>
                  <th className="text-center p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="p-4 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground text-sm italic">
                      No transactions found for this customer.
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

      {/* Summary Footer Bar (Optional but nice) */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Sales</p>
            <p className="text-lg font-bold text-primary">{transactions.filter(t => t.type === 'Sale').length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Net Balance</p>
            <p className="text-lg font-bold text-rose-600">
              {formatCurrency(transactions.reduce((acc, t) => acc + t.balance, 0))}
            </p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          Record Payment
        </Button>
      </div>

      <CustomerModal 
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        customer={customer}
        onSuccess={loadData}
      />
    </div>
  );
}
