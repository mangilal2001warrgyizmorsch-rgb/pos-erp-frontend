"use client";

import { useEffect, useState, useCallback } from "react";
import { Tags, Plus, Pencil, Trash2, Loader2, Search, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { productService } from "@/services/productService";
import { Switch } from "@/components/ui/switch";
import type { Category, Subcategory } from "@/types";

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editSubcat, setEditSubcat] = useState<Subcategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterParentId, setFilterParentId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [form, setForm] = useState({ name: "", description: "", image: "", parentCategoryId: "", isActive: true });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const cats = await categoryService.getAll({ all: "true" });
      setCategories(cats);

      const params: Record<string, any> = { all: "true", page, limit: 15 };
      if (search) params.search = search;
      if (filterParentId && filterParentId !== "all") params.parentCategoryId = filterParentId;

      const result = await subcategoryService.getAll(params);
      setSubcategories(result.data);
      setTotalPages(result.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }, [search, filterParentId, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filterParentId, loadData]);

  useEffect(() => {
    setPage(1);
  }, [search, filterParentId]);

  const openCreate = () => {
    setEditSubcat(null);
    setForm({ name: "", description: "", image: "", parentCategoryId: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (subcat: Subcategory) => {
    setEditSubcat(subcat);
    setForm({ 
      name: subcat.name, 
      description: subcat.description || "", 
      image: subcat.image || "", 
      parentCategoryId: subcat.parentCategoryId ? (typeof subcat.parentCategoryId === 'string' ? subcat.parentCategoryId : (subcat.parentCategoryId as Category)._id) : "",
      isActive: subcat.isActive
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (!form.parentCategoryId) { toast.error("Parent Category is required"); return; }
    try {
      setSaving(true);
      if (editSubcat) {
        await subcategoryService.update(editSubcat._id, form);
        toast.success("Updated successfully");
      } else {
        await subcategoryService.create(form);
        toast.success("Created successfully");
      }
      setDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { 
      await subcategoryService.delete(deleteId); 
      toast.success("Deleted successfully"); 
      loadData(); 
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Subcategories" 
        description="Manage product subcategories and hierarchies" 
        icon={Tags}
        action={{ label: "Add Subcategory", onClick: openCreate, icon: Plus }} 
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subcategories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterParentId} onValueChange={setFilterParentId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Main Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : subcategories.length === 0 ? (
          <EmptyState title="No subcategories found" description={search || filterParentId !== 'all' ? "Try clearing your filters" : "Create your first subcategory"}>
            {!(search || filterParentId !== 'all') && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Subcategory</Button>}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Sr No</TableHead>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead>Subcategory Name</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((subcat, i) => (
                  <TableRow key={subcat._id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border">
                        {subcat.image ? (
                          <img src={subcat.image} alt={subcat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{subcat.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{subcat.customId || `SUBCAT-00${i+1}`}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 font-normal">
                        {subcat.parentCategoryId 
                          ? (() => {
                              const parentId = typeof subcat.parentCategoryId === 'string' ? subcat.parentCategoryId : (subcat.parentCategoryId as any)?._id;
                              return typeof subcat.parentCategoryId === 'object' && subcat.parentCategoryId !== null
                                ? (subcat.parentCategoryId as any).name
                                : categories.find((c) => c._id === parentId)?.name || 'Unknown';
                            })()
                          : 'No Parent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {subcat.productCount || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${subcat.isActive ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground bg-muted"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${subcat.isActive ? "bg-emerald-600" : "bg-muted-foreground"}`}></span>
                        {subcat.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(subcat)} className="h-8 hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                        <Button variant="outline" size="icon-sm" onClick={() => { setDeleteId(subcat._id); setDeleteOpen(true); }} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground">
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSubcat ? "Edit Subcategory" : "Add New Subcategory"}</DialogTitle>
            <DialogDescription>Add details for this subcategory and assign it to a main category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Subcategory Image</Label>
              <ImageUploader 
                value={form.image} 
                onChange={(url) => setForm({ ...form, image: url as string })} 
                folder="subcategories"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Main Category *</Label>
              <Select value={form.parentCategoryId} onValueChange={(val) => setForm({ ...form, parentCategoryId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Parent Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategory Name *</Label>
              <Input placeholder="e.g. Mobile Phones" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Visible in POS and product catalog</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(val) => setForm({ ...form, isActive: val })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editSubcat ? "Update Subcategory" : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Subcategory"
        description="This action will hide the subcategory. It cannot be undone." confirmLabel="Delete Subcategory" onConfirm={handleDelete} />
    </div>
  );
}
