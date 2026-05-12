"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UserCheck, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { supplierService } from "@/services/supplierService";
import { formatCurrency } from "@/lib/utils";
import type { Supplier } from "@/types";

const emptyForm = {
  name: "", phone: "", email: "", gstNumber: "", address: "", city: "", state: "", pincode: "",
  bankName: "", accountNumber: "", ifscCode: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supplierService.getAll({ search, limit: 50 });
      setSuppliers(result.data);
    } catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name: s.name, phone: s.phone, email: s.email || "", gstNumber: s.gstNumber || "",
      address: s.address || "", city: s.city || "", state: s.state || "", pincode: s.pincode || "",
      bankName: s.bankName || "", accountNumber: s.accountNumber || "", ifscCode: s.ifscCode || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    try {
      setSaving(true);
      if (editItem) {
        await supplierService.update(editItem._id, form);
        toast.success("Supplier updated");
      } else {
        await supplierService.create(form);
        toast.success("Supplier created");
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
      await supplierService.delete(deleteId);
      toast.success("Supplier deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const f = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your supplier directory"
        icon={UserCheck}
        action={{ label: "Add Supplier", onClick: openCreate, icon: Plus }}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers by name, phone, GST..." className="max-w-sm" />

      {loading ? <TableSkeleton rows={6} /> : suppliers.length === 0 ? (
        <EmptyState title="No suppliers found" description="Add your first supplier to start purchasing">
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sr No</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">GST Number</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Purchases</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Outstanding</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <motion.tr
                    key={s._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.address && <p className="text-xs text-muted-foreground line-clamp-1">{s.city || s.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">{s.phone}</td>
                    <td className="p-4 text-sm font-mono hidden lg:table-cell">{s.gstNumber || "—"}</td>
                    <td className="p-4 text-sm text-right hidden md:table-cell">
                      <Badge variant="secondary">{s.totalPurchases || 0}</Badge>
                    </td>
                    <td className="p-4 text-sm text-right hidden lg:table-cell">
                      <span className={s.outstandingAmount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {formatCurrency(s.outstandingAmount || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteId(s._id); setDeleteOpen(true); }}>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} Supplier</DialogTitle>
            <DialogDescription>Enter supplier details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="Enter mobile" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} placeholder="Enter email" />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={form.gstNumber} onChange={(e) => f("gstNumber", e.target.value)} placeholder="e.g. 27AABCU9603R1ZM" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="Full address" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => f("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => f("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={form.pincode} onChange={(e) => f("pincode", e.target.value)} />
              </div>
            </div>

            {/* Bank Details */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Bank Details (Optional)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={(e) => f("bankName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Account No.</Label>
                  <Input value={form.accountNumber} onChange={(e) => f("accountNumber", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={(e) => f("ifscCode", e.target.value)} />
                </div>
              </div>
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
        title="Delete Supplier"
        description="This will permanently remove this supplier. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
