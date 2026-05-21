"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  Search,
  Package,
  X,
  ChevronDown,
  FileCheck2,
  ChevronUp,
  LayoutList,
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
import { formatCurrency, cn } from "@/lib/utils";
import type { Product, Category, Subcategory } from "@/types";

//  Inline table cell input (same as purchase page) 
const TableCellInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-transparent border-none outline-none ring-0 shadow-none px-1 py-1 text-center font-bold tabular-nums",
      "focus:outline-none focus:ring-0 focus:border-none focus-visible:ring-0 focus-visible:outline-none",
      className
    )}
    {...props}
  />
));
TableCellInput.displayName = "TableCellInput";

//  Item Row 
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
  _autoCalculated?: number;
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

//  Page Component 
export default function OpeningStockPage() {
  const router = useRouter();

  // Cell focus refs
  const barcodeRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const skuRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const purchaseRateRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const salesPriceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lastMatchedRef = useRef<{ barcode: string; time: number } | null>(null);

  // Mobile summary panel toggle
  const [summaryOpen, setSummaryOpen] = useState(false);

  const focusCell = (
    itemId: string,
    field: "barcode" | "sku" | "name" | "quantity" | "purchaseRate" | "salesPrice"
  ) => {
    setTimeout(() => {
      let input: HTMLInputElement | null = null;
      if (field === "barcode") input = barcodeRefs.current[itemId];
      else if (field === "sku") input = skuRefs.current[itemId];
      else if (field === "name") input = nameRefs.current[itemId];
      else if (field === "quantity") input = qtyRefs.current[itemId];
      else if (field === "purchaseRate") input = purchaseRateRefs.current[itemId];
      else if (field === "salesPrice") input = salesPriceRefs.current[itemId];
      if (input) { input.focus(); input.select(); }
    }, 50);
  };

  const handleCustomTab = (
    e: React.KeyboardEvent,
    itemId: string,
    currentField: "barcode" | "sku" | "name" | "quantity" | "purchaseRate" | "salesPrice",
    idx: number
  ) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const hasNameField = !items[idx].product;
    const prevItem = items[idx - 1];
    const nextItem = items[idx + 1];

    if (!e.shiftKey) {
      if (currentField === "barcode") focusCell(itemId, "sku");
      else if (currentField === "sku") focusCell(itemId, hasNameField ? "name" : "quantity");
      else if (currentField === "name") focusCell(itemId, "quantity");
      else if (currentField === "quantity") focusCell(itemId, "purchaseRate");
      else if (currentField === "purchaseRate") focusCell(itemId, "salesPrice");
      else if (currentField === "salesPrice") { if (nextItem) focusCell(nextItem.id, "barcode"); }
    } else {
      if (currentField === "barcode") { if (prevItem) focusCell(prevItem.id, "salesPrice"); }
      else if (currentField === "sku") focusCell(itemId, "barcode");
      else if (currentField === "name") focusCell(itemId, "sku");
      else if (currentField === "quantity") focusCell(itemId, hasNameField ? "name" : "sku");
      else if (currentField === "purchaseRate") focusCell(itemId, "quantity");
      else if (currentField === "salesPrice") focusCell(itemId, "purchaseRate");
    }
  };

  // Master data
  const [products, setProducts] = useState<Product[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [selectedDropdownIdx, setSelectedDropdownIdx] = useState<number>(-1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // New Product Modal
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

  // Page-level fields
  const [openingStockDate, setOpeningStockDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productService.getAll({ limit: 1000 }).then((r) => setProducts(r.data)).catch(() => {});
    categoryService.getAll().then((r) => setCategories(r)).catch(() => {});
    subcategoryService.getAll().then((r) => setSubcategories(r)).catch(() => {});
  }, []);

  useEffect(() => { setSelectedDropdownIdx(-1); }, [productResults, activeSearchIdx]);

  //  Auto-calculate salesPrice from purchaseRate (mirrors purchase page) 
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (!item.product && !item.newProductName) return item;
        const taxMultiplier = 1 + item.taxRate / 100;
        const baseRate =
          item.purchaseTaxType === "with"
            ? item.purchaseRate / taxMultiplier
            : item.purchaseRate;
        const taxAmt = baseRate * (item.taxRate / 100);
        const newSalesPrice = Number((baseRate + taxAmt).toFixed(2));
        if (
          item.salesPrice !== newSalesPrice &&
          (item.salesPrice === 0 || item._autoCalculated === item.salesPrice)
        ) {
          changed = true;
          return { ...item, salesPrice: newSalesPrice, _autoCalculated: newSalesPrice };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [items.map((i) => `${i.id}:${i.purchaseRate}:${i.taxRate}:${i.purchaseTaxType}`).join(",")]);

  //  Product search 
  const handleProductSearch = (idx: number, query: string) => {
    const updated = [...items];
    updated[idx].productSearch = query;
    updated[idx].product = null;
    updated[idx].barcode = query;
    if (!updated[idx].sku || updated[idx].sku.trim() === "") {
      updated[idx].sku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    setItems(updated);
    setActiveSearchIdx(idx);
    if (query.trim().length === 0) { setProductResults([]); return; }

    const q = query.trim().toLowerCase();
    const exactMatch = products.find(
      (p) => p.barcode?.trim().toLowerCase() === q || p.sku.trim().toLowerCase() === q
    );
    if (exactMatch) {
      const now = Date.now();
      const key = exactMatch.barcode || exactMatch.sku;
      if (lastMatchedRef.current?.barcode === key && now - lastMatchedRef.current.time < 800) return;
      lastMatchedRef.current = { barcode: key, time: now };
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "ArrowDown") {
      if (!productResults.length) return;
      e.preventDefault();
      setSelectedDropdownIdx((p) => { const n = p + 1; return n >= productResults.length ? 0 : n; });
    } else if (e.key === "ArrowUp") {
      if (!productResults.length) return;
      e.preventDefault();
      setSelectedDropdownIdx((p) => { const n = p - 1; return n < 0 ? productResults.length - 1 : n; });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = items[idx].productSearch.trim().toLowerCase();
      if (q) {
        const exact = products.find(
          (p) => p.barcode?.trim().toLowerCase() === q || p.sku.trim().toLowerCase() === q
        );
        if (exact) {
          const now = Date.now();
          const key = exact.barcode || exact.sku;
          if (lastMatchedRef.current?.barcode === key && now - lastMatchedRef.current.time < 800) return;
          lastMatchedRef.current = { barcode: key, time: now };
          selectProduct(idx, exact);
          return;
        }
      }
      if (productResults.length > 0) {
        selectProduct(idx, productResults[selectedDropdownIdx >= 0 ? selectedDropdownIdx : 0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveSearchIdx(null);
      setProductResults([]);
    }
  };

  const selectProduct = (idx: number, product: Product) => {
    // Duplicate barcode scan  increment existing row
    const existingIdx = items.findIndex((item, i) => {
      if (i === idx) return false;
      if (item.product?._id === product._id) return true;
      if (item.barcode && product.barcode && item.barcode.trim().toLowerCase() === product.barcode.trim().toLowerCase()) return true;
      if (item.sku && product.sku && item.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()) return true;
      return false;
    });

    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 };
      updated[existingIdx].total = calcItemTotal(updated[existingIdx]);
      if (!items[idx].product) {
        updated[idx] = { ...updated[idx], productSearch: "", barcode: "", product: null };
      }
      setItems(updated);
      setProductResults([]);
      setActiveSearchIdx(null);
      setScanHistory((prev) => [...prev, updated[existingIdx].id]);
      focusCell(updated[idx].id, "barcode");
      toast.success(`${product.name} qty increased to ${updated[existingIdx].quantity}`);
      return;
    }

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
    if (idx === updated.length - 1) updated.push(newItem());
    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);
    setScanHistory((prev) => [...prev, updated[idx].id]);
    focusCell(updated[idx].id, "quantity");
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: number | string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
  };

  const addRow = () => {
    const ni = newItem();
    setItems((prev) => [...prev, ni]);
    setTimeout(() => focusCell(ni.id, "barcode"), 80);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    const removedId = items[idx].id;
    setItems(items.filter((_, i) => i !== idx));
    setScanHistory((prev) => prev.filter((id) => id !== removedId));
  };

  const isRowFilled = (item: ItemRow) =>
    item.product !== null ||
    item.productSearch.trim() !== "" ||
    item.barcode.trim() !== "" ||
    (item.newProductName !== undefined && item.newProductName.trim() !== "");

  //  Keyboard shortcuts 
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (newProductModalOpen) return;
      switch (e.key) {
        case "F1": {
          e.preventDefault();
          let newHistory = [...scanHistory];
          let targetItemId: string | null = null;
          while (newHistory.length > 0) {
            const lastId = newHistory[newHistory.length - 1];
            if (items.some((i) => i.id === lastId && isRowFilled(i))) { targetItemId = lastId; break; }
            else newHistory.pop();
          }
          if (targetItemId) {
            const targetIdx = items.findIndex((i) => i.id === targetItemId);
            if (targetIdx !== -1) {
              const row = items[targetIdx];
              if (row.quantity > 1) {
                const updated = { ...row, quantity: row.quantity - 1 };
                updated.total = calcItemTotal(updated);
                toast.success(`Reduced qty of ${updated.product?.name || updated.newProductName || "item"}`);
                newHistory.pop();
                setScanHistory(newHistory);
                setItems((prev) => { const next = [...prev]; next[targetIdx] = updated; return next; });
              } else {
                toast.success("Row removed");
                newHistory.pop();
                setScanHistory(newHistory);
                setItems((prev) => prev.length <= 1 ? [newItem()] : prev.filter((_, i) => i !== targetIdx));
              }
            }
          }
          break;
        }
        case "F2": e.preventDefault(); addRow(); toast.success("New row added"); break;
        case "F3": {
          e.preventDefault();
          const last = [...items].reverse().find(isRowFilled);
          if (last) focusCell(last.id, "quantity");
          break;
        }
        case "F9": e.preventDefault(); handleSubmit(); break;
        case "F12": {
          e.preventDefault();
          const notesEl = document.querySelector<HTMLTextAreaElement>('textarea[data-field="notes"]');
          if (notesEl) notesEl.focus();
          break;
        }
        case "Escape":
          setActiveSearchIdx(null);
          setProductResults([]);
          break;
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [items, scanHistory, newProductModalOpen]);

  //  New Product Modal submit 
  const handleAddNewProductSubmit = async () => {
    if (newProductIdx === null) return;
    if (!newProductForm.name || !newProductForm.category || !newProductForm.sku) {
      toast.error("Please fill Name, Category, and SKU");
      return;
    }
    try {
      setNewProductSaving(true);
      const savedProduct = await productService.create({
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
        image: newProductForm.images[0] || undefined,
        purchasePrice: Number(newProductForm.purchasePrice) || 0,
        salesPrice: Number(newProductForm.salesPrice) || 0,
        taxRate: Number(newProductForm.taxRate) || 0,
        openingStockPrice: Number(newProductForm.purchasePrice) || 0,
        openingStockDate,
      });
      setProducts((prev) => [...prev, savedProduct]);
      const updated = [...items];
      updated[newProductIdx] = {
        ...updated[newProductIdx],
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
      setItems(updated);
      setNewProductModalOpen(false);
      setNewProductForm({ name: "", description: "", barcode: "", sku: "", category: "", subcategoryId: "", hsnCode: "", unit: "piece", stock: "0", lowStockThreshold: "10", images: [], purchasePrice: "0", salesPrice: "0", taxRate: "0" });
      setProductResults([]);
      setActiveSearchIdx(null);
      toast.success("Product created successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create product");
    } finally {
      setNewProductSaving(false);
    }
  };

  //  Submit opening stock 
  const handleSubmit = async () => {
    const validItems = items.filter(
      (i) => i.product || (i.productSearch.trim() !== "" || (i.newProductName && i.newProductName.trim() !== ""))
    );
    if (validItems.length === 0) { toast.error("Please add at least one product"); return; }
    if (validItems.some((i) => !i.product && (!i.newProductName || i.newProductName.trim() === ""))) {
      toast.error("Please enter a product name for all new items"); return;
    }
    if (validItems.some((i) => i.quantity <= 0)) { toast.error("Quantity must be > 0"); return; }

    const hasNewProducts = validItems.some((i) => !i.product);
    if (hasNewProducts && categories.length === 0) {
      toast.error("Please create at least one category before adding new products"); return;
    }

    try {
      setSaving(true);
      const defaultCategoryId = categories[0]?._id;

      await Promise.all(
        validItems.map(async (item) => {
          const taxMultiplier = 1 + item.taxRate / 100;
          const purchasePrice = item.purchaseTaxType === "with" ? item.purchaseRate / taxMultiplier : item.purchaseRate;
          const salesPrice = item.salesTaxType === "with" ? item.salesPrice / taxMultiplier : item.salesPrice;

          if (item.product) {
            return productService.update(item.product._id, {
              stock: (item.product.stock || 0) + item.quantity,
              purchasePrice,
              salesPrice,
              taxRate: item.taxRate,
              unit: item.unit,
              openingStockPrice: purchasePrice,
              openingStockDate,
            });
          } else {
            const finalBarcode = item.barcode.trim();
            const finalSku = item.sku.trim() || finalBarcode || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
            return productService.create({
              name: item.newProductName!.trim(),
              sku: finalSku,
              barcode: finalBarcode,
              category: defaultCategoryId,
              stock: item.quantity,
              purchasePrice,
              salesPrice,
              taxRate: item.taxRate,
              unit: item.unit,
              openingStockPrice: purchasePrice,
              openingStockDate,
            });
          }
        })
      );
      toast.success("Opening stock saved! Inventory updated.");
      router.push("/inventory");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save opening stock");
    } finally {
      setSaving(false);
    }
  };

  //  Summary calculations 
  const totalItems = items.filter((i) => i.product || i.newProductName).length;
  const totalQuantity = items.reduce(
    (s, i) => s + (i.product || i.newProductName ? i.quantity : 0), 0
  );
  const totalValuation = items.reduce((s, i) => s + i.total, 0);
  const totalTax = items.reduce((s, i) => {
    const taxMultiplier = 1 + i.taxRate / 100;
    const baseRate = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
    const base = i.quantity * baseRate;
    return s + (base * i.taxRate) / 100;
  }, 0);

  //  Render 
  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -m-4 bg-background overflow-hidden relative">

      {/*  Top Header / Action Bar  */}
      <div className="shrink-0 px-3 sm:px-4 py-2 border-b bg-card flex items-center justify-between z-20 shadow-sm gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Boxes className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate">Opening Stock Entry</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile summary toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-semibold lg:hidden px-2"
            onClick={() => setSummaryOpen((o) => !o)}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Summary</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 text-xs font-semibold px-2 sm:px-3"
            onClick={() => router.back()}
            disabled={saving}
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
          <Button
            size="sm"
            className="h-7 sm:h-8 text-xs font-bold shadow-lg shadow-primary/20 px-2 sm:px-3"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1" />}
            <FileCheck2 className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Save Stock</span>
          </Button>
        </div>
      </div>

      {/* Mobile Summary Drawer (collapsible) */}
      <AnimatePresence>
        {summaryOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden shrink-0 overflow-hidden border-b bg-card z-10"
          >
            <div className="px-4 py-3 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Stock Summary</h3>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Products</span>
                  <span className="text-sm font-bold">{totalItems}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Total Qty</span>
                  <span className="text-sm font-bold tabular-nums">{totalQuantity}</span>
                </div>
                {totalTax > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Tax Amount</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(totalTax)}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Valuation</span>
                  <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(totalValuation)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">

        {/*  Left: Table + Meta  */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">

          {/*  Table - horizontally scrollable on small screens  */}
          <div className="flex-1 overflow-auto bg-card relative">
            <div className="min-w-[700px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/50 backdrop-blur-md border-b-2 border-border/60 whitespace-nowrap">
                    <th className="w-[24px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">#</th>
                    <th className="w-[80px] min-w-[80px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Barcode</th>
                    <th className="w-[80px] min-w-[80px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">SKU</th>
                    <th className="w-full min-w-[100px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Product Name</th>
                    <th className="w-[40px] min-w-[40px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Unit</th>
                    <th className="w-[50px] min-w-[50px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Stock Qty</th>
                    <th className="w-[85px] min-w-[85px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Purchase Price(Rs)</th>
                    <th className="w-[85px] min-w-[85px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Sales Price(Rs)</th>
                    <th className="w-[45px] min-w-[45px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Tax%</th>
                    <th className="w-[70px] min-w-[70px] px-1 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Valuation(Rs)</th>
                    <th className="w-[24px]"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {items.map((item, idx) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "border-b border-border/10 hover:bg-muted/30 transition-colors group",
                          activeSearchIdx === idx ? "relative z-30" : "relative z-0"
                        )}
                      >
                        {/* # */}
                        <td className="px-1 py-1 text-center border-r border-border/20">
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold bg-muted/60 text-muted-foreground">{idx + 1}</span>
                        </td>

                        {/* Barcode / Search */}
                        <td className="px-1 py-0.5 border-r border-border/20 relative">
                          <TableCellInput
                            id={`scan-input-${idx}`}
                            ref={(el) => { barcodeRefs.current[item.id] = el; }}
                            value={item.product ? (item.product.barcode || item.product.sku) : item.productSearch}
                            onChange={(e) => handleProductSearch(idx, e.target.value)}
                            onFocus={() => setActiveSearchIdx(idx)}
                            onKeyDown={(e) => { handleKeyDown(e, idx); handleCustomTab(e, item.id, "barcode", idx); }}
                            placeholder="Scan..."
                            className={cn(
                              "text-left font-mono text-[11px] bg-primary/5 rounded-md px-1.5 py-0 h-5.5",
                              item.productSearch && !item.product ? "border-amber-500/50 text-amber-500" : ""
                            )}
                          />
                          {activeSearchIdx === idx && item.productSearch.length > 0 && (
                            <div className="absolute z-50 left-0 w-[min(400px,90vw)] top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                              {productResults.length === 0 ? (
                                <div className="p-3 text-[10px] text-center text-muted-foreground">Type to create a new product</div>
                              ) : (
                                productResults.map((p, pIdx) => (
                                  <button key={p._id} type="button" onClick={() => selectProduct(idx, p)}
                                    className={`flex items-center gap-2 w-full px-2 py-1.5 text-left transition-colors border-b border-border/10 last:border-0 ${selectedDropdownIdx === pIdx ? "bg-primary/10" : "hover:bg-muted/40"}`}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-semibold truncate">{p.name}</p>
                                      <p className="text-[9px] font-mono text-muted-foreground">{p.sku} {p.barcode ? ` ${p.barcode}` : ""}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[9px] shrink-0">{p.stock} in stock</Badge>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <TableCellInput
                            ref={(el) => { skuRefs.current[item.id] = el; }}
                            value={item.sku}
                            onChange={(e) => updateItem(idx, "sku", e.target.value)}
                            onKeyDown={(e) => handleCustomTab(e, item.id, "sku", idx)}
                            placeholder="SKU-XXXX"
                            className="text-[11px] font-mono px-1 py-0 h-5.5 text-center"
                          />
                        </td>

                        {/* Product Name */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          {item.product ? (
                            <span className="text-[11px] font-semibold px-1.5 block truncate w-full">{item.product.name}</span>
                          ) : (
                            <TableCellInput
                              ref={(el) => { nameRefs.current[item.id] = el; }}
                              value={item.newProductName}
                              onChange={(e) => updateItem(idx, "newProductName", e.target.value)}
                              onKeyDown={(e) => handleCustomTab(e, item.id, "name", idx)}
                              placeholder="New product name..."
                              className="text-left text-[11px] font-semibold bg-amber-500/5 border border-amber-500/30 text-amber-500 placeholder:text-amber-500/40 rounded-md px-1.5 py-0 h-5.5"
                            />
                          )}
                        </td>

                        {/* Unit */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <Select value={item.unit} onValueChange={(v) => updateItem(idx, "unit", v)}>
                            <SelectTrigger className="h-5.5 w-full px-1 py-0 bg-transparent hover:bg-muted/40 border-transparent hover:border-border/40 focus:ring-0 focus:ring-offset-0 rounded-md text-[11px] font-bold text-muted-foreground cursor-pointer transition-all [&>svg]:hidden justify-center gap-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="center" className="min-w-[80px]">
                              <SelectItem value="piece" className="text-xs font-semibold">Pcs</SelectItem>
                              <SelectItem value="box" className="text-xs font-semibold">Box</SelectItem>
                              <SelectItem value="kg" className="text-xs font-semibold">Kg</SelectItem>
                              <SelectItem value="liter" className="text-xs font-semibold">L</SelectItem>
                              <SelectItem value="meter" className="text-xs font-semibold">m</SelectItem>
                              <SelectItem value="dozen" className="text-xs font-semibold">Dz</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Stock Qty */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <TableCellInput
                            ref={(el) => { qtyRefs.current[item.id] = el; }}
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                            onKeyDown={(e) => handleCustomTab(e, item.id, "quantity", idx)}
                            className="text-[13px] font-bold px-1 py-0 h-5.5 text-center"
                          />
                        </td>

                        {/* Purchase Price */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <div className="flex items-center gap-0.5">
                            <TableCellInput
                              ref={(el) => { purchaseRateRefs.current[item.id] = el; }}
                              type="number"
                              min={0}
                              value={item.purchaseRate || ""}
                              onChange={(e) => updateItem(idx, "purchaseRate", +e.target.value)}
                              onKeyDown={(e) => handleCustomTab(e, item.id, "purchaseRate", idx)}
                              className="text-right text-[13px] font-semibold px-1 py-0 h-5.5"
                            />
                            <Select value={item.purchaseTaxType} onValueChange={(v) => updateItem(idx, "purchaseTaxType", v)}>
                              <SelectTrigger className="w-[32px] shrink-0 h-5 px-0.5 py-0 bg-muted/40 hover:bg-muted/60 border-transparent focus:ring-0 focus:ring-offset-0 rounded text-[8px] font-black uppercase text-muted-foreground cursor-pointer transition-colors [&>svg]:hidden justify-center gap-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end" className="min-w-[70px]">
                                <SelectItem value="without" className="text-[10px] font-bold">EXC</SelectItem>
                                <SelectItem value="with" className="text-[10px] font-bold">INC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>

                        {/* Sales Price */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <div className="flex items-center gap-0.5">
                            <TableCellInput
                              ref={(el) => { salesPriceRefs.current[item.id] = el; }}
                              type="number"
                              min={0}
                              value={item.salesPrice || ""}
                              onChange={(e) => updateItem(idx, "salesPrice", +e.target.value)}
                              onKeyDown={(e) => handleCustomTab(e, item.id, "salesPrice", idx)}
                              className="text-right text-[13px] font-semibold px-1 py-0 h-5.5"
                            />
                            <Select value={item.salesTaxType} onValueChange={(v) => updateItem(idx, "salesTaxType", v)}>
                              <SelectTrigger className="w-[32px] shrink-0 h-5 px-0.5 py-0 bg-muted/40 hover:bg-muted/60 border-transparent focus:ring-0 focus:ring-offset-0 rounded text-[8px] font-black uppercase text-muted-foreground cursor-pointer transition-colors [&>svg]:hidden justify-center gap-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end" className="min-w-[70px]">
                                <SelectItem value="without" className="text-[10px] font-bold">EXC</SelectItem>
                                <SelectItem value="with" className="text-[10px] font-bold">INC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>

                        {/* Tax% */}
                        <td className="px-1 py-0.5 border-r border-border/20">
                          <Select value={item.taxRate.toString()} onValueChange={(v) => updateItem(idx, "taxRate", +v)}>
                            <SelectTrigger className="h-5.5 w-full px-1 py-0 bg-transparent hover:bg-muted/40 border-transparent hover:border-border/40 focus:ring-0 focus:ring-offset-0 rounded-md text-[11px] font-bold text-muted-foreground cursor-pointer transition-all [&>svg]:hidden justify-center gap-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="center" className="min-w-[70px]">
                              <SelectItem value="0" className="text-xs font-bold">0%</SelectItem>
                              <SelectItem value="5" className="text-xs font-bold">5%</SelectItem>
                              <SelectItem value="12" className="text-xs font-bold">12%</SelectItem>
                              <SelectItem value="18" className="text-xs font-bold">18%</SelectItem>
                              <SelectItem value="28" className="text-xs font-bold">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Valuation Total */}
                        <td className="px-1.5 py-1 text-right border-r border-border/20">
                          <span className="text-[12px] font-black tabular-nums tracking-tight">{formatCurrency(item.total)}</span>
                        </td>

                        {/* Delete */}
                        <td className="px-0.5 py-0.5 text-center">
                          <button onClick={() => removeRow(idx)} disabled={items.length <= 1}
                            className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-0 disabled:pointer-events-none">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>

                  {/* Empty filler row */}
                  <tr className="h-[40px] border-b border-border/10">
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td className="border-r border-border/10"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="shrink-0 p-2 border-t bg-muted/10 flex justify-center z-10">
            <Button variant="outline" size="sm" onClick={addRow}
              className="h-7 text-xs font-semibold gap-1 px-4 rounded-full border-dashed border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>
        </div>

        {/*  Right: Summary Panel — hidden on mobile/tablet, visible on lg+  */}
        <div className="hidden lg:flex w-[240px] shrink-0 border-l flex-col bg-card z-20">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Stock Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Stock Summary</h3>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Products</span>
                  <span className="font-bold">{totalItems}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Total Qty</span>
                  <span className="tabular-nums font-bold">{totalQuantity}</span>
                </div>
                {totalTax > 0 && (
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Tax Amount</span>
                    <span className="tabular-nums font-bold">{formatCurrency(totalTax)}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-3 flex justify-between text-base font-black">
                  <span>Valuation</span>
                  <span className="text-primary tabular-nums tracking-tight">{formatCurrency(totalValuation)}</span>
                </div>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Shortcuts</h3>
              <div className="bg-muted/20 rounded-lg p-2.5 space-y-1.5 border border-border/30">
                {[
                  ["F1", "Undo last scan"],
                  ["F2", "Add new row"],
                  ["F3", "Focus last qty"],
                  ["F9", "Save stock"],
                  ["F12", "Focus notes"],
                  ["Tab", "Next field"],
                  ["Esc", "Close dropdown"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <kbd className="text-[9px] font-black bg-card border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground shadow-sm">{key}</kbd>
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  New Product Modal  */}
      <Dialog open={newProductModalOpen} onOpenChange={setNewProductModalOpen}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-auto sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the product details to create it and add to opening stock.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-6 py-4">
            <div className="space-y-2">
              <Label>Product Images</Label>
              <ImageUploader
                multiple
                value={newProductForm.images}
                onChange={(urls) => setNewProductForm({ ...newProductForm, images: urls as string[] })}
                folder="products"
                maxFiles={10}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newProductForm.description} onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })} placeholder="Brief description" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-3 sm:p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newProductForm.category} onValueChange={(v) => setNewProductForm({ ...newProductForm, category: v, subcategoryId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={newProductForm.subcategoryId} onValueChange={(v) => setNewProductForm({ ...newProductForm, subcategoryId: v })} disabled={!newProductForm.category}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.filter((s) => { const pId = typeof s.parentCategoryId === "string" ? s.parentCategoryId : (s.parentCategoryId as any)._id; return pId === newProductForm.category; }).map((sub) => <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={newProductForm.sku} onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value.toUpperCase() })} placeholder="SKU-001" />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input value={newProductForm.hsnCode} onChange={(e) => setNewProductForm({ ...newProductForm, hsnCode: e.target.value })} placeholder="HSN" />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input value={newProductForm.barcode} onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })} placeholder="Barcode" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Opening Stock *</Label>
                <Input type="number" value={newProductForm.stock} onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={newProductForm.lowStockThreshold} onChange={(e) => setNewProductForm({ ...newProductForm, lowStockThreshold: e.target.value })} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price *</Label>
                <Input type="number" value={newProductForm.purchasePrice} onChange={(e) => setNewProductForm({ ...newProductForm, purchasePrice: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Sales Price *</Label>
                <Input type="number" value={newProductForm.salesPrice} onChange={(e) => setNewProductForm({ ...newProductForm, salesPrice: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate %</Label>
                <Select value={newProductForm.taxRate} onValueChange={(v) => setNewProductForm({ ...newProductForm, taxRate: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["0", "5", "12", "18", "28"].map((t) => <SelectItem key={t} value={t}>{t}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={newProductForm.unit} onValueChange={(v) => setNewProductForm({ ...newProductForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["piece", "kg", "liter", "meter", "box", "dozen"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewProductModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleAddNewProductSubmit} disabled={newProductSaving} className="min-w-24 w-full sm:w-auto">
              {newProductSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}