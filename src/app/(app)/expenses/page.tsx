"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { IndianRupee, Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseService } from "@/services/expenseService";
import { cashBankService } from "@/services/cashBankService";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";

const emptyForm = {
  title: "",
  amount: "",
  category: "Office Supplies",
  date: new Date().toISOString().split("T")[0],
  description: "",
  paymentMethod: "cash",
  reference: "",
  cashBankAccountId: "",
};

const EXPENSE_CATEGORIES = [
  "Office Supplies", "Rent", "Utilities", "Salaries", "Marketing", "Travel", "Maintenance", "Miscellaneous"
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await expenseService.getAll({ search, limit: 500 });
      setExpenses(result.data);
    } catch { toast.error("Failed to load expenses"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    cashBankService.getAccounts()
      .then(res => {
        if (res.success && res.data) {
          setBankAccounts(res.data.filter((a: any) => a.accountType === "bank" && a.status === "active"));
        }
      })
      .catch(() => toast.error("Failed to load bank accounts"));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditItem(e);
    setForm({
      title: e.title,
      amount: e.amount.toString(),
      category: typeof e.category === "string" ? e.category : e.category.name,
      date: new Date(e.date).toISOString().split("T")[0],
      description: e.description || "",
      paymentMethod: e.paymentMethod || "cash",
      reference: e.reference || "",
      cashBankAccountId: e.cashBankAccountId || "",
    });
    setDialogOpen(true);
  };

  const handlePaymentMethodChange = (val: string) => {
    let nextAccountId = form.cashBankAccountId;
    if (val !== "cash") {
      const defaultBank = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
      if (defaultBank && !nextAccountId) {
        nextAccountId = defaultBank._id;
      }
    } else {
      nextAccountId = "";
    }
    setForm({ ...form, paymentMethod: val, cashBankAccountId: nextAccountId });
  };

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!form.title || !form.amount) { toast.error("Title and amount are required"); return; }
    if (!amount || amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    if (form.paymentMethod !== "cash" && !form.cashBankAccountId) {
      toast.error("Please select a bank account for non-cash expense");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        amount,
        categoryName: form.category,
      };
      
      if (editItem) {
        await expenseService.update(editItem._id, payload);
        toast.success("Expense updated");
      } else {
        await expenseService.create(payload);
        toast.success("Expense created");
      }
      setDialogOpen(false);
      load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expenseService.delete(deleteId);
      toast.success("Expense deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage business expenses"
        icon={IndianRupee}
        action={{ label: "Add Expense", onClick: openCreate, icon: Plus }}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." className="max-w-sm" />

      {loading ? <TableSkeleton rows={5} /> : expenses.length === 0 ? (
        <EmptyState title="No expenses found" description="Add your first expense record">
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expense Details</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Payment Mode</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <motion.tr
                    key={e._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{e.title}</p>
                      {e.description && <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>}
                    </td>
                    <td className="p-4 text-sm">
                      <Badge variant="secondary" className="font-normal">
                        {typeof e.category === "string" ? e.category : e.category.name || e.categoryName}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-semibold text-destructive">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-4 text-center hidden md:table-cell text-sm capitalize">
                      {e.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteId(e._id); setDeleteOpen(true); }}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expense Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office Stationery" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={form.paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.paymentMethod !== "cash" && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label>Pay From Bank Account *</Label>
                <Select value={form.cashBankAccountId} onValueChange={(val) => setForm({ ...form, cashBankAccountId: val })}>
                  <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.accountName} {account.bankName ? `(${account.bankName})` : ""} - ₹{account.currentBalance.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Expense"
        description="This will permanently delete this expense record. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
