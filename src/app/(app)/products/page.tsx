"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ImageIcon,
  Barcode,
  QrCode,
  RefreshCw,
  Calendar,
  Tag,
  Info,
  Layers,
  Search,
  AlertCircle,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product, Category, Subcategory } from "@/types";
import { getSocket } from "@/lib/socket";

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
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    subcategoryId: "",
    hsnCode: "",
    stock: "0",
    lowStockThreshold: "10",
    unit: "piece",
    images: [] as string[],
    salesPrice: "0",
    purchasePrice: "0",
    taxRate: "0",
    salesTaxType: "without" as "inclusive" | "exclusive" | "without",
    purchaseTaxType: "without" as "inclusive" | "exclusive" | "without",
    openingStockPrice: "0",
    openingStockDate: new Date().toISOString().split("T")[0],
  });

  const generateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm((prev) => ({ ...prev, sku: `SKU-${random}` }));
  };

  const generateBarcode = () => {
    const random = Math.floor(100000000000 + Math.random() * 900000000000);
    setForm((prev) => ({ ...prev, barcode: String(random) }));
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit: 15, search };
      if (selectedCategory !== "all") params.category = selectedCategory;
      const result = await productService.getAll(
        params as Parameters<typeof productService.getAll>[0],
      );
      setProducts(result.data);
      setTotalPages(result.pagination.pages);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory]);

  const loadDependencies = useCallback(async () => {
    try {
      const [catData, subcatData] = await Promise.all([
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);
      setCategories(catData);
      setSubcategories(subcatData);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleInventoryUpdated = (data: { productId: string; stock: number }) => {
      setProducts((prevProducts) => 
        prevProducts.map((p) => 
          p._id === data.productId ? { ...p, stock: data.stock } : p
        )
      );
    };

    socket.on("inventory:updated", handleInventoryUpdated);
    
    return () => {
      socket.off("inventory:updated", handleInventoryUpdated);
    };
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setForm({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: "",
      description: "",
      category: "",
      subcategoryId: "",
      hsnCode: "",
      stock: "0",
      lowStockThreshold: "10",
      unit: "piece",
      images: [],
      salesPrice: "0",
      purchasePrice: "0",
      taxRate: "0",
      salesTaxType: "without",
      purchaseTaxType: "without",
      openingStockPrice: "0",
      openingStockDate: new Date().toISOString().split("T")[0],
    });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    const catId =
      typeof product.category === "string"
        ? product.category
        : product.category._id;
    const subcatId = product.subcategoryId
      ? typeof product.subcategoryId === "string"
        ? product.subcategoryId
        : (product.subcategoryId as any)._id
      : "";

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      description: product.description || "",
      category: catId,
      subcategoryId: subcatId,
      hsnCode: product.hsnCode || "",
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
      unit: product.unit,
      images: product.images || (product.image ? [product.image] : []),
      salesPrice: String(product.salesPrice || 0),
      purchasePrice: String(product.purchasePrice || 0),
      taxRate: String(product.taxRate || 0),
      salesTaxType: product.salesTaxType || "without",
      purchaseTaxType: product.purchaseTaxType || "without",
      openingStockPrice: String(product.openingStockPrice || 0),
      openingStockDate: product.openingStockDate
        ? new Date(product.openingStockDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.category) {
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
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        unit: form.unit as "piece" | "kg" | "liter" | "meter" | "box" | "dozen",
        images: form.images,
        image: form.images.length > 0 ? form.images[0] : undefined,
        salesPrice: Number(form.salesPrice),
        purchasePrice: Number(form.purchasePrice),
        taxRate: Number(form.taxRate),
        openingStockPrice: Number(form.openingStockPrice),
        openingStockDate: form.openingStockDate,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productService.delete(deleteId);
      toast.success("Product deleted");
      loadProducts();
    } catch {
      toast.error("Failed to delete product");
    }
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
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search products by name, SKU..."
          />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={(v) => {
            setSelectedCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              search
                ? "Try a different search term"
                : "Add your first product to get started"
            }
          >
            {!search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
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
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, i) => {
                  const catName =
                    typeof product.category === "string"
                      ? product.category
                      : product.category?.name;
                  let subcatName = "—";
                  if (product.subcategoryId) {
                    const subcat = subcategories.find(
                      (s) =>
                        s._id ===
                        (typeof product.subcategoryId === "string"
                          ? product.subcategoryId
                          : (product.subcategoryId as any)._id),
                    );
                    if (subcat) subcatName = subcat.name;
                  }

                  return (
                    <TableRow key={product._id} className="hover:bg-muted/30">
                      <TableCell className="text-center text-muted-foreground">
                        {(page - 1) * 15 + i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden border">
                          {(product.images && product.images.length > 0) ||
                          product.image ? (
                            <img
                              src={product.images?.[0] || product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">
                          {product.name}
                        </div>
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
                          <p className="text-muted-foreground">
                            {product.hsnCode || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            product.stock === 0
                              ? "destructive"
                              : product.stock <= product.lowStockThreshold
                                ? "warning"
                                : "success"
                          }
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(product)}
                            className="hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setDeleteId(product._id);
                              setDeleteOpen(true);
                            }}
                            className="hover:text-destructive"
                          >
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-primary">
                {editProduct ? "Edit Item" : "Add Item"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage product details, pricing and inventory levels
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 pr-8">
              <Button variant="ghost" size="icon" className="h-8 w-8"></Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <div className="px-6 pt-2 bg-muted/20 border-b">
              <TabsList className="bg-transparent border-b-0 h-10 p-0 gap-6">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 font-bold text-xs uppercase tracking-wider"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 font-bold text-xs uppercase tracking-wider"
                >
                  Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 font-bold text-xs uppercase tracking-wider"
                >
                  Stock
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="details" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Item Name *
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="E.g. Bread"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Item HSN
                    </Label>
                    <div className="relative">
                      <Input
                        value={form.hsnCode}
                        onChange={(e) =>
                          setForm({ ...form, hsnCode: e.target.value })
                        }
                        placeholder="HSN Code"
                        className="h-10 pr-9"
                      />
                      <Barcode className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Category
                    </Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm({ ...form, category: v, subcategoryId: "" })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Subcategory
                    </Label>
                    <Select
                      value={form.subcategoryId}
                      onValueChange={(v) =>
                        setForm({ ...form, subcategoryId: v })
                      }
                      disabled={!form.category}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories
                          .filter((s) => {
                            const pId =
                              typeof s.parentCategoryId === "string"
                                ? s.parentCategoryId
                                : (s.parentCategoryId as any)._id;
                            return pId === form.category;
                          })
                          .map((sub) => (
                            <SelectItem key={sub._id} value={sub._id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      SKU / Item Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.sku}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            sku: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="SKU-001"
                        className="h-10 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={generateSKU}
                        type="button"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Barcode
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.barcode}
                        onChange={(e) =>
                          setForm({ ...form, barcode: e.target.value })
                        }
                        placeholder="Scan or enter barcode"
                        className="h-10 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 shrink-0 text-[10px] font-bold uppercase"
                        onClick={generateBarcode}
                        type="button"
                      >
                        Assign Code
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-dashed border-muted-foreground/20">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    Item Images
                  </Label>
                  <ImageUploader
                    value={form.images}
                    onChange={(urls) =>
                      setForm({ ...form, images: urls as string[] })
                    }
                    folder="products"
                    multiple={true}
                    maxFiles={10}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Enter detailed product description..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Sale Price Section */}
                  <div className="space-y-4 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-bold text-sm">Sale Price</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Price
                        </Label>
                        <Input
                          type="number"
                          value={form.salesPrice}
                          onChange={(e) =>
                            setForm({ ...form, salesPrice: e.target.value })
                          }
                          className="h-10 font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Tax Type
                        </Label>
                        <Select 
                          value={form.salesTaxType || "without"}
                          onValueChange={(v) => setForm({ ...form, salesTaxType: v as any })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with">With Tax</SelectItem>
                            <SelectItem value="without">Without Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Price Section */}
                  <div className="space-y-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-sm">Purchase Price</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Price
                        </Label>
                        <Input
                          type="number"
                          value={form.purchasePrice}
                          onChange={(e) =>
                            setForm({ ...form, purchasePrice: e.target.value })
                          }
                          className="h-10 font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Tax Type
                        </Label>
                        <Select 
                          value={form.purchaseTaxType || "without"}
                          onValueChange={(v) => setForm({ ...form, purchaseTaxType: v as any })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with">With Tax</SelectItem>
                            <SelectItem value="without">Without Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-sm">Tax Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        GST Tax Rate (%)
                      </Label>
                      <Select
                        value={form.taxRate}
                        onValueChange={(v) => setForm({ ...form, taxRate: v })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">GST@0%</SelectItem>
                          <SelectItem value="5">GST@5%</SelectItem>
                          <SelectItem value="12">GST@12%</SelectItem>
                          <SelectItem value="18">GST@18%</SelectItem>
                          <SelectItem value="28">GST@28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Unit
                      </Label>
                      <Select
                        value={form.unit}
                        onValueChange={(v) => setForm({ ...form, unit: v })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "piece",
                            "kg",
                            "liter",
                            "meter",
                            "box",
                            "dozen",
                          ].map((u) => (
                            <SelectItem
                              key={u}
                              value={u}
                              className="capitalize"
                            >
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stock" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">
                          Opening Quantity
                        </Label>
                        <Input
                          type="number"
                          value={form.stock}
                          onChange={(e) =>
                            setForm({ ...form, stock: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-1.5 relative">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">
                          At Price
                        </Label>
                        <Input
                          type="number"
                          value={form.openingStockPrice}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              openingStockPrice: e.target.value,
                            })
                          }
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">
                          As Of Date
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={form.openingStockDate}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                openingStockDate: e.target.value,
                              })
                            }
                            className="h-11 pr-10"
                          />
                          <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5 relative">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">
                          Min Stock To Maintain
                        </Label>
                        <Input
                          type="number"
                          value={form.lowStockThreshold}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              lowStockThreshold: e.target.value,
                            })
                          }
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 rounded-2xl border border-amber-500/10 p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-sm">Inventory Tracking</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter the opening stock currently available in your shop.
                      "At Price" is your effective purchase cost for this stock.
                      This will be used to calculate your initial inventory
                      valuation.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-amber-500/10">
                      <span className="text-xs font-medium text-muted-foreground">
                        Valuation:
                      </span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(
                          Number(form.stock) * Number(form.openingStockPrice),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex flex-row items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-muted-foreground font-semibold"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                className="bg-primary hover:bg-primary/90 min-w-[120px] shadow-lg shadow-primary/20 font-bold"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editProduct ? "Update Item" : "Create Item"}
              </Button>
            </div>
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
