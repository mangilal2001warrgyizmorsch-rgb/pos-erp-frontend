"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Filter, FileDown, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { SupplierModal } from "@/components/shared/SupplierModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supplierService } from "@/services/supplierService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Supplier } from "@/types";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supplierService.getAll({ search, limit: 50 });
      setSuppliers(result.data);
    } catch { 
      toast.error("Failed to load suppliers"); 
    } finally { 
      setLoading(false); 
    }
  }, [search]);

  useEffect(() => { 
    load(); 
  }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, s: Supplier) => {
    e.stopPropagation();
    setEditItem(s);
    setDialogOpen(true);
  };

  const openDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supplierService.delete(deleteId);
      toast.success("Supplier deleted successfully");
      load();
    } catch { 
      toast.error("Failed to delete supplier"); 
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your vendor relationships and payables"
        icon={Users}
        action={{ label: "Add Supplier", onClick: openCreate, icon: Plus }}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Suppliers..." 
            className="pl-8 bg-card border-muted-foreground/20" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Button variant="outline" size="icon" className="border-muted-foreground/20"><Filter className="h-4 w-4" /></Button>
        <Button variant="outline" className="border-muted-foreground/20 ml-auto hidden sm:flex">
          <FileDown className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : suppliers.length === 0 ? (
        <EmptyState 
          title="No suppliers found" 
          description={search ? "Try a different search term" : "Add your first supplier to start managing purchases"}
          action={!search ? { label: "Add Supplier", onClick: openCreate, icon: Plus } : undefined}
        />
      ) : (
        <Card className="overflow-hidden border-0 shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Party Name</th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Contact</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Purchases</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Balance</th>
                  <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <motion.tr 
                    key={s._id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/suppliers/${s._id}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20 shrink-0 aspect-square">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                            {s.gstNumber || "No GST"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.phone || "—"}</span>
                        <span className="text-xs text-muted-foreground">{s.email || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Badge variant="secondary" className="bg-muted font-bold px-2 py-0.5 text-[10px]">
                        {s.totalPurchases || 0}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <span className={cn(
                        "font-bold",
                        (s.outstandingBalance > 0 || (s.openingBalanceType === "Payable" && (s.openingBalance || 0) > 0)) ? "text-rose-500" : "text-emerald-500"
                      )}>
                        {formatCurrency(s.outstandingBalance || s.openingBalance || 0)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={(e) => openEdit(e, s)}
                          className="hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={(e) => openDelete(e, s._id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <SupplierModal 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editItem}
        onSuccess={load}
      />

      <ConfirmDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        title="Delete Supplier"
        description="This action cannot be undone. All ledger history for this supplier will be permanently removed." 
        confirmLabel="Delete" 
        onConfirm={handleDelete} 
      />
    </div>
  );
}
