"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { CustomerModal } from "@/components/shared/CustomerModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { customerService } from "@/services/customerService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Customer } from "@/types";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await customerService.getAll({ search, page, limit: 15 });
      setCustomers(result.data);
      setTotalPages(result.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditCust(null);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    setEditCust(c);
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
      await customerService.delete(deleteId);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customers"
        icon={Users}
        action={{ label: "Add Customer", onClick: openCreate, icon: Plus }}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search customers..."
        className="max-w-sm"
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers" description="Add your first customer">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Phone
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Email
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Purchases
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Total Spent
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <Link 
                        href={`/customers/${c._id}`}
                        className="flex items-center gap-3 group/link hover:opacity-80 transition-opacity"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-sm font-bold shadow-sm shrink-0 aspect-square">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm group-hover/link:text-primary transition-colors">{c.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {c.phone}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">
                      {c.phone}
                    </td>
                    <td className="p-4 text-sm hidden lg:table-cell">
                      {c.email || "—"}
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Badge variant="secondary">{c.totalPurchases}</Badge>
                    </td>
                    <td className="p-4 text-sm text-right font-medium">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="p-4 text-sm text-right font-bold">
                      <span className={cn(
                        (c.walletBalance || 0) > 0 ? "text-emerald-500" : (c.walletBalance || 0) < 0 ? "text-red-500" : ""
                      )}>
                        {formatCurrency(c.walletBalance || 0)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => openEdit(e, c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => openDelete(e, c._id)}
                        >
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

      <CustomerModal 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editCust}
        onSuccess={load}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Customer"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
