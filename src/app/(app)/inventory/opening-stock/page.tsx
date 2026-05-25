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
import { useThemeStore } from "@/store/themeStore";
import { PageHeader } from "@/components/shared/PageHeader";
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
  const { sidebarCollapsed } = useThemeStore();

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
  const [globalTaxType, setGlobalTaxType] = useState<"without" | "with">("without");

  const handleGlobalTaxTypeChange = (value: "without" | "with") => {
    setGlobalTaxType(value);
    setItems((prev) =>
      prev.map((item) => {
        const updated = { ...item, purchaseTaxType: value };
        updated.total = calcItemTotal(updated);
        return updated;
      })
    );
  };
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

      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          activeEl.getAttribute("role") === "combobox" ||
          activeEl.hasAttribute("contenteditable")
        ) {
          if (["F1", "F2", "F3", "F9", "F12"].includes(e.key)) {
            return;
          }
        }
      }
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
    if (validItems.some((i) => i.purchaseRate < 0 || i.salesPrice < 0 || i.taxRate < 0)) {
      toast.error("Price and tax values cannot be negative"); return;
    }

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

  return (
    <div className="bg-slate-50/50 pb-32 relative">
      {/* Top Header */}
      <div className="mb-4">
        <PageHeader
          title="Opening Stock Entry"
          description="Record opening stock of inventory"
          icon={Boxes}
        />
      </div>

      {/* Top Details Section */}
      <div className="flex justify-end mb-4">
        <div className="bg-card px-4 py-2 rounded-xl border border-border/80 shadow-sm flex items-center gap-3">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Stock Date <span className="text-destructive">*</span></Label>
          <Input
            type="date"
            value={openingStockDate}
            onChange={(e) => setOpeningStockDate(e.target.value)}
            className="h-8 w-40 text-xs bg-card border border-border/80 shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 cursor-pointer font-semibold"
          />
        </div>
      </div>

      {/* Middle Section: Items Table */}
      <div className="bg-card rounded-xl border border-border/80 shadow-sm mb-4 overflow-visible">
        <div>
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground text-center bg-muted/40 border-b border-border/80">
                <th className="w-[3%] py-2 border-r border-border/30">#</th>
                <th className="w-[10%] py-2 text-left px-3 border-r border-border/30">BARCODE</th>
                <th className="w-[28%] py-2 text-left px-3 border-r border-border/30">ITEM / PRODUCT NAME</th>
                <th className="w-[5%] py-2 border-r border-border/30">QTY</th>
                <th className="w-[7%] py-2 border-r border-border/30">UNIT</th>
                <th className="w-[13%] py-2 px-2 border-r border-border/30">
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-black">PURCHASE PRICE</span>
                    <div className="flex items-center gap-1">
                      <Select value={globalTaxType} onValueChange={(v: "without" | "with") => handleGlobalTaxTypeChange(v)}>
                        <SelectTrigger className="h-5 px-1.5 py-0 bg-background/80 hover:bg-background border border-border/80 rounded text-[9px] font-bold text-foreground cursor-pointer justify-center gap-1 [&>svg]:h-3 [&>svg]:w-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-[100px]">
                          <SelectItem value="without" className="text-[10px] font-semibold">Without Tax</SelectItem>
                          <SelectItem value="with" className="text-[10px] font-semibold">With Tax</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative group flex items-center">
                        <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground cursor-help hover:bg-primary/10 hover:text-primary transition-all">?</span>
                        <div className="absolute -translate-x-1/2 top-0 mb-2 bg-popover border border-border text-popover-foreground text-[10px] rounded p-2.5 shadow-xl w-64 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 leading-relaxed text-left font-normal normal-case">
                          <p className="font-bold border-b pb-1 mb-1 text-[9px] uppercase tracking-wider text-foreground">Price Type Helper</p>
                          <p className="mb-1"><strong className="text-primary font-bold">Without Tax:</strong> Tax will be added separately on top of purchase price.</p>
                          <p><strong className="text-primary font-bold">With Tax:</strong> Tax is already included in the entered price.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th className="w-[12%] py-2 px-2 border-r border-border/30">SALE PRICE</th>
                <th className="w-[7%] py-2 border-r border-border/30">TAX %</th>
                <th className="w-[12%] py-2 text-right px-3 border-r border-border/30">VALUATION</th>
                <th className="w-[3%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/10 transition-colors text-center h-9 border-b border-border/40 relative",
                    activeSearchIdx === idx ? "z-30" : "z-0"
                  )}
                >
                  <td className="py-1 border-r border-border/15 font-bold text-[10px] text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15 relative">
                    <TableCellInput
                      id={`scan-input-${idx}`}
                      ref={(el) => { barcodeRefs.current[item.id] = el; }}
                      value={item.product ? item.product.barcode || item.product.sku : item.productSearch}
                      onChange={(e) => handleProductSearch(idx, e.target.value)}
                      onFocus={() => setActiveSearchIdx(idx)}
                      onKeyDown={(e) => { handleKeyDown(e, idx); handleCustomTab(e, item.id, "barcode", idx); }}
                      placeholder="Scan/Search"
                      className={cn(
                        "h-8 text-left font-mono text-[11px] bg-muted/10 border border-border/40 rounded-lg px-2.5 transition-all w-full focus:bg-background focus:border-primary/45 focus:ring-1 focus:ring-primary/20 focus:shadow-sm",
                        item.productSearch && !item.product ? "border-amber-500/30 text-amber-500 bg-amber-500/5 focus:border-amber-500/50 focus:ring-amber-500/20" : ""
                      )}
                    />
                    {activeSearchIdx === idx && item.productSearch.length > 0 && (
                      <div className="absolute z-50 left-1 w-72 top-full mt-1.5 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[180px] overflow-y-auto flex flex-col animate-in fade-in duration-100">
                        {productResults.length === 0 ? (
                          <div className="p-3 text-[10px] text-center text-muted-foreground font-medium">Type to create a new product</div>
                        ) : (
                          productResults.map((p, pIdx) => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => selectProduct(idx, p)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-1.5 text-left border-b border-border/10 last:border-0 transition-colors",
                                selectedDropdownIdx === pIdx ? "bg-primary/10 font-bold" : "hover:bg-muted/40"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold truncate">{p.name}</p>
                                <p className="text-[9px] font-mono text-muted-foreground">{p.sku} {p.barcode ? `• ${p.barcode}` : ""}</p>
                              </div>
                              <Badge variant="secondary" className="text-[9px] shrink-0 font-bold">{p.stock} in stock</Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15 text-left">
                    {item.product ? (
                      <span className="text-xs font-semibold px-2 block truncate w-full" title={item.product.name}>
                        {item.product.name}
                      </span>
                    ) : (
                      <TableCellInput
                        ref={(el) => { nameRefs.current[item.id] = el; }}
                        value={item.newProductName || ""}
                        onChange={(e) => updateItem(idx, "newProductName", e.target.value)}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "name", idx)}
                        placeholder="New product name..."
                        className="h-8 text-left text-xs font-semibold bg-amber-500/5 border border-amber-500/20 text-amber-500 placeholder:text-amber-500/40 rounded-lg px-2.5 w-full focus:bg-background focus:border-amber-500/45 focus:ring-1 focus:ring-amber-500/20 focus:shadow-sm"
                      />
                    )}
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <TableCellInput
                      ref={(el) => { qtyRefs.current[item.id] = el; }}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                      onKeyDown={(e) => handleCustomTab(e, item.id, "quantity", idx)}
                      className="h-8 text-center text-xs font-bold bg-muted/10 border border-border/40 rounded-lg px-1.5 focus:bg-background focus:border-primary/45 focus:ring-1 focus:ring-primary/20 focus:shadow-sm transition-all w-full"
                    />
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <Select value={item.unit} onValueChange={(v) => updateItem(idx, "unit", v)}>
                      <SelectTrigger className="h-8 w-full px-2 bg-muted/10 hover:bg-muted/20 border border-border/40 focus:ring-0 focus:ring-offset-0 rounded-lg text-xs font-semibold text-foreground cursor-pointer transition-all">
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
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <div className="flex items-center h-8 rounded-lg border border-border/40 bg-muted/10 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/45 focus-within:bg-background transition-all px-2 gap-1 w-full focus-within:shadow-sm">
                      <TableCellInput
                        ref={(el) => { purchaseRateRefs.current[item.id] = el; }}
                        type="number"
                        min={0}
                        value={item.purchaseRate || ""}
                        onChange={(e) => updateItem(idx, "purchaseRate", +e.target.value)}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "purchaseRate", idx)}
                        className="text-right text-xs font-semibold bg-transparent border-none p-0 h-6 focus:ring-0 w-full min-w-0"
                      />
                      <Select value={item.purchaseTaxType} onValueChange={(v) => updateItem(idx, "purchaseTaxType", v)}>
                        <SelectTrigger className="w-[32px] shrink-0 h-5 px-0.5 py-0 bg-muted/30 hover:bg-muted/50 border-transparent focus:ring-0 focus:ring-offset-0 rounded text-[8px] font-black uppercase text-muted-foreground cursor-pointer transition-colors [&>svg]:hidden justify-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" className="min-w-[65px]">
                          <SelectItem value="without" className="text-[10px] font-bold">EXC</SelectItem>
                          <SelectItem value="with" className="text-[10px] font-bold">INC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <div className="flex items-center h-8 rounded-lg border border-border/40 bg-muted/10 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/45 focus-within:bg-background transition-all px-2 gap-1 w-full focus-within:shadow-sm">
                      <TableCellInput
                        ref={(el) => { salesPriceRefs.current[item.id] = el; }}
                        type="number"
                        min={0}
                        value={item.salesPrice || ""}
                        onChange={(e) => updateItem(idx, "salesPrice", +e.target.value)}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "salesPrice", idx)}
                        className="text-right text-xs font-semibold bg-transparent border-none p-0 h-6 focus:ring-0 w-full min-w-0"
                      />
                      <Select value={item.salesTaxType} onValueChange={(v) => updateItem(idx, "salesTaxType", v)}>
                        <SelectTrigger className="w-[32px] shrink-0 h-5 px-0.5 py-0 bg-muted/30 hover:bg-muted/50 border-transparent focus:ring-0 focus:ring-offset-0 rounded text-[8px] font-black uppercase text-muted-foreground cursor-pointer transition-colors [&>svg]:hidden justify-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" className="min-w-[65px]">
                          <SelectItem value="without" className="text-[10px] font-bold">EXC</SelectItem>
                          <SelectItem value="with" className="text-[10px] font-bold">INC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <Select value={item.taxRate.toString()} onValueChange={(v) => updateItem(idx, "taxRate", +v)}>
                      <SelectTrigger className="h-8 w-full px-2 bg-muted/10 hover:bg-muted/20 border border-border/40 focus:ring-0 focus:ring-offset-0 rounded-lg text-xs font-bold text-muted-foreground cursor-pointer transition-all">
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
                  <td className="py-1 px-3 border-r border-border/15 text-right font-black text-xs text-foreground tabular-nums">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-0.5 px-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={items.length <= 1}
                      className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-0 disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Empty filler row */}
              <tr className="h-10 border-b border-border/10">
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
        <div className="p-2 border-t bg-muted/5 flex items-center justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="h-8 text-xs font-bold gap-1.5 px-4 rounded-lg hover:bg-muted transition-all border border-border/80 text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </Button>
        </div>
      </div>

      {/* Bottom Section: Summary Totals Aligned on the Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 items-start">
        <div className="md:col-span-1 lg:col-span-2"></div> {/* Left Side Empty */}
        
        {/* Column 3: Summary Totals */}
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-1 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Stock Summary</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Products Count</span>
                <span className="text-foreground font-bold">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Total Quantity</span>
                <span className="tabular-nums text-foreground font-bold">{totalQuantity}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Net Valuation</span>
                <span className="tabular-nums text-foreground font-bold">{formatCurrency(totalValuation)}</span>
              </div>
              {totalTax > 0 && (
                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                  <span>Tax Amount</span>
                  <span className="tabular-nums text-foreground font-bold">{formatCurrency(totalTax)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 space-y-2 mt-2">
            <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
              <span className="text-xs font-black uppercase text-foreground">Total Valuation</span>
              <span className="text-lg font-black text-primary tabular-nums">{formatCurrency(totalValuation + totalTax)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className={cn(
        "fixed bottom-0 right-0 h-16 bg-card border-t border-border/80 shadow-lg px-6 py-3 flex items-center justify-between z-40 transition-all duration-300",
        sidebarCollapsed ? "left-0 lg:left-[72px]" : "left-0 lg:left-[256px]"
      )}>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={saving}
            className="h-9 text-xs font-bold gap-2 hover:bg-muted transition-all border border-border/80 text-foreground"
          >
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Primary Save Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="h-9 text-xs font-bold shadow-md shadow-primary/20 px-6 min-w-[100px] gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Stock
              </>
            )}
          </Button>
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
