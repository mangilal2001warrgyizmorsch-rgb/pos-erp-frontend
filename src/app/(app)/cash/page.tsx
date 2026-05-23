"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MoreVertical, Settings2, SlidersHorizontal, IndianRupee, Loader2, History, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { cashBankService } from "@/services/cashBankService";
import { toast } from "sonner";


export default function CashPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [search, setSearch] = useState("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "", type: "add", date: new Date().toISOString().split('T')[0], remarks: ""
  });
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, transRes] = await Promise.all([
        cashBankService.getSummary(),
        cashBankService.getTransactions({ accountType: 'cash' })
      ]);
      setBalance(summaryRes.data.cashBalance);
      setTransactions(transRes.data);
    } catch (error) {
      toast.error("Failed to load cash data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    try {
      await cashBankService.createCashEntry({
        type: form.type === "add" ? "cash_entry_in" : "cash_entry_out",
        amount,
        date: form.date,
        paymentMode: "Cash",
        remarks: form.remarks,
      });
      toast.success("Cash adjustment saved");
      setIsAdjustModalOpen(false);
      setForm({
        amount: "",
        type: "add",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save cash adjustment");
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      tx.type,
      tx.receiptNo,
      tx.transactionNo,
      tx.partyName,
      tx.amount?.toString(),
      formatDate(tx.date),
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="page-icon-tile">
            <IndianRupee />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="page-title">
              Cash
            </h1>
            <span className={cn(
              "text-lg sm:text-xl font-black font-mono tracking-tight",
              balance >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-full h-10 px-4 flex items-center gap-2 border-border/50 bg-card hover:bg-muted text-xs sm:text-sm shadow-sm"
            onClick={() => router.push("/cash-bank/transaction-history?accountId=cash")}
          >
            <History className="h-4 w-4 text-primary shrink-0" /> View History
          </Button>
          <Button className="flex-1 sm:flex-none bg-primary hover:bg-primary/95 text-primary-foreground rounded-full shadow-md text-xs sm:text-sm font-semibold h-10 px-5" onClick={() => setIsAdjustModalOpen(true)}>
            <SlidersHorizontal className="mr-1.5 h-4 w-4 shrink-0" /> Adjust Cash
          </Button>
        </div>
      </div>

      <Card className="app-card overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="section-title">Transactions</div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="w-64 pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="app-table-head border-b">
                <th className="text-left p-4">
                  <div className="flex items-center justify-between">
                    Type <Filter className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left p-4">
                  <div className="flex items-center justify-between">
                    Name <Filter className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left p-4">
                  <div className="flex items-center justify-between">
                    Date <Settings2 className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Filter className="h-3 w-3" /> Amount
                  </div>
                </th>
                <th className="w-[50px] p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, i) => (
                  <motion.tr 
                    key={tx._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="p-4 font-medium capitalize">{tx.type.replace('_', ' ')}</td>
                    <td className="p-4 receipt-code text-sm">{tx.receiptNo || "—"}</td>
                    <td className="p-4">{formatDate(tx.date)}</td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "font-medium",
                        tx.direction === 'in' ? "text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md" : "text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md"
                      )}>
                        {tx.direction === 'in' ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => router.push(`/cash-bank/transaction-history?search=${tx.transactionNo || tx.receiptNo || ''}`)}
                        title="View details in history"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Cash Modal */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" /> Adjust Cash
            </DialogTitle>
            <DialogDescription>
              Add or reduce cash directly. Useful for petty cash handling or unrecorded adjustments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Adjustment Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Cash (+)</SelectItem>
                  <SelectItem value="reduce">Reduce Cash (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amt">Amount</Label>
              <Input id="amt" type="number" placeholder="₹ 0.00" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input id="remarks" placeholder="Optional notes" value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
