"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCashBankStore } from "@/store/cashBankStore";
import { getSocket } from "@/lib/socket";
import { cashBankService } from "@/services/cashBankService";
import {
  Search,
  IndianRupee,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  History,
  RotateCcw,
  Eye,
  Plus,
  SlidersHorizontal,
  Download,
  AlertCircle,
  Building,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatCurrencyCompact, cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TransactionHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[70vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-semibold">Loading ledger registry...</p>
        </div>
      </div>
    }>
      <TransactionHistoryContent />
    </Suspense>
  );
}

function TransactionHistoryContent() {
  const {
    summary,
    transactions,
    filters,
    loading,
    liveConnected,
    setFilters,
    resetFilters,
    fetchSummary,
    fetchTransactions,
    addLiveTransaction,
    updateLiveBalance,
    setLiveConnected
  } = useCashBankStore();

  // Responsive state toggles
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialog open/close states
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Form lists & selections
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get("accountId");
  const searchParam = searchParams.get("search");

  // Sync route query params to search state
  useEffect(() => {
    const filterUpdates: any = {};
    if (accountIdParam) {
      filterUpdates.accountId = accountIdParam;
    }
    if (searchParam) {
      filterUpdates.search = searchParam;
    }

    if (Object.keys(filterUpdates).length > 0) {
      setFilters(filterUpdates);
      if (accountIdParam && accountIdParam !== "all") {
        setShowAdvancedFilters(true);
      }
    }
  }, [accountIdParam, searchParam]);

  const [cashForm, setCashForm] = useState({
    amount: "",
    type: "cash_entry_in",
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    remarks: ""
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: ""
  });

  const [reversalForm, setReversalForm] = useState({
    reversalReason: ""
  });

  // Load account lists for forms
  const loadAccounts = useCallback(async () => {
    try {
      const res = await cashBankService.getAccounts();
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error("Failed to load accounts for dropdowns", err);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Handle Socket.IO connection and real-time ledger sync
  useEffect(() => {
    fetchSummary();
    fetchTransactions();

    const socket = getSocket();

    socket.on("cashBank:transactionCreated", (data) => {
      console.log("[Socket.IO] New transaction received:", data);
      addLiveTransaction(data.transaction);
      updateLiveBalance(data.summary);
      toast.success(
        `Txn ${data.transaction.transactionNo} logged: ${formatCurrency(
          data.transaction.amount
        )} (${data.transaction.type.replace(/_/g, " ")})`
      );
    });

    socket.on("cashBank:balanceUpdated", (data) => {
      console.log("[Socket.IO] Balance updated:", data);
      updateLiveBalance(data);
    });

    socket.on("cashBank:transactionReversed", (data) => {
      console.log("[Socket.IO] Transaction reversed:", data);
      fetchSummary();
      fetchTransactions();
      toast.warning(`Txn ${data.originalTransactionNo} has been reversed!`);
    });

    setLiveConnected(socket.connected);

    const onConnect = () => setLiveConnected(true);
    const onDisconnect = () => setLiveConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("cashBank:transactionCreated");
      socket.off("cashBank:balanceUpdated");
      socket.off("cashBank:transactionReversed");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [fetchSummary, fetchTransactions, addLiveTransaction, updateLiveBalance, setLiveConnected]);

  // Submit manual cash entry
  const handleSaveCashEntry = async () => {
    try {
      if (!cashForm.amount || parseFloat(cashForm.amount) <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }
      const res = await cashBankService.createCashEntry({
        ...cashForm,
        amount: parseFloat(cashForm.amount)
      });
      if (res.success) {
        toast.success("Cash adjustment entry saved successfully");
        setIsCashModalOpen(false);
        setCashForm({
          amount: "",
          type: "cash_entry_in",
          date: new Date().toISOString().split("T")[0],
          paymentMode: "Cash",
          remarks: ""
        });
        fetchSummary();
        fetchTransactions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create cash entry");
    }
  };

  // Submit bank transfer
  const handleSaveTransfer = async () => {
    try {
      if (!transferForm.fromAccountId || !transferForm.toAccountId) {
        toast.error("Please select both source and destination accounts");
        return;
      }
      if (transferForm.fromAccountId === transferForm.toAccountId) {
        toast.error("Source and destination accounts cannot be the same");
        return;
      }
      if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
        toast.error("Please enter a valid transfer amount");
        return;
      }
      const res = await cashBankService.createBankTransfer({
        ...transferForm,
        amount: parseFloat(transferForm.amount)
      });
      if (res.success) {
        toast.success("Funds transferred successfully");
        setIsTransferModalOpen(false);
        setTransferForm({
          fromAccountId: "",
          toAccountId: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          remarks: ""
        });
        fetchSummary();
        fetchTransactions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
  };

  // Submit Reversal
  const handleExecuteReversal = async () => {
    try {
      if (!reversalForm.reversalReason.trim()) {
        toast.error("Please enter a valid reason for reversing this transaction");
        return;
      }
      const res = await cashBankService.reverseTransaction(selectedTx._id, reversalForm);
      if (res.success) {
        toast.success("Transaction reversed successfully");
        setIsReverseModalOpen(false);
        setReversalForm({ reversalReason: "" });
        setSelectedTx(null);
        fetchSummary();
        fetchTransactions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reverse transaction");
    }
  };

  // Export transactions helper
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions available to export");
      return;
    }
    const headers = ["Date", "Transaction ID", "Type", "Party", "Reference Module", "Reference ID", "Payment Mode", "Account", "Inflow", "Outflow", "Balance After", "Status", "Notes"];
    const rows = transactions.map((tx) => [
      formatDate(tx.date),
      tx.transactionNo,
      tx.type,
      tx.partyName || "N/A",
      tx.referenceModule || "N/A",
      tx.referenceNo || "N/A",
      tx.paymentMode,
      tx.accountId?.accountName || (tx.accountType === "cash" ? "Cash" : "N/A"),
      tx.direction === "in" ? tx.amount : "",
      tx.direction === "out" ? tx.amount : "",
      tx.balanceAfter !== undefined ? tx.balanceAfter : "",
      tx.status,
      tx.notes || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_history_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully");
  };

  // Reset all filters easily
  const handleClearFilters = () => {
    resetFilters();
    toast.success("Search filters reset successfully");
  };

  return (
    <div className="space-y-6 px-1 sm:px-2 md:px-0">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="page-icon-tile">
            <History />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              <h1 className="page-title">
                Transaction History
              </h1>
              <div className="flex items-center gap-1.5 bg-muted/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/50">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full inline-block animate-pulse",
                    liveConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  )}
                />
                <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                  {liveConnected ? "Live Connected" : "Connection Down"}
                </span>
              </div>
            </div>
            <p className="page-description mt-1.5 max-w-2xl">
              Real-time financial ledger tracking balance adjustments, return credits, sales, purchases, and inter-bank account transfers securely.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-nowrap justify-end">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-full border-border/50 bg-card hover:bg-muted text-xs shadow-sm h-10 px-3.5"
            onClick={handleExportCSV}
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-primary shrink-0" /> Export
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-full border-border/50 bg-card hover:bg-muted text-xs shadow-sm h-10 px-3.5"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5 text-primary shrink-0" /> Transfer
          </Button>
          <Button
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/95 text-primary-foreground rounded-full shadow-md text-xs font-semibold h-10 px-4"
            onClick={() => setIsCashModalOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5 shrink-0" /> Adjust Cash
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Cash Balance */}
        <Card className="app-card p-3.5 sm:p-4.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              Cash Balance
            </div>
            <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-3 sm:mt-4 text-emerald-500 font-mono tracking-tight whitespace-nowrap">
            {formatCurrencyCompact(summary.cashBalance)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-1 truncate">Cash ledger balance</div>
        </Card>

        {/* Card 2: Bank Balance */}
        <Card className="app-card p-3.5 sm:p-4.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              Bank Balance
            </div>
            <div className="h-7 w-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Building className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-3 sm:mt-4 text-indigo-500 font-mono tracking-tight whitespace-nowrap">
            {formatCurrencyCompact(summary.totalBankBalance)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-1 truncate">Unified banks aggregate</div>
        </Card>

        {/* Card 3: Today Inflow */}
        <Card className="app-card p-3.5 sm:p-4.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden col-span-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              Today's Inflow
            </div>
            <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-3 sm:mt-4 text-emerald-600 font-mono tracking-tight whitespace-nowrap">
            {formatCurrencyCompact(summary.todayInflow || 0)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-1 truncate">Receipts and pay-ins today</div>
        </Card>

        {/* Card 4: Today Outflow */}
        <Card className="app-card p-3.5 sm:p-4.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden col-span-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              Today's Outflow
            </div>
            <div className="h-7 w-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-3 sm:mt-4 text-rose-500 font-mono tracking-tight whitespace-nowrap">
            {formatCurrencyCompact(summary.todayOutflow || 0)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-1 truncate">Purchases, refunds, expenses</div>
        </Card>

        {/* Card 5: Net Balance */}
        <Card className="app-card p-3.5 sm:p-4.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1 2xl:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              Total Net Balance
            </div>
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform duration-200">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-3 sm:mt-4 text-foreground font-mono tracking-tight whitespace-nowrap">
            {formatCurrencyCompact((summary.cashBalance || 0) + (summary.totalBankBalance || 0))}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-1 truncate">Total active cash & bank funds</div>
        </Card>
      </div>

      {/* Filter and Search Container */}
      <Card className="border border-border/40 shadow-sm bg-card p-4 sm:p-5 rounded-2xl">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                placeholder="Search transaction ID, receipt no, party name..."
                className="pl-10 pr-4 bg-muted/40 border-transparent focus-visible:ring-1 focus-visible:ring-primary w-full h-10.5 rounded-xl text-xs sm:text-sm"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
            </div>

            {/* Toggle Filters Button & Clear Filters Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-border/50 bg-card hover:bg-muted text-xs font-semibold h-10.5 rounded-xl px-4 flex items-center gap-2"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
                <span>{showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}</span>
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-red-500 h-10.5 w-10.5 rounded-xl border border-border/30 hover:bg-red-500/5 transition-colors"
                onClick={handleClearFilters}
                title="Reset Filters"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expandable Advanced Filters Drawer with Symmetrical Column Spanning */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/30 pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Filter: Transaction Type */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Ledger Category Type</Label>
                    <Select value={filters.type} onValueChange={(val) => setFilters({ type: val })}>
                      <SelectTrigger className="bg-muted/40 border-transparent h-10 rounded-xl text-xs sm:text-sm">
                        <SelectValue placeholder="Txn Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="sale_payment">Sales Payment</SelectItem>
                        <SelectItem value="purchase_payment">Purchase Payment</SelectItem>
                        <SelectItem value="payment_in">Payment-In</SelectItem>
                        <SelectItem value="payment_out">Payment-Out</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="sale_return_refund">Credit Note Refund</SelectItem>
                        <SelectItem value="purchase_return_refund">Debit Note Refund</SelectItem>
                        <SelectItem value="cash_entry_in">Cash Adjust (In)</SelectItem>
                        <SelectItem value="cash_entry_out">Cash Adjust (Out)</SelectItem>
                        <SelectItem value="transfer_out">Fund Transfer</SelectItem>
                        <SelectItem value="cheque_clearance">Cheque Clearance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter: Money Direction */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Flow Direction</Label>
                    <Select value={filters.direction} onValueChange={(val) => setFilters({ direction: val })}>
                      <SelectTrigger className="bg-muted/40 border-transparent h-10 rounded-xl text-xs sm:text-sm">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="All">All Flow Directions</SelectItem>
                        <SelectItem value="in">Inflow (+ Cash Recieved)</SelectItem>
                        <SelectItem value="out">Outflow (- Payments/Expenses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter: Associated Account */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Register/Account</Label>
                    <Select value={filters.accountId} onValueChange={(val) => setFilters({ accountId: val })}>
                      <SelectTrigger className="bg-muted/40 border-transparent h-10 rounded-xl text-xs sm:text-sm">
                        <SelectValue placeholder="All Accounts" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Registers & Banks</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        {accounts
                          .filter((acc) => acc.accountType === "bank")
                          .map((acc) => (
                            <SelectItem key={acc._id} value={acc._id}>
                              {acc.accountName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter: Custom Date Range (Spans 2 columns to give double horizontal space and prevent clipping) */}
                  <div className="space-y-1.5 col-span-1 lg:col-span-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Custom Date Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        className="bg-muted/40 border-transparent h-10 rounded-xl text-xs p-2.5 flex-1 min-w-[110px]"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ startDate: e.target.value })}
                        placeholder="Start"
                      />
                      <span className="text-xs text-muted-foreground font-bold shrink-0">to</span>
                      <Input
                        type="date"
                        className="bg-muted/40 border-transparent h-10 rounded-xl text-xs p-2.5 flex-1 min-w-[110px]"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ endDate: e.target.value })}
                        placeholder="End"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Transactions Data Table */}
      <Card className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="app-table-head border-b whitespace-nowrap">
                <th className="p-4 hidden md:table-cell whitespace-nowrap">Date & Time</th>
                <th className="p-4 whitespace-nowrap">Txn ID</th>
                <th className="p-4 whitespace-nowrap">Type</th>
                <th className="p-4 hidden md:table-cell whitespace-nowrap">Party</th>
                <th className="p-4 hidden lg:table-cell whitespace-nowrap">Reference</th>
                <th className="p-4 hidden sm:table-cell whitespace-nowrap">Account</th>
                <th className="p-4 text-right whitespace-nowrap">Amount</th>
                <th className="p-4 text-center hidden sm:table-cell whitespace-nowrap">Status</th>
                <th className="p-4 text-center w-[100px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <span className="text-xs text-muted-foreground font-semibold mt-2.5 inline-block">
                      Retrieving live transactions...
                    </span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-muted-foreground">
                    <History className="h-10 w-10 text-muted/30 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold">No records found matching filters.</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1">Try resetting or modifying active search filters.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  const isReversed = tx.status === "reversed" || tx.isReversed;
                  return (
                    <motion.tr
                      key={tx._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                      className={cn(
                        "border-b border-border/40 hover:bg-muted/15 transition-colors group",
                        isReversed && "bg-amber-500/5 hover:bg-amber-500/10 text-muted-foreground/85"
                      )}
                    >
                      {/* Date (Desktop Only) */}
                      <td className="p-4 font-mono text-xs hidden md:table-cell whitespace-nowrap text-muted-foreground">
                        {formatDate(tx.date)}
                      </td>

                      {/* Txn ID (On mobile, stacks date underneath) */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="receipt-code text-xs sm:text-sm whitespace-nowrap">
                            {tx.transactionNo}
                          </span>
                          <span className="text-[10px] text-muted-foreground md:hidden font-mono mt-0.5 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </span>
                        </div>
                      </td>

                      {/* Type (On mobile, stacks payment mode underneath) */}
                      <td className="p-4 font-medium whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="capitalize text-xs sm:text-sm text-foreground whitespace-nowrap">
                            {tx.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold sm:hidden mt-0.5 flex items-center gap-1 whitespace-nowrap">
                            <span className="h-1 w-1 rounded-full bg-primary inline-block" />
                            {tx.paymentMode}
                          </span>
                        </div>
                      </td>

                      {/* Party (Medium screens & up) */}
                      <td className="p-4 font-semibold text-foreground hidden md:table-cell truncate max-w-[130px] whitespace-nowrap" title={tx.partyName || "N/A"}>
                        {tx.partyName || "—"}
                      </td>

                      {/* Reference (Large screens only) */}
                      <td className="p-4 hidden lg:table-cell whitespace-nowrap">
                        <div className="flex flex-col text-xs whitespace-nowrap">
                          <span className="font-bold text-foreground capitalize whitespace-nowrap">
                            {tx.referenceModule?.replace(/_/g, " ")}
                          </span>
                          <span className="receipt-code text-[11px] truncate max-w-[110px] whitespace-nowrap">
                            {tx.referenceNo || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Account (Small screens & up) */}
                      <td className="p-4 text-xs font-semibold text-foreground hidden sm:table-cell whitespace-nowrap">
                        {tx.accountId?.accountName || (tx.accountType === "cash" ? "Cash" : "—")}
                      </td>

                      {/* Unified Directional Amount Column */}
                      <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                        {tx.direction === "in" ? (
                          <span className="text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap">
                            +{formatCurrency(tx.amount)}
                          </span>
                        ) : (
                          <span className="text-rose-500 bg-rose-500/10 dark:bg-rose-500/15 px-2.5 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap">
                            -{formatCurrency(tx.amount)}
                          </span>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="p-4 text-center hidden sm:table-cell whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                            tx.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
                            tx.status === "reversed" && "bg-amber-500/10 text-amber-600 dark:text-amber-500",
                            tx.status === "pending" && "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8.5 w-8.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => {
                              setSelectedTx(tx);
                              setIsDetailsModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isReversed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8.5 w-8.5 rounded-lg hover:bg-amber-500/10 text-amber-500 shrink-0"
                              onClick={() => {
                                setSelectedTx(tx);
                                setIsReverseModalOpen(true);
                              }}
                              title="Reverse Transaction"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Cash Adjustment Modal */}
      <Dialog open={isCashModalOpen} onOpenChange={setIsCashModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <IndianRupee className="h-5 w-5 text-primary" /> Cash Balance Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manually adjust Cash balances to sync capital deposits, petty cash adjustments, or virtual withdrawals.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4.5 text-foreground">
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-xs font-semibold">Adjustment Category</Label>
              <Select
                value={cashForm.type}
                onValueChange={(val) => setCashForm({ ...cashForm, type: val })}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cash_entry_in">Deposit Cash (+ Cash)</SelectItem>
                  <SelectItem value="cash_entry_out">Withdraw Cash (- Cash)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amt" className="text-xs font-semibold">Adjustment Amount (INR)</Label>
              <Input
                id="amt"
                type="number"
                placeholder="₹ 0.00"
                className="rounded-xl h-10"
                value={cashForm.amount}
                onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMode" className="text-xs font-semibold">Source Channel</Label>
              <Select
                value={cashForm.paymentMode}
                onValueChange={(val) => setCashForm({ ...cashForm, paymentMode: val })}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select Payment Mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI Transfer</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks" className="text-xs font-semibold">Reference Notes / Reason</Label>
              <Input
                id="remarks"
                placeholder="Enter explanation for balance change"
                className="rounded-xl h-10"
                value={cashForm.remarks}
                onChange={(e) => setCashForm({ ...cashForm, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsCashModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 px-5 font-semibold" onClick={handleSaveCashEntry}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ArrowLeftRight className="h-5 w-5 text-primary" /> Account Funds Transfer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Move money safely between registers and bank accounts in real time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4.5 text-foreground">
            <div className="grid gap-2">
              <Label htmlFor="from" className="text-xs font-semibold">Source Account (Debit)</Label>
              <Select
                value={transferForm.fromAccountId}
                onValueChange={(val) => setTransferForm({ ...transferForm, fromAccountId: val })}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cash">Cash</SelectItem>
                  {accounts
                    .filter((acc) => acc.accountType === "bank")
                    .map((acc) => (
                      <SelectItem key={acc._id} value={acc._id}>
                        {acc.accountName} (₹{acc.currentBalance})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to" className="text-xs font-semibold">Destination Account (Credit)</Label>
              <Select
                value={transferForm.toAccountId}
                onValueChange={(val) => setTransferForm({ ...transferForm, toAccountId: val })}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select Destination" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cash">Cash</SelectItem>
                  {accounts
                    .filter((acc) => acc.accountType === "bank")
                    .map((acc) => (
                      <SelectItem key={acc._id} value={acc._id}>
                        {acc.accountName} (₹{acc.currentBalance})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transferAmt" className="text-xs font-semibold">Transfer Amount (INR)</Label>
              <Input
                id="transferAmt"
                type="number"
                placeholder="₹ 0.00"
                className="rounded-xl h-10"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transferRemarks" className="text-xs font-semibold">Reference Remarks</Label>
              <Input
                id="transferRemarks"
                placeholder="Remarks for reference"
                className="rounded-xl h-10"
                value={transferForm.remarks}
                onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 px-5 font-semibold" onClick={handleSaveTransfer}>Transfer Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reversal Confirmation Modal */}
      <Dialog open={isReverseModalOpen} onOpenChange={setIsReverseModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500 font-bold">
              <AlertCircle className="h-5 w-5" /> Reverse Ledger Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reversing this entry creates an equal and opposite correction transaction and restores target balances. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="bg-muted/40 p-3.5 rounded-xl space-y-2 text-xs border border-border/40 font-semibold text-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Txn ID:</span>
                <span className="receipt-code text-xs">{selectedTx.transactionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-black text-foreground font-mono">
                  {formatCurrency(selectedTx.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="capitalize">{selectedTx.type.replace(/_/g, " ")}</span>
              </div>
            </div>
          )}
          <div className="grid gap-2 py-1.5">
            <Label htmlFor="revReason" className="text-xs font-semibold text-foreground">
              Reason for Reversal
            </Label>
            <Input
              id="revReason"
              placeholder="e.g. Invoicing error, duplicate billing"
              className="rounded-xl h-10"
              value={reversalForm.reversalReason}
              onChange={(e) => setReversalForm({ reversalReason: e.target.value })}
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsReverseModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 bg-amber-500 hover:bg-amber-600 text-white font-semibold" onClick={handleExecuteReversal}>
              Reverse Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] rounded-2xl border-0 shadow-2xl p-5 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 border-b pb-3.5 text-foreground">
              <History className="h-5 w-5 text-primary" /> Full Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 py-2 text-foreground">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Transaction ID</div>
                  <div className="receipt-code text-xs sm:text-base mt-1 select-all">
                    {selectedTx.transactionNo}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Status</div>
                  <div className="mt-1">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider",
                        selectedTx.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
                        selectedTx.status === "reversed" && "bg-amber-500/10 text-amber-600 dark:text-amber-500",
                        selectedTx.status === "pending" && "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                      )}
                    >
                      {selectedTx.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-border/40 pt-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Direction</div>
                  <div className="font-bold mt-1 capitalize flex items-center gap-1 text-foreground">
                    {selectedTx.direction === "in" ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        Inflow (+)
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                        Outflow (-)
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Amount</div>
                  <div className="font-mono font-black text-xs sm:text-base text-foreground mt-1">
                    {formatCurrency(selectedTx.amount)}
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-border/40 pt-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Ledger Category</div>
                  <div className="font-bold capitalize mt-1 text-foreground">
                    {selectedTx.type?.replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Payment Mode</div>
                  <div className="font-bold mt-1 text-foreground">{selectedTx.paymentMode}</div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-border/40 pt-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Reference Module</div>
                  <div className="font-bold capitalize mt-1 text-foreground">
                    {selectedTx.referenceModule || "Manual Adjustment"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Reference Doc No</div>
                  <div className="receipt-code text-xs sm:text-sm mt-1">
                    {selectedTx.referenceNo || selectedTx.receiptNo || "—"}
                  </div>
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-border/40 pt-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Associated Party</div>
                  <div className="font-bold mt-1 text-foreground">{selectedTx.partyName || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Party Role</div>
                  <div className="font-bold mt-1 capitalize text-foreground">{selectedTx.partyType || "—"}</div>
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-border/40 pt-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Date Logged</div>
                  <div className="font-bold mt-1 text-foreground">{formatDate(selectedTx.date)}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Balance After Txn</div>
                  <div className="font-mono font-bold text-emerald-500 mt-1">
                    {selectedTx.balanceAfter !== undefined ? formatCurrency(selectedTx.balanceAfter) : "—"}
                  </div>
                </div>
              </div>

              {/* Remarks/Notes */}
              {selectedTx.notes && (
                <div className="border-t border-border/40 pt-3 text-xs sm:text-sm">
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Remarks / Notes</div>
                  <div className="bg-muted/40 p-3 rounded-xl mt-1.5 italic text-foreground text-xs">
                    "{selectedTx.notes}"
                  </div>
                </div>
              )}

              {/* Reversal audit trail log */}
              {selectedTx.isReversed && (
                <div className="border border-amber-500/20 bg-amber-500/5 p-3.5 rounded-xl text-xs text-amber-600 dark:text-amber-400 space-y-1.5">
                  <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <AlertCircle className="h-3.5 w-3.5" /> Reversal Audit Log
                  </div>
                  <div>
                    Reversal Txn ID: <span className="font-bold font-mono">{selectedTx.reversalTxNo || "—"}</span>
                  </div>
                  <div className="italic">Reason: "{selectedTx.reversalReason || "—"}"</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="border-t border-border/40 pt-3.5 mt-4">
            <Button className="rounded-xl h-10 w-full sm:w-auto font-semibold" onClick={() => setIsDetailsModalOpen(false)}>
              Close Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
