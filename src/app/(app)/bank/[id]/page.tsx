"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  History,
  Loader2,
  Pencil,
  Trash2,
  ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { bankService } from "@/services/bankService";
import { cashBankService } from "@/services/cashBankService";
import { BankAccount } from "@/types";
import { toast } from "sonner";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function BankAccountDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [bank, setBank] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    openingBalance: "",
  });

  // Fetch bank details and transactions specifically for this account ID
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bankRes, txRes] = await Promise.all([
        bankService.getById(id),
        cashBankService.getTransactions({ accountId: id })
      ]);

      if (bankRes.success && bankRes.data) {
        setBank(bankRes.data);
        setEditForm({
          accountName: bankRes.data.accountName,
          accountNumber: bankRes.data.accountNumber,
          ifscCode: bankRes.data.ifscCode,
          openingBalance: String(bankRes.data.openingBalance || 0),
        });
      }
      
      if (txRes.success && txRes.data) {
        setTransactions(txRes.data);
      }
    } catch (err) {
      toast.error("Failed to load bank account details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle account edit save
  const handleUpdate = async () => {
    try {
      if (!editForm.accountName || !editForm.accountNumber || !editForm.ifscCode) {
        toast.error("Please fill all required fields");
        return;
      }
      const res = await bankService.update(id, {
        ...editForm,
        openingBalance: Number(editForm.openingBalance || 0)
      });
      if (res.success) {
        toast.success("Bank details updated successfully");
        setIsEditModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update account");
    }
  };

  // Handle account deletion
  const handleDelete = async () => {
    try {
      const res = await bankService.delete(id);
      if (res.success) {
        toast.success("Bank account deleted successfully");
        setIsDeleteModalOpen(false);
        router.push("/bank");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  // Redirection helper to Transaction History page with filter mapping
  const handleRedirectToHistory = () => {
    router.push(`/cash-bank/transaction-history?accountId=${id}`);
  };

  if (loading && !bank) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-semibold">Retrieving bank details...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <Card className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold">Bank Account Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          The requested bank account does not exist or may have been deleted.
        </p>
        <Button className="mt-5 rounded-full" onClick={() => router.push("/bank")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <Button
            variant="link"
            className="p-0 h-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5"
            onClick={() => router.push("/bank")}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Bank Accounts
          </Button>
          <div className="flex items-center gap-3">
            <div className="page-icon-tile">
              <Building2 />
            </div>
            <h1 className="page-title">
              {bank.accountName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-full h-10 px-4 flex items-center gap-2 border-border/50 bg-card hover:bg-muted text-xs sm:text-sm shadow-sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="h-4 w-4 text-primary shrink-0" /> Edit Account
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-full h-10 px-4 flex items-center gap-2 border-red-500/20 hover:border-red-500 bg-card hover:bg-red-500/5 text-red-500 text-xs sm:text-sm shadow-sm transition-colors"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4 shrink-0" /> Delete Account
          </Button>
        </div>
      </div>

      {/* Account Info and Callout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Account Metadata */}
        <Card className="app-card lg:col-span-2 p-5 sm:p-6 relative overflow-hidden group">
          <div className="absolute right-4.5 top-4.5 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Account Number</Label>
              <div className="receipt-code text-base sm:text-lg mt-1 select-all">
                {bank.accountNumber}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">IFSC Code</Label>
                <div className="receipt-code text-sm uppercase mt-1">
                  {bank.ifscCode}
                </div>
              </div>
              <div>
                <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Opening Balance</Label>
                <div className="text-sm font-semibold mt-1 text-foreground">
                  {formatCurrency(bank.openingBalance || 0)}
                </div>
              </div>
            </div>
            <div className="border-t border-border/40 pt-4.5">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Balance</Label>
              <div className="amount-positive text-2xl sm:text-3xl mt-1">
                {formatCurrency(bank.currentBalance)}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Card: Full Ledger History Redirect Callout */}
        <Card className="p-5 sm:p-6 border border-border/40 bg-gradient-to-br from-primary/5 via-muted/30 to-muted/20 shadow-sm rounded-2xl flex flex-col justify-between items-start gap-4">
          <div className="space-y-2.5">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <History className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base text-foreground">
              Interactive Financial Ledger
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track multi-channel inflows, view payment modules, print receipts, reverse duplicates, and filter custom ranges in the central cash & bank registry.
            </p>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs sm:text-sm rounded-full shadow-md py-5.5 flex items-center justify-center gap-1.5"
            onClick={handleRedirectToHistory}
          >
            <ReceiptText className="h-4 w-4 shrink-0" /> View Full Transaction History
          </Button>
        </Card>
      </div>

      {/* Recent Associated Transactions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary" /> Recent Account Activity
          </h2>
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Showing last {transactions.slice(0, 10).length} entries
          </span>
        </div>
        
        <Card className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="app-table-head border-b">
                  <th className="p-4 hidden sm:table-cell">Date & Time</th>
                  <th className="p-4">Txn ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 hidden sm:table-cell">Payment Mode</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <History className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No recent transactions recorded for this account.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((tx, idx) => {
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
                        {/* Date */}
                        <td className="p-4 font-mono text-xs hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                          {formatDate(tx.date)}
                        </td>

                        {/* Txn ID */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="receipt-code text-xs sm:text-sm">
                              {tx.transactionNo}
                            </span>
                            <span className="text-[10px] text-muted-foreground sm:hidden font-mono mt-0.5 whitespace-nowrap">
                              {formatDate(tx.date)}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="p-4 font-semibold capitalize text-xs sm:text-sm text-foreground">
                          {tx.type.replace(/_/g, " ")}
                        </td>

                        {/* Payment Mode */}
                        <td className="p-4 text-xs font-bold text-muted-foreground hidden sm:table-cell">
                          {tx.paymentMode}
                        </td>

                        {/* Directional Amount */}
                        <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                          {tx.direction === "in" ? (
                            <span className="amount-positive bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-1 rounded-lg text-xs sm:text-sm">
                              +{formatCurrency(tx.amount)}
                            </span>
                          ) : (
                            <span className="amount-negative bg-rose-500/10 dark:bg-rose-500/15 px-2.5 py-1 rounded-lg text-xs sm:text-sm">
                              -{formatCurrency(tx.amount)}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider",
                              tx.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
                              tx.status === "reversed" && "bg-amber-500/10 text-amber-600 dark:text-amber-500",
                              tx.status === "pending" && "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Bank Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Pencil className="h-5 w-5 text-primary" /> Edit Bank Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update details to sync dynamic statements and print correctly on business invoice receipts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4.5 text-foreground">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold">Bank Name (eg. SBI, HDFC)</Label>
              <Input
                id="name"
                placeholder="Bank Name"
                className="rounded-xl h-10"
                value={editForm.accountName}
                onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc" className="text-xs font-semibold">Account Number</Label>
              <Input
                id="acc"
                placeholder="Account Number"
                className="rounded-xl h-10 font-mono"
                value={editForm.accountNumber}
                onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ifsc" className="text-xs font-semibold">IFSC Code</Label>
              <Input
                id="ifsc"
                placeholder="IFSC Code"
                className="rounded-xl h-10 uppercase"
                value={editForm.ifscCode}
                onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bal" className="text-xs font-semibold">Opening Balance</Label>
              <Input
                id="bal"
                type="number"
                placeholder="₹ 0.00"
                className="rounded-xl h-10"
                value={editForm.openingBalance}
                onChange={(e) => setEditForm({ ...editForm, openingBalance: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 px-5 font-semibold" onClick={handleUpdate}>
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 font-bold">
              <AlertCircle className="h-5 w-5" /> Delete Bank Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this bank account? This will permanently remove the record from your accounts list. Transactions registered against this bank will be preserved but associated account fields will read null.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
