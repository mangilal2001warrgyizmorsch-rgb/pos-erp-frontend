"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Plus, Pencil, Trash2, Loader2, Search, Filter, FileDown, Settings } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supplierService } from "@/services/supplierService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Vyapar-style form state
  const [form, setForm] = useState({
    name: "", phone: "", gstNumber: "", gstType: "Unregistered/Consumer",
    stateCode: "", email: "", address: "", shippingAddress: "", enableShipping: false,
    openingBalance: 0, openingBalanceType: "Payable", creditLimit: 0,
    bankName: "", accountNumber: "", ifscCode: "", city: "", state: "", pincode: ""
  });

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
    setForm({
      name: "", phone: "", gstNumber: "", gstType: "Unregistered/Consumer",
      stateCode: "", email: "", address: "", shippingAddress: "", enableShipping: false,
      openingBalance: 0, openingBalanceType: "Payable", creditLimit: 0,
      bankName: "", accountNumber: "", ifscCode: "", city: "", state: "", pincode: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name: s.name, phone: s.phone, gstNumber: s.gstNumber || "", gstType: s.gstType || "Unregistered/Consumer",
      stateCode: s.state || "", email: s.email || "", address: s.address || "", shippingAddress: s.shippingAddress || "",
      enableShipping: !!s.shippingAddress, openingBalance: s.openingBalance || 0, openingBalanceType: s.openingBalanceType || "Payable",
      creditLimit: s.creditLimit || 0, bankName: s.bankName || "", accountNumber: s.accountNumber || "",
      ifscCode: s.ifscCode || "", city: s.city || "", state: s.state || "", pincode: s.pincode || ""
    });
    setDialogOpen(true);
  };

  const handleSave = async (saveAndNew = false) => {
    if (!form.name) { toast.error("Supplier Name is required"); return; }
    
    try {
      setSaving(true);
      const payload = {
        name: form.name, phone: form.phone, gstNumber: form.gstNumber, gstType: form.gstType,
        state: form.stateCode, email: form.email, address: form.address,
        shippingAddress: form.enableShipping ? form.shippingAddress : undefined,
        openingBalance: form.openingBalance, openingBalanceType: form.openingBalanceType, creditLimit: form.creditLimit,
        bankName: form.bankName, accountNumber: form.accountNumber, ifscCode: form.ifscCode,
        city: form.city, pincode: form.pincode
      };

      if (editItem) {
        await supplierService.update(editItem._id, payload as any);
        toast.success("Supplier Updated");
      } else {
        await supplierService.create(payload as any);
        toast.success("Supplier Created");
      }
      
      load();

      if (saveAndNew) {
        openCreate();
      } else {
        setDialogOpen(false);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supplierService.delete(deleteId);
      toast.success("Deleted successfully");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers / Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your suppliers and payables.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><FileDown className="h-4 w-4 mr-2" /> Export</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Suppliers..." className="pl-8 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      {loading ? <TableSkeleton rows={6} /> : suppliers.length === 0 ? (
        <EmptyState title="No suppliers found" description="Add your first supplier to start purchasing">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Supplier</Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden border-0 shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Party Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">GSTIN</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Purchases</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Balance</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{s.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">
                      <div className="flex flex-col">
                        <span>{s.phone || "—"}</span>
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden lg:table-cell text-muted-foreground">{s.gstNumber || "—"}</td>
                    <td className="p-4 text-sm text-right">
                      <Badge variant="outline" className="bg-background">{s.totalPurchases || 0}</Badge>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <span className={cn(
                        "font-semibold",
                        (s.outstandingAmount > 0 || (s.openingBalanceType === "Payable" && (s.openingBalance || 0) > 0)) ? "text-red-500" : "text-emerald-500"
                      )}>
                        {formatCurrency(s.outstandingAmount || s.openingBalance || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
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

      {/* Vyapar Style Add Party Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {editItem ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Settings className="h-5 w-5 text-muted-foreground" /></Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-6">
            {/* Top Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 relative">
                <Label className="text-xs font-semibold text-emerald-600 absolute -top-2 left-2 bg-card px-1 z-10">Party Name *</Label>
                <Input 
                  className="border-emerald-500 focus-visible:ring-emerald-500 pt-2"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <Input placeholder="GSTIN" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-1.5">
                <Input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            {/* Tabs Area */}
            <Tabs defaultValue="gst" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger value="gst" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 px-0 pb-2 pt-2">
                  GST & Address
                </TabsTrigger>
                <TabsTrigger value="credit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 px-0 pb-2 pt-2">
                  Credit & Balance <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-[10px] px-1 py-0 h-4">New</Badge>
                </TabsTrigger>
                <TabsTrigger value="additional" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 px-0 pb-2 pt-2">
                  Additional Fields
                </TabsTrigger>
              </TabsList>

              <div className="pt-6 pb-2 min-h-[200px]">
                <TabsContent value="gst" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Col */}
                    <div className="space-y-4">
                      <div className="space-y-1.5 relative mt-2">
                        <Label className="text-xs text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">GST Type</Label>
                        <Select value={form.gstType} onValueChange={(v) => setForm({...form, gstType: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unregistered/Consumer">Unregistered/Consumer</SelectItem>
                            <SelectItem value="Registered/Regular">Registered/Regular</SelectItem>
                            <SelectItem value="Composition">Composition</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 relative mt-4">
                        <Select value={form.stateCode} onValueChange={(v) => setForm({...form, stateCode: v})}>
                          <SelectTrigger className="text-muted-foreground"><SelectValue placeholder="State" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="27">Maharashtra</SelectItem>
                            <SelectItem value="24">Gujarat</SelectItem>
                            <SelectItem value="07">Delhi</SelectItem>
                            <SelectItem value="29">Karnataka</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Input placeholder="Email ID" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Billing Address</Label>
                        <Textarea placeholder="Billing Address" className="resize-none h-24" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Shipping Address</Label>
                          {!form.enableShipping && (
                            <Button variant="link" className="h-auto p-0 text-emerald-600" onClick={() => setForm({...form, enableShipping: true})}>
                              <Plus className="h-3 w-3 mr-1" /> Enable Shipping Address
                            </Button>
                          )}
                        </div>
                        {form.enableShipping && (
                          <div className="relative">
                            <Textarea placeholder="Shipping Address" className="resize-none h-24" value={form.shippingAddress} onChange={(e) => setForm({...form, shippingAddress: e.target.value})} />
                            <Button variant="ghost" size="sm" className="absolute -top-6 right-0 text-xs text-muted-foreground h-auto p-0" onClick={() => setForm({...form, enableShipping: false, shippingAddress: ""})}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="credit" className="mt-0">
                  <div className="max-w-md space-y-6">
                    <div className="flex items-end gap-4">
                      <div className="flex-1 space-y-1.5 relative mt-2">
                        <Label className="text-xs text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">Opening Balance</Label>
                        <Input type="number" value={form.openingBalance || ""} onChange={(e) => setForm({...form, openingBalance: Number(e.target.value)})} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Select value={form.openingBalanceType} onValueChange={(v) => setForm({...form, openingBalanceType: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Payable">To Pay</SelectItem>
                            <SelectItem value="Receivable">To Receive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Credit Limit</Label>
                      <Input type="number" value={form.creditLimit || ""} onChange={(e) => setForm({...form, creditLimit: Number(e.target.value)})} placeholder="₹ 0.00" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm border-b pb-2">Bank Details</h3>
                      <div className="space-y-1.5">
                        <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Input placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Input placeholder="IFSC Code" value={form.ifscCode} onChange={(e) => setForm({...form, ifscCode: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm border-b pb-2">Regional Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Input placeholder="City" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/10 sm:justify-end gap-2">
            <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSave(true)} disabled={saving}>
              Save & New
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Supplier Party"
        description="This action cannot be undone. All ledgers related to this party might be affected." confirmLabel="Delete" onConfirm={handleDelete} />
    </div>
  );
}
