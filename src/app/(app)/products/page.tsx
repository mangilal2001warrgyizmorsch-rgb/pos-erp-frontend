"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, Loader2, Monitor, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Subcategory } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", sku: "", barcode: "", description: "", category: "", subcategoryId: "",
    hsnCode: "", purchasePrice: "", sellingPrice: "", stock: "", lowStockThreshold: "10", 
    unit: "piece", images: [] as string[]
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit: 15, search };
      if (selectedCategory !== "all") params.category = selectedCategory;
      const result = await productService.getAll(params as Parameters<typeof productService.getAll>[0]);
      setProducts(result.data);
      setTotalPages(result.pagination.pages);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, [page, search, selectedCategory]);

  const loadDependencies = useCallback(async () => {
    try {
      const [catData, subcatData] = await Promise.all([
        categoryService.getAll(),
        subcategoryService.getAll()
      ]);
      setCategories(catData);
      setSubcategories(subcatData);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadDependencies(); }, [loadDependencies]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ 
      name: "", sku: "", barcode: "", description: "", category: "", subcategoryId: "",
      hsnCode: "", purchasePrice: "", sellingPrice: "", stock: "", lowStockThreshold: "10", 
      unit: "piece", images: []
    });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    const catId = typeof product.category === "string" ? product.category : product.category._id;
    const subcatId = product.subcategoryId ? (typeof product.subcategoryId === "string" ? product.subcategoryId : (product.subcategoryId as any)._id) : "";
    
    setForm({
      name: product.name, sku: product.sku, barcode: product.barcode || "",
      description: product.description || "", category: catId, subcategoryId: subcatId,
      hsnCode: product.hsnCode || "", purchasePrice: String(product.purchasePrice), 
      sellingPrice: String(product.sellingPrice), stock: String(product.stock), 
      lowStockThreshold: String(product.lowStockThreshold), unit: product.unit,
      images: product.images || (product.image ? [product.image] : [])
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.category || !form.purchasePrice || !form.sellingPrice || !form.stock) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSaving(true);
      const payload: Partial<Product> = {
        name: form.name,
        sku: form.sku,
        barcode: form.barcode,
        description: form.description,
        category: form.category,
        subcategoryId: form.subcategoryId || undefined,
        hsnCode: form.hsnCode,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        unit: form.unit as "piece" | "kg" | "liter" | "meter" | "box" | "dozen",
        images: form.images,
        image: form.images.length > 0 ? form.images[0] : undefined // fallback for older code
      };

      if (editProduct) {
        await productService.update(editProduct._id, payload);
        toast.success("Product updated");
      } else {
        await productService.create(payload);
        toast.success("Product created");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productService.delete(deleteId);
      toast.success("Product deleted");
      loadProducts();
    } catch { toast.error("Failed to delete product"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your complete product inventory"
        icon={Package}
        action={{ label: "Add Product", onClick: openCreate, icon: Plus }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products by name, SKU..." />
        </div>
        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? <div className="p-4"><TableSkeleton rows={8} /></div> : products.length === 0 ? (
          <EmptyState title="No products found" description={search ? "Try a different search term" : "Add your first product to get started"}>
            {!search && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Product</Button>}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Sr No</TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU / HSN</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, i) => {
                  const catName = typeof product.category === "string" ? product.category : product.category?.name;
                  let subcatName = "—";
                  if (product.subcategoryId) {
                    const subcat = subcategories.find(s => s._id === (typeof product.subcategoryId === "string" ? product.subcategoryId : (product.subcategoryId as any)._id));
                    if (subcat) subcatName = subcat.name;
                  }
                  
                  return (
                    <TableRow key={product._id} className="hover:bg-muted/30">
                      <TableCell className="text-center text-muted-foreground">{(page - 1) * 15 + i + 1}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden border">
                          {(product.images && product.images.length > 0) || product.image ? (
                            <img src={product.images?.[0] || product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{catName}</p>
                          <p className="text-muted-foreground">{subcatName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono">
                          <p>{product.sku}</p>
                          <p className="text-muted-foreground">{product.hsnCode || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.sellingPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={product.stock === 0 ? "destructive" : product.stock <= product.lowStockThreshold ? "warning" : "success"}
                          className="whitespace-nowrap"
                        >
                          {product.stock} {product.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)} className="hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteId(product._id); setDeleteOpen(true); }} className="hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Fill in the product details and upload images.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Images */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <ImageUploader 
                multiple
                value={form.images} 
                onChange={(urls) => setForm({ ...form, images: urls as string[] })} 
                folder="products"
                maxFiles={10}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => {
                  setForm({ ...form, category: v, subcategoryId: "" }); // reset subcat
                }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={form.subcategoryId} onValueChange={(v) => setForm({ ...form, subcategoryId: v })} disabled={!form.category}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.filter(s => {
                      const pId = typeof s.parentCategoryId === 'string' ? s.parentCategoryId : (s.parentCategoryId as any)._id;
                      return pId === form.category;
                    }).map((sub) => (
                      <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="SKU-001" />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} placeholder="HSN" />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Barcode" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label>Purchase Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input type="number" className="pl-7" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selling Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input type="number" className="pl-7" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stock *</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["piece", "kg", "liter", "meter", "box", "dozen"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editProduct ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
