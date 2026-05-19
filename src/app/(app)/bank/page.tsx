"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  QrCode,
  ReceiptText,
  Eye,
  History,
  Trash2,
  MoreVertical,
  SlidersHorizontal,
  Building,
  Loader2,
  Pencil
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { bankService } from "@/services/bankService";
import { BankAccount } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function BankAccountsPage() {
  const router = useRouter();

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editBank, setEditBank] = useState<BankAccount | null>(null);
  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    openingBalance: "",
  });

  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bankService.getAll();
      if (response.success) {
        setBanks(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch bank accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleEditClick = (bank: BankAccount) => {
    setEditBank(bank);
    setForm({
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      openingBalance: bank.openingBalance?.toString() || "0",
    });
  };

  const handleSave = async () => {
    try {
      if (!form.accountName || !form.accountNumber || !form.ifscCode) {
        toast.error("Please fill all required fields");
        return;
      }
      
      let response;
      if (editBank) {
        response = await bankService.update(editBank._id, form);
      } else {
        response = await bankService.create(form);
      }

      if (response.success) {
        toast.success(editBank ? "Bank account updated successfully" : "Bank account added successfully");
        setIsAddModalOpen(false);
        setEditBank(null);
        setForm({
          accountName: "",
          accountNumber: "",
          ifscCode: "",
          openingBalance: "",
        });
        fetchBanks();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Failed to ${editBank ? "update" : "add"} bank account`,
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await bankService.delete(id);
      if (response.success) {
        toast.success("Bank account deleted successfully");
        fetchBanks();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete bank account",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Bank Accounts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Configure register nodes, check balances, print invoice coordinates, and monitor transactional assets.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground rounded-full shadow-md text-xs sm:text-sm font-semibold h-10 px-5"
            onClick={() => { setEditBank(null); setForm({ accountName: "", accountNumber: "", ifscCode: "", openingBalance: "" }); setIsAddModalOpen(true); }}
          >
            <Plus className="mr-1.5 h-4 w-4 shrink-0" /> Add Bank Account
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-semibold">Loading accounts registry...</p>
          </div>
        </div>
      ) : banks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 min-h-[500px] border-0 shadow-sm bg-card rounded-2xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full text-center space-y-6"
          >
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Manage Multiple Bank Accounts
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Track multiple active banks and cash flow registers. Record settlements dynamically using methods like Banks, UPI, Net Banking, and Debit Cards.
            </p>

            <div className="py-8 flex justify-center">
              <div className="relative w-48 h-36 flex items-center justify-center">
                <Building2 className="w-24 h-24 text-muted/30" />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className="absolute top-2 right-6 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm text-primary font-extrabold text-sm"
                >
                  ₹
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute bottom-6 left-6 w-7.5 h-7.5 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm text-primary font-bold text-xs"
                >
                  ₹
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pb-4">
              <Card className="p-4 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm mb-1">
                  Invoice Printouts
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Print account coordinates for standard NEFT/IMPS/RTGS.
                </p>
              </Card>

              <Card className="p-4 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm mb-1">Multi-Channel</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Track separate wallets, cards, and UPI codes.
                </p>
              </Card>

              <Card className="p-4 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm mb-1">
                  UPI Payments
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Print custom UPI QR codes directly onto invoices.
                </p>
              </Card>
            </div>

            <Button
              className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-full px-8 py-5.5 shadow-md font-semibold text-sm"
              onClick={() => { setEditBank(null); setForm({ accountName: "", accountNumber: "", ifscCode: "", openingBalance: "" }); setIsAddModalOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Bank Account
            </Button>
          </motion.div>
        </Card>
      ) : (
        <Card className="border border-border/40 shadow-sm bg-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                  <th className="p-4">Bank Name</th>
                  <th className="p-4">Account Number</th>
                  <th className="p-4 hidden sm:table-cell">IFSC Code</th>
                  <th className="p-4 text-right">Current Balance</th>
                  <th className="p-4 text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank, idx) => (
                  <motion.tr
                    key={bank._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                    className="border-b border-border/40 hover:bg-muted/15 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/bank/${bank._id}`)}
                  >
                    <td className="p-4 font-semibold text-foreground">
                      {bank.accountName}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {bank.accountNumber}
                    </td>
                    <td className="p-4 uppercase text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                      {bank.ifscCode}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-primary text-xs sm:text-sm">
                      {formatCurrency(bank.currentBalance)}
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8.5 w-8.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/bank/${bank._id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8.5 w-8.5 rounded-lg hover:bg-primary/10 text-primary"
                          onClick={() => router.push(`/cash-bank/transaction-history?accountId=${bank._id}`)}
                          title="View Transaction History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8.5 w-8.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem
                              className="font-semibold cursor-pointer rounded-lg text-foreground focus:bg-muted"
                              onClick={() => { handleEditClick(bank); setIsAddModalOpen(true); }}
                            >
                              <Pencil className="mr-2 h-4 w-4 shrink-0" /> Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 font-semibold cursor-pointer rounded-lg focus:text-red-500 focus:bg-red-500/5"
                              onClick={() => handleDelete(bank._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4 shrink-0" /> Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Bank Account Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-2xl border-0 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary animate-pulse" /> {editBank ? "Edit Bank Account" : "Add Bank Account"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter bank details to track transactions and print automatically on invoice receipts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4.5 text-foreground">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold">Bank Name (eg. SBI, HDFC)</Label>
              <Input
                id="name"
                placeholder="Bank Name"
                className="rounded-xl h-10"
                value={form.accountName}
                onChange={(e) =>
                  setForm({ ...form, accountName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc" className="text-xs font-semibold">Account Number</Label>
              <Input
                id="acc"
                placeholder="Account Number"
                className="rounded-xl h-10 font-mono"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ifsc" className="text-xs font-semibold">IFSC Code</Label>
              <Input
                id="ifsc"
                placeholder="IFSC Code"
                className="rounded-xl h-10 uppercase"
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bal" className="text-xs font-semibold">Opening Balance</Label>
              <Input
                id="bal"
                type="number"
                placeholder="₹ 0.00"
                className="rounded-xl h-10"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" className="rounded-xl h-10" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-10 px-5 font-semibold" onClick={handleSave}>
              {editBank ? "Update Bank Account" : "Save Bank Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
