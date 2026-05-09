"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tags, Plus, Pencil, Trash2, Loader2, Search, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import type { Category, Product } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({ name: "", description: "", image: "" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll({ search });
      setCategories(data);
      
      // Fetch products to compute counts
      try {
        const prodData = await productService.getAll({ limit: 1000 });
        const counts: Record<string, number> = {};
        prodData.data.forEach((p) => {
          const catId = typeof p.category === 'string' ? p.category : p.category._id;
          counts[catId] = (counts[catId] || 0) + 1;
        });
        setProductCounts(counts);
      } catch {
        // ignore products fetch fail
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, load]);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: "", description: "", image: "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || "", image: cat.image || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    try {
      setSaving(true);
      if (editCat) {
        await categoryService.update(editCat._id, form);
        toast.success("Updated successfully");
      } else {
        await categoryService.create(form);
        toast.success("Created successfully");
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
      await categoryService.delete(deleteId); 
      toast.success("Deleted successfully"); 
      load(); 
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categories" 
        description="Manage product categories and images" 
        icon={Tags}
        action={{ label: "Add Category", onClick: openCreate, icon: Plus }} 
      />

      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : categories.length === 0 ? (
          <EmptyState title="No categories found" description={search ? "Try a different search term" : "Create your first category to organize products"}>
            {!search && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Category</Button>}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Sr No</TableHead>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat, i) => (
                  <TableRow key={cat._id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{cat.customId || `CAT-00${i+1}`}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {productCounts[cat._id] || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(cat)} className="h-8 hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                        <Button variant="outline" size="icon-sm" onClick={() => { setDeleteId(cat._id); setDeleteOpen(true); }} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>Add an image and details for this category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUploader 
                value={form.image} 
                onChange={(url) => setForm({ ...form, image: url as string })} 
                folder="categories"
              />
            </div>
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input placeholder="e.g. Electronics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this category..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editCat ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Category"
        description="This action will hide the category from POS. It cannot be undone." confirmLabel="Delete Category" onConfirm={handleDelete} />
    </div>
  );
}
