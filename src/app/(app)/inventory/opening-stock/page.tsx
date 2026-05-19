"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  Package,
  Boxes,
  PlusCircle,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Subcategory } from "@/types";

// ---------- Item Row Type ----------
interface ItemRow {
  id: string;
  product: Product | null;
  productSearch: string;
  sku: string;
  barcode: string;
  newProductName?: string;
  quantity: number;
  purchaseRate: number;
  purchaseTaxType: "with" | "without";
  salesPrice: number;
  salesTaxType: "with" | "without";
  taxRate: number;
  unit: "piece" | "kg" | "liter" | "meter" | "box" | "dozen";
  total: number;
}

const newItem = (): ItemRow => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: crypto.randomUUID(),
    product: null,
    productSearch: "",
    sku: `SKU-${randomSuffix}`,
    barcode: "",
    newProductName: "",
    quantity: 1,
    purchaseRate: 0,
    purchaseTaxType: "without",
    salesPrice: 0,
    salesTaxType: "without",
    taxRate: 0,
    unit: "piece",
    total: 0,
  };
};

const calcItemTotal = (item: ItemRow) => {
  const taxMultiplier = 1 + item.taxRate / 100;
  const baseRate =
    item.purchaseTaxType === "with"
      ? item.purchaseRate / taxMultiplier
      : item.purchaseRate;
  return item.quantity * baseRate;
};

export default function OpeningStockPage() {
  const router = useRouter();

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [selectedDropdownIdx, setSelectedDropdownIdx] = useState<number>(-1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // New Product Modal state
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProductIdx, setNewProductIdx] = useState<number | null>(null);
  const [newProductSaving, setNewProductSaving] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    description: "",
    barcode: "",
    sku: "",
    category: "",
    subcategoryId: "",
    hsnCode: "",
    unit: "piece",
    stock: "0",
    lowStockThreshold: "10",
    images: [] as string[],
    purchasePrice: "0",
    salesPrice: "0",
    taxRate: "0",
  });

  // Page State
  const [openingStockDate, setOpeningStockDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [saving, setSaving] = useState(false);

  // Fetch initial master data
  useEffect(() => {
    productService
      .getAll({ limit: 1000 })
      .then((r) => setProducts(r.data))
      .catch(() => {});
    categoryService
      .getAll()
      .then((r) => setCategories(r))
      .catch(() => {});
    subcategoryService
      .getAll()
      .then((r) => setSubcategories(r))
      .catch(() => {});
  }, []);

  // Reset dropdown highlighting
  useEffect(() => {
    setSelectedDropdownIdx(-1);
  }, [productResults, activeSearchIdx]);

  // Product Search within Row
  const handleProductSearch = (idx: number, query: string) => {
    const updated = [...items];
    updated[idx].productSearch = query;
    updated[idx].product = null;
    updated[idx].barcode = query;
    // Retain existing auto-generated SKU, or generate a new one if cleared
    if (!updated[idx].sku || updated[idx].sku.trim() === "") {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      updated[idx].sku = `SKU-${randomSuffix}`;
    }
    setItems(updated);
    setActiveSearchIdx(idx);

    if (query.trim().length === 0) {
      setProductResults([]);
      return;
    }

    const q = query.toLowerCase();

    // Auto-select exact matching Barcode/SKU
    const exactMatch = products.find(
      (p) => p.barcode?.toLowerCase() === q || p.sku.toLowerCase() === q
    );
    if (exactMatch) {
      selectProduct(idx, exactMatch);
      return;
    }

    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
    setProductResults(results.slice(0, 8));
  };

  // Keyboard navigation inside dropdown matches
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (productResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedDropdownIdx((prev) => {
        const next = prev + 1;
        return next >= productResults.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedDropdownIdx((prev) => {
        const next = prev - 1;
        return next < 0 ? productResults.length - 1 : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedDropdownIdx >= 0 &&
        selectedDropdownIdx < productResults.length
      ) {
        selectProduct(idx, productResults[selectedDropdownIdx]);
      } else if (productResults.length > 0) {
        selectProduct(idx, productResults[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveSearchIdx(null);
      setProductResults([]);
    }
  };

  // Select Product
  const selectProduct = (idx: number, product: Product) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      product,
      productSearch: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      purchaseRate: (product as any).purchasePrice || 0,
      purchaseTaxType: "without",
      salesPrice: (product as any).salesPrice || 0,
      salesTaxType: "without",
      taxRate: (product as any).taxRate || 0,
      unit: product.unit || "piece",
      total: 0,
    };
    updated[idx].total = calcItemTotal(updated[idx]);

    // Automatically append new row if last row
    if (idx === updated.length - 1) {
      updated.push(newItem());
      setTimeout(() => {
        const nextInput = document.getElementById(`scan-input-${idx + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 50);
    }

    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);
  };

  // Add / Remove table rows
  const addRow = () => {
    setItems([...items, newItem()]);
  };

  const removeRow = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated.length === 0 ? [newItem()] : updated);
  };

  const updateItem = (
    idx: number,
    field: keyof ItemRow,
    value: number | string
  ) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
  };

  // Add New Product Submission from modal
  const handleAddNewProductSubmit = async () => {
    if (newProductIdx === null) return;
    if (
      !newProductForm.name ||
      !newProductForm.category ||
      !newProductForm.sku ||
      !newProductForm.stock ||
      !newProductForm.purchasePrice ||
      !newProductForm.salesPrice
    ) {
      toast.error("Please fill Name, Category, SKU, Opening Stock, Purchase, and Sales prices.");
      return;
    }

    try {
      setNewProductSaving(true);
      const payload: Partial<Product> = {
        name: newProductForm.name,
        description: newProductForm.description,
        sku: newProductForm.sku,
        barcode: newProductForm.barcode,
        category: newProductForm.category,
        subcategoryId: newProductForm.subcategoryId || undefined,
        hsnCode: newProductForm.hsnCode,
        stock: Number(newProductForm.stock) || 0,
        lowStockThreshold: Number(newProductForm.lowStockThreshold) || 10,
        unit: newProductForm.unit as any,
        images: newProductForm.images,
        image: newProductForm.images.length > 0 ? newProductForm.images[0] : undefined,
        purchasePrice: Number(newProductForm.purchasePrice) || 0,
        salesPrice: Number(newProductForm.salesPrice) || 0,
        taxRate: Number(newProductForm.taxRate) || 0,
        openingStockPrice: Number(newProductForm.purchasePrice) || 0,
        openingStockDate: openingStockDate,
      };

      const savedProduct = await productService.create(payload);
      setProducts((prev) => [...prev, savedProduct]);

      // Populate current row
      const updated = [...items];
      updated[newProductIdx] = {
        id: updated[newProductIdx].id,
        product: savedProduct,
        productSearch: savedProduct.name,
        sku: savedProduct.sku || "",
        barcode: savedProduct.barcode || "",
        quantity: Number(newProductForm.stock) || 1,
        purchaseRate: Number(newProductForm.purchasePrice) || 0,
        purchaseTaxType: "without",
        salesPrice: Number(newProductForm.salesPrice) || 0,
        salesTaxType: "without",
        taxRate: Number(newProductForm.taxRate) || 0,
        unit: savedProduct.unit || "piece",
        total: 0,
      };
      updated[newProductIdx].total = calcItemTotal(updated[newProductIdx]);

      // Append new row if last
      if (newProductIdx === updated.length - 1) {
        updated.push(newItem());
        setTimeout(() => {
          const nextInput = document.getElementById(`scan-input-${newProductIdx + 1}`);
          if (nextInput) nextInput.focus();
        }, 50);
      }

      setItems(updated);
      setNewProductModalOpen(false);
      setNewProductForm({
        name: "",
        description: "",
        barcode: "",
        sku: "",
        category: "",
        subcategoryId: "",
        hsnCode: "",
        unit: "piece",
        stock: "0",
        lowStockThreshold: "10",
        images: [],
        purchasePrice: "0",
        salesPrice: "0",
        taxRate: "0",
      });
      setProductResults([]);
      setActiveSearchIdx(null);
      toast.success("Product created successfully and added to row.");
    } catch {
      toast.error("Failed to create product.");
    } finally {
      setNewProductSaving(false);
    }
  };

  // Submit and save stock entries
  const handleSubmit = async () => {
    // Filter out completely empty rows
    const filledRows = items.filter(
      (item) =>
        item.product ||
        (item.productSearch.trim().length > 0 &&
          item.newProductName &&
          item.newProductName.trim().length > 0)
    );

    if (filledRows.length === 0) {
      toast.error(
        "Please select at least one valid product or type a new product name."
      );
      return;
    }

    // Validate categories exist if we are creating new products inline
    const hasNewProducts = filledRows.some((item) => !item.product);
    if (hasNewProducts && categories.length === 0) {
      toast.error(
        "Please create at least one category in the system before adding new products."
      );
      return;
    }

    try {
      setSaving(true);
      const defaultCategoryId = categories[0]?._id;

      // Run updates in parallel
      await Promise.all(
        filledRows.map(async (item) => {
          // Calculate base purchase price without tax if entered "with" tax
          const taxMultiplier = 1 + item.taxRate / 100;
          const purchasePrice =
            item.purchaseTaxType === "with"
              ? item.purchaseRate / taxMultiplier
              : item.purchaseRate;

          // Calculate base sales price without tax if entered "with" tax
          const salesPrice =
            item.salesTaxType === "with"
              ? item.salesPrice / taxMultiplier
              : item.salesPrice;

          if (item.product) {
            // Existing product - add scanned quantity to current stock
            const newStock = (item.product.stock || 0) + item.quantity;
            return productService.update(item.product._id, {
              stock: newStock,
              purchasePrice: purchasePrice,
              salesPrice: salesPrice,
              taxRate: item.taxRate,
              unit: item.unit,
              openingStockPrice: purchasePrice,
              openingStockDate: openingStockDate,
            });
          } else {
            // New inline product - create it with initial stock and pricing
            const finalBarcode = item.barcode.trim();
            const finalSku =
              item.sku.trim() ||
              finalBarcode ||
              `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

            return productService.create({
              name: item.newProductName!.trim(),
              sku: finalSku,
              barcode: finalBarcode,
              category: defaultCategoryId,
              stock: item.quantity,
              purchasePrice: purchasePrice,
              salesPrice: salesPrice,
              taxRate: item.taxRate,
              unit: item.unit,
              openingStockPrice: purchasePrice,
              openingStockDate: openingStockDate,
            });
          }
        })
      );

      toast.success("Opening stock entries saved successfully!");
      router.push("/inventory");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save entries. Verify all fields are valid.");
    } finally {
      setSaving(false);
    }
  };

  // Summary aggregates
  const totalQuantity = items.reduce(
    (sum, item) =>
      sum +
      (item.product ||
      (item.productSearch.trim().length > 0 &&
        item.newProductName &&
        item.newProductName.trim().length > 0)
        ? item.quantity
        : 0),
    0
  );
  const totalValuation = items.reduce(
    (sum, item) =>
      sum +
      (item.product ||
      (item.productSearch.trim().length > 0 &&
        item.newProductName &&
        item.newProductName.trim().length > 0)
        ? item.total
        : 0),
    0
  );

  return (
    <div className="lg:h-[calc(100vh-5.5rem)] flex flex-col space-y-4 overflow-y-auto lg:overflow-hidden h-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-card border px-4 py-3 rounded-xl shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-muted/80 rounded-lg"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary animate-pulse" />
              Opening Stock Entry
            </h1>
            <p className="text-xs text-muted-foreground">
              Scan products, update quantities, cost parameters, and load new stock batches.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0">
        {/* Left Side: Product Entry Table */}
        <div className="lg:col-span-2 flex flex-col lg:h-full lg:min-h-0 h-auto lg:overflow-hidden space-y-2">
          <Card className="flex-1 lg:min-h-0 flex flex-col lg:overflow-hidden border border-border/60 h-auto lg:h-full">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 shrink-0 border-b">
              <CardTitle className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
                Scanned Products List
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={addRow}
                className="gap-1 h-8 px-3 rounded-lg border-primary/30 hover:bg-primary/5 text-primary text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="w-full min-w-[1380px]">
                  <thead>
                    <tr className="border-b bg-muted/20 sticky top-0 z-10">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-12">#</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-48">Barcode</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-36">SKU / Item Code</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground min-w-[200px]">Product Name</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-28">Unit</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-20">Stock Qty</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-64">Purchase Price</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-64">Sales Price</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-24">Tax</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground w-28">Total (₹)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {items.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-b border-border/30 hover:bg-muted/5 transition-colors"
                        >
                          <td className="p-2 text-xs font-mono text-muted-foreground">{idx + 1}</td>

                          {/* Barcode Search Dropdown */}
                          <td className="p-2 relative">
                            <div className="relative">
                              <Input
                                id={`scan-input-${idx}`}
                                value={item.product ? (item.product.barcode || item.product.sku) : item.productSearch}
                                onChange={(e) => handleProductSearch(idx, e.target.value)}
                                onFocus={() => setActiveSearchIdx(idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                placeholder="Scan Barcode..."
                                className={`h-9 text-xs font-mono px-3 rounded-lg bg-background ${
                                  item.productSearch && !item.product
                                    ? "border-amber-500/50 bg-amber-500/5 font-bold"
                                    : item.product
                                    ? "border-emerald-500/50 bg-emerald-500/5 font-bold"
                                    : ""
                                }`}
                              />
                            </div>

                            {/* Dropdown list */}
                            {activeSearchIdx === idx && item.productSearch.length > 0 && (
                              <div className="absolute z-50 left-0 w-[420px] top-full mt-1 bg-card border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                                {productResults.length === 0 ? (
                                  <div className="p-3 text-center flex flex-col items-center justify-center gap-1.5">
                                    <span className="text-xs font-semibold text-amber-500">New Product Detected</span>
                                    <span className="text-[10px] text-muted-foreground text-center">
                                      This item is not in the system yet. Type its name in the <strong>Product Name</strong> column next to this to create it inline!
                                    </span>
                                  </div>
                                ) : (
                                  productResults.map((p, pIdx) => (
                                    <button
                                      key={p._id}
                                      type="button"
                                      onClick={() => selectProduct(idx, p)}
                                      className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors text-xs ${
                                        selectedDropdownIdx === pIdx
                                          ? "bg-primary/10 text-primary font-semibold"
                                          : "hover:bg-muted/50"
                                      }`}
                                    >
                                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                                        {p.image ? (
                                          <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                        ) : (
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                          SKU: {p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ""}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <Badge variant="secondary" className="text-[10px] rounded-full">
                                          {p.stock} in stock
                                        </Badge>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </td>

                          {/* SKU / Item Code */}
                          <td className="p-2">
                            <Input
                              value={item.sku}
                              onChange={(e) => updateItem(idx, "sku", e.target.value)}
                              placeholder="SKU"
                              className="h-9 px-2 text-xs text-center rounded-lg bg-background font-mono"
                            />
                          </td>

                          {/* Product Name Column */}
                          <td className="p-2">
                            <Input
                              value={item.product ? item.product.name : (item.newProductName || "")}
                              onChange={(e) => updateItem(idx, "newProductName", e.target.value)}
                              readOnly={!!item.product}
                              placeholder={item.product ? "Product Name" : "Type new product name..."}
                              className={`h-9 text-xs rounded-lg ${
                                item.product
                                  ? "bg-muted/20 border-transparent text-muted-foreground focus-visible:ring-0"
                                  : "bg-background border-amber-500/40 text-foreground focus-visible:ring-amber-500 font-semibold"
                              }`}
                            />
                          </td>

                          {/* Unit Selection */}
                          <td className="p-2">
                            <select
                              value={item.unit}
                              onChange={(e) => updateItem(idx, "unit", e.target.value as any)}
                              className="h-9 px-2 text-xs text-center rounded-lg bg-background border focus-visible:ring-1 w-full font-semibold outline-none"
                            >
                              <option value="piece">Piece (Pcs)</option>
                              <option value="box">Box</option>
                              <option value="kg">Kilogram (Kg)</option>
                              <option value="liter">Liter (L)</option>
                              <option value="meter">Meter (m)</option>
                              <option value="dozen">Dozen</option>
                            </select>
                          </td>

                          {/* Quantity */}
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                              className="h-9 px-2 text-xs text-center rounded-lg bg-background"
                            />
                          </td>

                          {/* Purchase Price (Price + Tax Type) */}
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={item.purchaseRate}
                                onChange={(e) => updateItem(idx, "purchaseRate", +e.target.value)}
                                className="h-9 px-2 text-xs text-center rounded-lg bg-background flex-1"
                              />
                              <select
                                value={item.purchaseTaxType}
                                onChange={(e) => updateItem(idx, "purchaseTaxType", e.target.value as any)}
                                className="h-9 px-1 text-[11px] font-semibold bg-background border rounded-lg focus-visible:ring-1 shrink-0 w-28 outline-none"
                              >
                                <option value="without">Without Tax</option>
                                <option value="with">With Tax</option>
                              </select>
                            </div>
                          </td>

                          {/* Sales Price (Price + Tax Type) */}
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={item.salesPrice}
                                onChange={(e) => updateItem(idx, "salesPrice", +e.target.value)}
                                className="h-9 px-2 text-xs text-center rounded-lg bg-background flex-1"
                              />
                              <select
                                value={item.salesTaxType}
                                onChange={(e) => updateItem(idx, "salesTaxType", e.target.value as any)}
                                className="h-9 px-1 text-[11px] font-semibold bg-background border rounded-lg focus-visible:ring-1 shrink-0 w-28 outline-none"
                              >
                                <option value="without">Without Tax</option>
                                <option value="with">With Tax</option>
                              </select>
                            </div>
                          </td>

                          {/* Tax Rate % */}
                          <td className="p-2">
                            <select
                              value={item.taxRate}
                              onChange={(e) => updateItem(idx, "taxRate", +e.target.value)}
                              className="h-9 px-2 text-xs text-center rounded-lg bg-background border focus-visible:ring-1 w-20 font-semibold outline-none"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>

                          {/* Item Total */}
                          <td className="p-2 text-right font-semibold text-xs font-mono">
                            {formatCurrency(item.total)}
                          </td>

                          {/* Trash button */}
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(idx)}
                              disabled={items.length <= 1}
                              className="text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Aggregate Summary */}
        <div className="flex flex-col space-y-4 lg:h-full lg:overflow-y-auto h-auto overflow-visible">


          {/* Aggregates valuations */}
          <Card className="bg-primary/5 border border-primary/20">
            <CardHeader className="py-3 px-4 border-b border-primary/10">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-primary">
                Opening Valuation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="flex justify-between text-xs border-b pb-2 border-primary/10">
                <span className="text-muted-foreground">Unique Items</span>
                <span className="font-bold">{items.filter((i) => i.product).length}</span>
              </div>
              <div className="flex justify-between text-xs border-b pb-2 border-primary/10">
                <span className="text-muted-foreground">Total Quantities</span>
                <span className="font-bold">{totalQuantity}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 font-bold">
                <span className="text-foreground">Opening Valuation</span>
                <span className="text-primary font-mono text-base">{formatCurrency(totalValuation)}</span>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full h-10 text-xs font-semibold shadow-lg shadow-primary/25 rounded-lg text-primary-foreground flex items-center justify-center gap-1.5"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileCheck2 className="h-4 w-4" /> Save Opening Stocks
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Product Modal — matches requirements with Compulsory Fields */}
      <Dialog open={newProductModalOpen} onOpenChange={setNewProductModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" /> Create New Product
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill all required fields below to create a new product and map to stock entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            {/* Images */}
            <div className="space-y-1">
              <Label className="text-xs">Product Images</Label>
              <ImageUploader
                multiple
                value={newProductForm.images}
                onChange={(urls) =>
                  setNewProductForm({
                    ...newProductForm,
                    images: urls as string[],
                  })
                }
                folder="products"
                maxFiles={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Product name (Compulsory)"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={newProductForm.description}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select
                  value={newProductForm.category}
                  onValueChange={(v) =>
                    setNewProductForm({
                      ...newProductForm,
                      category: v,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id} className="text-xs">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subcategory</Label>
                <Select
                  value={newProductForm.subcategoryId}
                  onValueChange={(v) =>
                    setNewProductForm({ ...newProductForm, subcategoryId: v })
                  }
                  disabled={!newProductForm.category}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories
                      .filter((s) => {
                        const pId =
                          typeof s.parentCategoryId === "string"
                            ? s.parentCategoryId
                            : (s.parentCategoryId as any)._id;
                        return pId === newProductForm.category;
                      })
                      .map((sub) => (
                        <SelectItem key={sub._id} value={sub._id} className="text-xs">
                          {sub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">SKU *</Label>
                <Input
                  value={newProductForm.sku}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SKU Code"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Barcode</Label>
                <Input
                  value={newProductForm.barcode}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      barcode: e.target.value,
                    })
                  }
                  placeholder="Barcode scan"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Select
                  value={newProductForm.unit}
                  onValueChange={(v) =>
                    setNewProductForm({ ...newProductForm, unit: v })
                  }
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["piece", "kg", "liter", "meter", "box", "dozen"].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Opening Stock *</Label>
                <Input
                  type="number"
                  value={newProductForm.stock}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      stock: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="h-9 text-xs rounded-lg bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Purchase Price *</Label>
                <Input
                  type="number"
                  value={newProductForm.purchasePrice}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      purchasePrice: e.target.value,
                    })
                  }
                  placeholder="₹ Cost"
                  className="h-9 text-xs rounded-lg bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sales Price *</Label>
                <Input
                  type="number"
                  value={newProductForm.salesPrice}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      salesPrice: e.target.value,
                    })
                  }
                  placeholder="₹ Retail"
                  className="h-9 text-xs rounded-lg bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tax Rate (%) *</Label>
                <Input
                  type="number"
                  value={newProductForm.taxRate}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      taxRate: e.target.value,
                    })
                  }
                  placeholder="0%"
                  className="h-9 text-xs rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">HSN Code</Label>
                <Input
                  value={newProductForm.hsnCode}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      hsnCode: e.target.value,
                    })
                  }
                  placeholder="HSN"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Low Stock Alert Threshold</Label>
                <Input
                  type="number"
                  value={newProductForm.lowStockThreshold}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      lowStockThreshold: e.target.value,
                    })
                  }
                  placeholder="10"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-3">
            <Button
              variant="outline"
              onClick={() => setNewProductModalOpen(false)}
              className="h-9 rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewProductSubmit}
              disabled={newProductSaving}
              className="h-9 px-4 rounded-lg text-xs"
            >
              {newProductSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create & Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
