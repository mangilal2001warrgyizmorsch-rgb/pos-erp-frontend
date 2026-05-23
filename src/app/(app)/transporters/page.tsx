"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { transporterService } from "@/services/transporterService";
import type { Transporter } from "@/types";

const emptyForm = { name: "", phone: "", vehicleNumber: "", address: "" };

export default function TransportersPage() {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<Transporter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await transporterService.getAll({ search, page, limit: 15 });
      setTransporters(result.data);
      setTotalPages(result.pagination?.pages || 1);
    } catch { toast.error("Failed to load transporters"); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: Transporter) => {
    setEditItem(t);
    setForm({
      name: t.name, phone: t.phone,
      vehicleNumber: t.vehicleNumber || "", address: t.address || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    try {
      setSaving(true);
      if (editItem) {
        await transporterService.update(editItem._id, form);
        toast.success("Transporter updated");
      } else {
        await transporterService.create(form);
        toast.success("Transporter created");
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
      await transporterService.delete(deleteId);
      toast.success("Transporter deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transporters"
        description="Manage transport partners and vehicles"
        icon={Truck}
        action={{ label: "Add Transporter", onClick: openCreate, icon: Plus }}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name, vehicle, phone..." className="max-w-sm" />

      {loading ? <TableSkeleton rows={5} /> : transporters.length === 0 ? (
        <EmptyState title="No transporters found" description="Add your first transporter">
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Transporter</Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sr No</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Transporter</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Vehicle Number</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Address</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transporters.map((t, i) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-sm">{t.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{t.phone}</td>
                    <td className="p-4 text-sm font-mono hidden md:table-cell">{t.vehicleNumber || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell line-clamp-1">{t.address || "—"}</td>
                    <td className="p-4 text-center">
                      <Badge variant={t.isActive ? "default" : "secondary"}>
                        {t.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteId(t._id); setDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} Transporter</DialogTitle>
            <DialogDescription>Enter transporter details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transporter Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter mobile" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="e.g. MH12AB1234" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Address" />
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
        title="Delete Transporter"
        description="This will permanently remove this transporter. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
