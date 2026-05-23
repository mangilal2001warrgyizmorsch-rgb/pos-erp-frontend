"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  Search,
  Package,
  X,
  ChevronDown,
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
import { supplierService } from "@/services/supplierService";
import { transporterService } from "@/services/transporterService";
import { productService } from "@/services/productService";
import { purchaseService } from "@/services/purchaseService";
import { cashBankService } from "@/services/cashBankService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { SupplierModal } from "@/components/shared/SupplierModal";
import { formatCurrency, cn } from "@/lib/utils";
import type {
  Supplier,
  Transporter,
  Product,
  Category,
  Subcategory,
} from "@/types";

const TableCellInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-transparent border-none outline-none ring-0 shadow-none px-1 py-1 text-center font-bold tabular-nums",
        "focus:outline-none focus:ring-0 focus:border-none focus-visible:ring-0 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
});
TableCellInput.displayName = "TableCellInput";

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
  discount: number;
  taxRate: number;
  unit: "piece" | "kg" | "liter" | "meter" | "box" | "dozen";
  total: number;
  isNewProduct?: boolean;
  newProductData?: any;
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
    discount: 0,
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

  const base = item.quantity * baseRate;
  const discAmt = (base * item.discount) / 100;
  const afterDisc = base - discAmt;
  const taxAmt = (afterDisc * item.taxRate) / 100;
  return afterDisc + taxAmt;
};

// ---------- Component ----------
export default function CreatePurchasePage() {
  const router = useRouter();

  // Focus refs for each editable field in a row
  const barcodeRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const skuRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const purchaseRateRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const salesPriceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const discountRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Ref to prevent double scans / race conditions on fast inputs
  const lastMatchedRef = useRef<{ barcode: string; time: number } | null>(null);

  // Mobile summary panel toggle
  const [summaryOpen, setSummaryOpen] = useState(false);

  const focusCell = (itemId: string, field: "barcode" | "sku" | "name" | "quantity" | "purchaseRate" | "salesPrice" | "discount") => {
    setTimeout(() => {
      let input: HTMLInputElement | null = null;
      if (field === "barcode") input = barcodeRefs.current[itemId];
      else if (field === "sku") input = skuRefs.current[itemId];
      else if (field === "name") input = nameRefs.current[itemId];
      else if (field === "quantity") input = qtyRefs.current[itemId];
      else if (field === "purchaseRate") input = purchaseRateRefs.current[itemId];
      else if (field === "salesPrice") input = salesPriceRefs.current[itemId];
      else if (field === "discount") input = discountRefs.current[itemId];

      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const handleCustomTab = (
    e: React.KeyboardEvent,
    itemId: string,
    currentField: "barcode" | "sku" | "name" | "quantity" | "purchaseRate" | "salesPrice" | "discount",
    idx: number
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const prevItem = items[idx - 1];
      const nextItem = items[idx + 1];
      const hasNameField = !items[idx].product;

      if (!e.shiftKey) {
        if (currentField === "barcode") {
          focusCell(itemId, "sku");
        } else if (currentField === "sku") {
          if (hasNameField) {
            focusCell(itemId, "name");
          } else {
            focusCell(itemId, "quantity");
          }
        } else if (currentField === "name") {
          focusCell(itemId, "quantity");
        } else if (currentField === "quantity") {
          focusCell(itemId, "purchaseRate");
        } else if (currentField === "purchaseRate") {
          focusCell(itemId, "salesPrice");
        } else if (currentField === "salesPrice") {
          focusCell(itemId, "discount");
        } else if (currentField === "discount") {
          if (nextItem) {
            focusCell(nextItem.id, "barcode");
          }
        }
      } else {
        if (currentField === "barcode") {
          if (prevItem) {
            focusCell(prevItem.id, "discount");
          }
        } else if (currentField === "sku") {
          focusCell(itemId, "barcode");
        } else if (currentField === "name") {
          focusCell(itemId, "sku");
        } else if (currentField === "quantity") {
          if (hasNameField) {
            focusCell(itemId, "name");
          } else {
            focusCell(itemId, "sku");
          }
        } else if (currentField === "purchaseRate") {
          focusCell(itemId, "quantity");
        } else if (currentField === "salesPrice") {
          focusCell(itemId, "purchaseRate");
        } else if (currentField === "discount") {
          focusCell(itemId, "salesPrice");
        }
      }
    }
  };

  // Master data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
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
  });

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierGst, setSupplierGst] = useState("");
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [isSupplierMatched, setIsSupplierMatched] = useState(false);
  const [selectedSupplierDropdownIdx, setSelectedSupplierDropdownIdx] = useState(-1);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const supplierWrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to close supplier dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        supplierWrapperRef.current &&
        !supplierWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSupplierSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const clearSupplier = () => {
    setSupplierId("");
    setSupplierSearch("");
    setSupplierPhone("");
    setSupplierGst("");
    setIsSupplierMatched(false);
  };

  const reloadSuppliers = async () => {
    try {
      const res = await supplierService.getAll({ limit: 200 });
      const newSuppliers = res.data.filter((s: Supplier) => !suppliers.some(prev => prev._id === s._id));
      setSuppliers(res.data);
      if (newSuppliers.length > 0) {
        selectSupplier(newSuppliers[0]);
      }
    } catch (e) {}
  };

  const [transporterId, setTransporterId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [shippingCharges, setShippingCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supplierService.getAll({ limit: 200 }).then((r) => setSuppliers(r.data)).catch(() => {});
    transporterService.getAll({ limit: 200 }).then((r) => setTransporters(r.data)).catch(() => {});
    productService.getAll({ limit: 500 }).then((r) => setProducts(r.data)).catch(() => {});
    categoryService.getAll().then((r) => setCategories(r)).catch(() => {});
    subcategoryService.getAll().then((r) => setSubcategories(r)).catch(() => {});
    cashBankService.getAccounts().then((res) => {
      if (res.success && res.data) {
        setBankAccounts(res.data.filter((a: any) => a.accountType === "bank" && a.status === "active"));
      }
    }).catch((err) => console.error("Failed to load bank accounts:", err));
  }, []);

  useEffect(() => {
    setSelectedDropdownIdx(-1);
  }, [productResults, activeSearchIdx]);

  const handlePaymentMethodChange = (val: string) => {
    setPaymentMethod(val);
    if (val !== "cash") {
      const defaultBank = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
      if (defaultBank && !cashBankAccountId) {
        setCashBankAccountId(defaultBank._id);
      }
    } else {
      setCashBankAccountId("");
    }
  };

  const filteredSuppliers = supplierSearch.trim()
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
          (s.phone && s.phone.includes(supplierSearch))
      )
    : suppliers;

  const handleSupplierSearch = (query: string) => {
    setSupplierSearch(query);
    setSelectedSupplierDropdownIdx(-1);

    if (query.trim() === "") {
      setSupplierId("");
      setSupplierPhone("");
      setSupplierGst("");
      setIsSupplierMatched(false);
      setShowSupplierSuggestions(true);
      return;
    }

    const exact = suppliers.find(
      (s) => s.name.toLowerCase() === query.trim().toLowerCase()
    );

    if (exact) {
      setSupplierId(exact._id);
      setSupplierPhone(exact.phone);
      setSupplierGst(exact.gstNumber || "");
      setIsSupplierMatched(true);
      setShowSupplierSuggestions(false);
    } else {
      setSupplierId("");
      setIsSupplierMatched(false);
      setShowSupplierSuggestions(true);
    }
  };

  const selectSupplier = (s: Supplier) => {
    setSupplierId(s._id);
    setSupplierSearch(s.name);
    setSupplierPhone(s.phone);
    setSupplierGst(s.gstNumber || "");
    setIsSupplierMatched(true);
    setShowSupplierSuggestions(false);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = filteredSuppliers.slice(0, 10);
    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSupplierDropdownIdx((prev) => {
        const next = prev + 1;
        return next >= filtered.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSupplierDropdownIdx((prev) => {
        const next = prev - 1;
        return next < 0 ? filtered.length - 1 : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSupplierDropdownIdx >= 0 && selectedSupplierDropdownIdx < filtered.length) {
        selectSupplier(filtered[selectedSupplierDropdownIdx]);
      } else if (filtered.length > 0) {
        selectSupplier(filtered[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSupplierSuggestions(false);
    }
  };

  const handleProductSearch = (idx: number, query: string) => {
    const updated = [...items];
    updated[idx].productSearch = query;
    updated[idx].product = null;
    updated[idx].barcode = query;
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

    const q = query.trim().toLowerCase();

    const exactMatch = products.find(
      (p) => p.barcode?.trim().toLowerCase() === q || p.sku.trim().toLowerCase() === q,
    );

    if (exactMatch) {
      const now = Date.now();
      const matchKey = exactMatch.barcode || exactMatch.sku;
      if (
        lastMatchedRef.current &&
        lastMatchedRef.current.barcode === matchKey &&
        now - lastMatchedRef.current.time < 800
      ) {
        return;
      }
      lastMatchedRef.current = { barcode: matchKey, time: now };
      selectProduct(idx, exactMatch);
      return;
    }

    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    );
    setProductResults(results.slice(0, 8));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "ArrowDown") {
      if (productResults.length === 0) return;
      e.preventDefault();
      setSelectedDropdownIdx((prev) => {
        const next = prev + 1;
        return next >= productResults.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      if (productResults.length === 0) return;
      e.preventDefault();
      setSelectedDropdownIdx((prev) => {
        const next = prev - 1;
        return next < 0 ? productResults.length - 1 : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const query = items[idx].productSearch.trim().toLowerCase();
      if (query) {
        const exactMatch = products.find(
          (p) => p.barcode?.trim().toLowerCase() === query || p.sku.trim().toLowerCase() === query,
        );
        if (exactMatch) {
          const now = Date.now();
          const matchKey = exactMatch.barcode || exactMatch.sku;
          if (
            lastMatchedRef.current &&
            lastMatchedRef.current.barcode === matchKey &&
            now - lastMatchedRef.current.time < 800
          ) {
            return;
          }
          lastMatchedRef.current = { barcode: matchKey, time: now };
          selectProduct(idx, exactMatch);
          return;
        }
      }
      if (productResults.length > 0) {
        if (selectedDropdownIdx >= 0 && selectedDropdownIdx < productResults.length) {
          selectProduct(idx, productResults[selectedDropdownIdx]);
        } else {
          selectProduct(idx, productResults[0]);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveSearchIdx(null);
      setProductResults([]);
    }
  };

  const selectProduct = (idx: number, product: Product) => {
    const existingIdx = items.findIndex((item, i) => {
      if (i === idx) return false;
      if (item.product && product && item.product._id === product._id) return true;
      if (item.barcode && product.barcode && item.barcode.trim() !== "" && item.barcode.trim().toLowerCase() === product.barcode.trim().toLowerCase()) return true;
      if (item.sku && product.sku && item.sku.trim() !== "" && item.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()) return true;
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
      isNewProduct: false,
      newProductData: undefined,
    };
    updated[idx].total = calcItemTotal(updated[idx]);
    if (idx === updated.length - 1) updated.push(newItem());
    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);
    setScanHistory((prev) => [...prev, updated[idx].id]);
    focusCell(updated[idx].id, "quantity");
  };

  const handleAddNewProductSubmit = async () => {
    if (newProductIdx === null) return;
    if (!newProductForm.name || !newProductForm.category || !newProductForm.sku) {
      toast.error("Please fill Name, Category, and SKU");
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
      };
      const savedProduct = await productService.create(payload);
      setProducts((prev) => [...prev, savedProduct]);
      const updated = [...items];
      updated[newProductIdx] = {
        ...updated[newProductIdx],
        product: savedProduct,
        productSearch: savedProduct.name,
        sku: savedProduct.sku || "",
        barcode: savedProduct.barcode || "",
        purchaseRate: 0,
        purchaseTaxType: "without",
        salesPrice: 0,
        salesTaxType: "without",
        taxRate: 0,
        total: 0,
        isNewProduct: false,
        newProductData: undefined,
      };
      setItems(updated);
      setNewProductModalOpen(false);
      setNewProductForm({ name: "", description: "", barcode: "", sku: "", category: "", subcategoryId: "", hsnCode: "", unit: "piece", stock: "0", lowStockThreshold: "10", images: [] });
      setProductResults([]);
      setActiveSearchIdx(null);
      toast.success("Product created successfully!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create product");
    } finally {
      setNewProductSaving(false);
    }
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: number | string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
  };

  const addRow = () => {
    const ni = newItem();
    setItems(prev => [...prev, ni]);
    setTimeout(() => focusCell(ni.id, "barcode"), 80);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    const removedId = items[idx].id;
    setItems(items.filter((_, i) => i !== idx));
    setScanHistory(prev => prev.filter(id => id !== removedId));
  };

  const isRowFilled = (item: ItemRow) => {
    return (
      item.product !== null ||
      item.productSearch.trim() !== "" ||
      item.barcode.trim() !== "" ||
      (item.newProductName !== undefined && item.newProductName.trim() !== "")
    );
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (newProductModalOpen || supplierModalOpen) return;

      switch (e.key) {
        case "F1": {
          e.preventDefault();
          let targetItemId: string | null = null;
          let newHistory = [...scanHistory];
          while (newHistory.length > 0) {
            const lastId = newHistory[newHistory.length - 1];
            const itemExists = items.some(i => i.id === lastId && isRowFilled(i));
            if (itemExists) { targetItemId = lastId; break; }
            else newHistory.pop();
          }
          if (targetItemId) {
            const targetIdx = items.findIndex(i => i.id === targetItemId);
            if (targetIdx !== -1) {
              const targetRow = items[targetIdx];
              if (targetRow.quantity > 1) {
                const updatedRow = { ...targetRow, quantity: targetRow.quantity - 1 };
                updatedRow.total = calcItemTotal(updatedRow);
                toast.success(`Reduced qty of ${updatedRow.product?.name || updatedRow.newProductName || "item"}`);
                newHistory.pop();
                setScanHistory(newHistory);
                setItems(prev => { const next = [...prev]; next[targetIdx] = updatedRow; return next; });
              } else {
                toast.success("Row removed");
                newHistory.pop();
                setScanHistory(newHistory);
                setItems(prev => prev.length <= 1 ? [newItem()] : prev.filter((_, i) => i !== targetIdx));
              }
            }
          } else {
            const lastFilledIdxReversed = [...items].reverse().findIndex(isRowFilled);
            if (lastFilledIdxReversed !== -1) {
              const lastFilledIdx = items.length - 1 - lastFilledIdxReversed;
              const lastFilledRow = items[lastFilledIdx];
              if (lastFilledRow.quantity > 1) {
                const updatedRow = { ...lastFilledRow, quantity: lastFilledRow.quantity - 1 };
                updatedRow.total = calcItemTotal(updatedRow);
                toast.success(`Reduced qty of ${updatedRow.product?.name || updatedRow.newProductName || "item"}`);
                setItems(prev => { const next = [...prev]; next[lastFilledIdx] = updatedRow; return next; });
              } else {
                toast.success("Row removed");
                setItems(prev => prev.length <= 1 ? [newItem()] : prev.filter((_, i) => i !== lastFilledIdx));
              }
            } else {
              setItems(prev => { if (prev.length > 1) { toast.success("Row removed"); return prev.slice(0, -1); } return prev; });
            }
          }
          break;
        }
        case "F2": e.preventDefault(); addRow(); toast.success("New row added"); break;
        case "F3": {
          e.preventDefault();
          const lastFilled = [...items].reverse().find(isRowFilled);
          if (lastFilled) focusCell(lastFilled.id, "quantity");
          break;
        }
        case "F5": {
          e.preventDefault();
          const lastDisc = [...items].reverse().find(isRowFilled);
          if (lastDisc) focusCell(lastDisc.id, "discount");
          break;
        }
        case "F8": {
          e.preventDefault();
          const shippingInput = document.querySelector<HTMLInputElement>('input[data-field="shipping"]');
          if (shippingInput) { shippingInput.focus(); shippingInput.select(); }
          break;
        }
        case "F9": e.preventDefault(); handleSubmit("confirmed"); break;
        case "F12": {
          e.preventDefault();
          const notesEl = document.querySelector<HTMLTextAreaElement>('textarea[data-field="notes"]');
          if (notesEl) notesEl.focus();
          break;
        }
        case "Escape": {
          setActiveSearchIdx(null);
          setProductResults([]);
          setShowSupplierSuggestions(false);
          break;
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [items, scanHistory, newProductModalOpen, supplierModalOpen]);

  useEffect(() => {
    const totalQty = items.reduce((s, item) => s + (item.product || item.isNewProduct ? item.quantity : 0), 0);
    const perItemShipping = totalQty > 0 ? shippingCharges / totalQty : 0;

    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (!item.product && !item.isNewProduct) return item;
        const base = item.purchaseRate;
        const discAmt = (base * item.discount) / 100;
        const afterDisc = base - discAmt;
        const taxAmt = (afterDisc * item.taxRate) / 100;
        const newSalesPrice = Number((afterDisc + taxAmt + perItemShipping).toFixed(2));
        if (item.salesPrice !== newSalesPrice && (item.salesPrice === 0 || item._autoCalculated === item.salesPrice)) {
          changed = true;
          return { ...item, salesPrice: newSalesPrice, _autoCalculated: newSalesPrice };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [items, shippingCharges]);

  const subtotal = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate = item.purchaseTaxType === "with" ? item.purchaseRate / taxMultiplier : item.purchaseRate;
    const base = item.quantity * baseRate;
    const discAmt = (base * item.discount) / 100;
    return s + (base - discAmt);
  }, 0);

  const totalTax = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate = item.purchaseTaxType === "with" ? item.purchaseRate / taxMultiplier : item.purchaseRate;
    const base = item.quantity * baseRate;
    const discAmt = (base * item.discount) / 100;
    const afterDisc = base - discAmt;
    return s + (afterDisc * item.taxRate) / 100;
  }, 0);

  const totalDiscount = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate = item.purchaseTaxType === "with" ? item.purchaseRate / taxMultiplier : item.purchaseRate;
    const base = item.quantity * baseRate;
    return s + (base * item.discount) / 100;
  }, 0);

  const grandTotal = subtotal + totalTax + shippingCharges;

  const handleSubmit = async (status: "confirmed" | "draft") => {
    let finalSupplierId = supplierId;
    let finalSupplierName = "";

    if (!finalSupplierId) {
      if (!supplierSearch.trim()) { toast.error("Please enter a supplier name"); return; }
      if (!supplierPhone.trim()) { toast.error("Please enter a mobile number for the unmatched supplier"); return; }
    }

    const validItems = items.filter(
      (i) => i.product || (i.productSearch.trim() !== "" || (i.newProductName && i.newProductName.trim() !== "")),
    );
    if (validItems.length === 0) { toast.error("Please add at least one product"); return; }
    if (validItems.some((i) => !i.product && (!i.newProductName || i.newProductName.trim() === ""))) {
      toast.error("Please enter a product name for all new items"); return;
    }
    if (validItems.some((i) => i.quantity <= 0)) { toast.error("Quantity must be > 0"); return; }
    if (validItems.some((i) => i.purchaseRate < 0 || i.salesPrice < 0 || i.discount < 0 || i.taxRate < 0)) {
      toast.error("Price, discount, and tax values cannot be negative"); return;
    }
    if (status === "confirmed" && paymentMethod !== "cash" && !cashBankAccountId) {
      toast.error("Please select a bank account for non-cash payment"); return;
    }
    if (validItems.some((i) => !i.product) && categories.length === 0) {
      toast.error("Please create at least one category before adding new products"); return;
    }

    try {
      setSaving(true);

      if (!finalSupplierId) {
        const newSupplier = await supplierService.create({
          name: supplierSearch.trim(),
          phone: supplierPhone.trim(),
          gstNumber: supplierGst.trim() || undefined,
        });
        finalSupplierId = newSupplier._id;
        finalSupplierName = newSupplier.name;
        setSuppliers((prev) => [...prev, newSupplier]);
      } else {
        const matched = suppliers.find((s) => s._id === finalSupplierId);
        finalSupplierName = matched?.name || "";
      }

      const defaultCategoryId = categories[0]?._id;

      const resolvedItems = await Promise.all(
        validItems.map(async (item) => {
          if (item.product) return item;

          const taxMultiplier = 1 + item.taxRate / 100;
          const purchasePrice = item.purchaseTaxType === "with" ? item.purchaseRate / taxMultiplier : item.purchaseRate;
          const salesPrice = item.salesTaxType === "with" ? item.salesPrice / taxMultiplier : item.salesPrice;
          const finalBarcode = item.barcode.trim();
          const finalSku = item.sku.trim() || finalBarcode || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

          const savedProduct = await productService.create({
            name: item.newProductName!.trim(),
            sku: finalSku,
            barcode: finalBarcode,
            category: defaultCategoryId,
            stock: 0,
            purchasePrice,
            salesPrice,
            taxRate: item.taxRate,
            unit: item.unit || "piece",
          });
          setProducts((prev) => [...prev, savedProduct]);
          return { ...item, product: savedProduct };
        })
      );

      const payload = {
        supplier: finalSupplierId,
        supplierName: finalSupplierName,
        transporter: transporterId && transporterId !== "none" ? transporterId : undefined,
        transporterName: transporterId && transporterId !== "none" ? transporters.find((t) => t._id === transporterId)?.name : undefined,
        invoiceNumber,
        purchaseDate,
        items: resolvedItems.map((i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
          const salesPrice = i.salesTaxType === "with" ? i.salesPrice / taxMultiplier : i.salesPrice;
          const finalSubtotal = i.quantity * purchasePrice;
          const discountAmt = (finalSubtotal * i.discount) / 100;
          const finalAfterDisc = finalSubtotal - discountAmt;
          const taxAmt = (finalAfterDisc * i.taxRate) / 100;
          return {
            product: i.product!._id,
            name: i.product!.name,
            sku: i.product!.sku,
            quantity: i.quantity,
            purchasePrice,
            salesPrice,
            discount: i.discount,
            discountAmount: discountAmt,
            taxRate: i.taxRate,
            taxAmount: taxAmt,
            total: finalAfterDisc + taxAmt,
          };
        }),
        subtotal: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
          return s + i.quantity * purchasePrice;
        }, 0),
        taxAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
          const base = i.quantity * purchasePrice;
          const disc = (base * i.discount) / 100;
          return s + ((base - disc) * i.taxRate) / 100;
        }, 0),
        discountAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
          const base = i.quantity * purchasePrice;
          return s + (base * i.discount) / 100;
        }, 0),
        totalAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice = i.purchaseTaxType === "with" ? i.purchaseRate / taxMultiplier : i.purchaseRate;
          const base = i.quantity * purchasePrice;
          const disc = (base * i.discount) / 100;
          const tax = ((base - disc) * i.taxRate) / 100;
          return s + (base - disc + tax);
        }, 0) + shippingCharges,
        amountPaid: status === "confirmed" ? grandTotal : 0,
        dueAmount: status === "confirmed" ? 0 : grandTotal,
        status,
        paymentStatus: status === "confirmed" ? "paid" : "pending",
        paymentMethod: status === "confirmed" ? paymentMethod : undefined,
        cashBankAccountId: status === "confirmed" && paymentMethod !== "cash" ? cashBankAccountId : undefined,
        notes,
      };

      payload.amountPaid = status === "confirmed" ? payload.totalAmount : 0;
      payload.dueAmount = status === "confirmed" ? 0 : payload.totalAmount;

      if (status === "draft") {
        await purchaseService.saveDraft(payload);
        toast.success("Draft saved!");
      } else {
        await purchaseService.create(payload);
        toast.success("Purchase created! Stock updated automatically.");
      }
      router.push("/purchases");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -m-4 bg-background overflow-hidden relative">

      {/* Top Header / Action Bar */}
      <div className="shrink-0 px-3 sm:px-4 py-2 border-b bg-card flex items-center justify-between z-20 shadow-sm gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate">Create Purchase Bill</h1>
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
            onClick={() => handleSubmit("draft")}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          <Button
            size="sm"
            className="h-7 sm:h-8 text-xs font-bold shadow-lg shadow-primary/20 px-2 sm:px-3"
            onClick={() => handleSubmit("confirmed")}
            disabled={saving}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1" />}
            <span className="hidden sm:inline">Submit Purchase</span>
            <span className="sm:hidden">Submit</span>
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
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Bill Summary</h3>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Items</span>
                  <span className="text-sm font-bold">{items.filter(i => i.product || i.newProductName).length}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Subtotal</span>
                  <span className="text-sm font-bold tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-emerald-500 font-medium">Discount</span>
                    <span className="text-sm font-bold tabular-nums text-emerald-500">- {formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                  <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              {/* Shipping inline on mobile */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Shipping</span>
                <Input
                  type="number"
                  min={0}
                  value={shippingCharges || ""}
                  onChange={(e) => setShippingCharges(+e.target.value)}
                  placeholder="0"
                  className="w-[100px] h-7 px-2 text-right tabular-nums font-bold bg-background text-xs"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Side: Forms & Table */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">

          {/* Supplier & Details Compact Grid */}
          <div className="shrink-0 p-2 sm:p-3 bg-muted/10 border-b grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 z-30 relative">
            {/* Supplier - full width on mobile */}
            <div className="col-span-2 sm:col-span-3 md:col-span-2 space-y-1 relative" ref={supplierWrapperRef}>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier *</Label>
              <div className="relative flex items-center">
                <Input
                  value={supplierSearch}
                  onChange={(e) => {
                    handleSupplierSearch(e.target.value);
                    setShowSupplierSuggestions(true);
                  }}
                  onFocus={() => setShowSupplierSuggestions(true)}
                  onKeyDown={handleSupplierKeyDown}
                  placeholder="Search/Add Supplier..."
                  className={cn(
                    "h-7 text-xs font-semibold pr-8 bg-card transition-all placeholder:text-muted-foreground/60",
                    isSupplierMatched
                      ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 font-bold"
                      : supplierSearch.trim() !== ""
                      ? "border-amber-500/55 bg-amber-500/5 text-amber-600 font-semibold"
                      : ""
                  )}
                />
                {isSupplierMatched ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSupplier();
                      setShowSupplierSuggestions(true);
                    }}
                    className="absolute right-2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                )}
              </div>

              {showSupplierSuggestions && (
                <div className="absolute z-50 left-0 w-full min-w-[240px] top-full mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto flex flex-col">
                  <button
                    type="button"
                    onClick={() => { setSupplierModalOpen(true); setShowSupplierSuggestions(false); }}
                    className="px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Supplier
                  </button>
                  {filteredSuppliers.length === 0 ? (
                    <div className="p-3 text-xs text-center text-muted-foreground">No suppliers found.</div>
                  ) : (
                    filteredSuppliers.slice(0, 10).map((s, idx) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => selectSupplier(s)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between border-b border-border/10 last:border-0",
                          selectedSupplierDropdownIdx === idx ? "bg-primary/10 text-primary font-bold" : "",
                          supplierId === s._id && "bg-primary/5 font-semibold"
                        )}
                      >
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.phone}</p>
                        </div>
                        {s.gstNumber && <Badge variant="secondary" className="text-[9px] shrink-0 self-center">GST</Badge>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mobile: Mobile + GST side by side (hidden on md+) */}
            <div className="space-y-1 md:hidden">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mobile</Label>
              <Input value={supplierPhone} onChange={(e) => { if (!isSupplierMatched) setSupplierPhone(e.target.value); }} readOnly={isSupplierMatched} placeholder="Phone..." className={`h-7 text-xs ${isSupplierMatched ? "bg-muted/30 text-muted-foreground border-transparent" : "bg-card"}`} />
            </div>

            {/* Desktop: Mobile field */}
            <div className="space-y-1 hidden md:block">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mobile</Label>
              <Input value={supplierPhone} onChange={(e) => { if (!isSupplierMatched) setSupplierPhone(e.target.value); }} readOnly={isSupplierMatched} placeholder="Phone..." className={`h-7 text-xs ${isSupplierMatched ? "bg-muted/30 text-muted-foreground border-transparent" : "bg-card"}`} />
            </div>

            {/* GST - hidden on smallest, show from sm */}
            <div className="space-y-1 hidden sm:block">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GST No</Label>
              <Input value={supplierGst} onChange={(e) => { if (!isSupplierMatched) setSupplierGst(e.target.value); }} readOnly={isSupplierMatched} placeholder="GST..." className={`h-7 text-xs ${isSupplierMatched ? "bg-muted/30 text-muted-foreground border-transparent" : "bg-card"}`} />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoice No</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-..." className="h-7 text-xs bg-card" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="h-7 text-xs bg-card" />
            </div>
          </div>

          {/* Table Area - horizontally scrollable on small screens */}
          <div className="flex-1 overflow-auto bg-card relative">
            <div className="min-w-[780px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/50 backdrop-blur-md border-b-2 border-border/60 whitespace-nowrap">
                    <th className="w-[24px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">#</th>
                    <th className="w-[80px] min-w-[80px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Barcode</th>
                    <th className="w-[80px] min-w-[80px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">SKU</th>
                    <th className="w-full min-w-[100px] px-1 py-1.5 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Product Name</th>
                    <th className="w-[40px] min-w-[40px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Unit</th>
                    <th className="w-[40px] min-w-[40px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Qty</th>
                    <th className="w-[85px] min-w-[85px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Pur. Price(₹)</th>
                    <th className="w-[85px] min-w-[85px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Sales Price(₹)</th>
                    <th className="w-[35px] min-w-[35px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Disc%</th>
                    <th className="w-[45px] min-w-[45px] px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Tax%</th>
                    <th className="w-[70px] min-w-[70px] px-1 py-1.5 text-right text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Total(₹)</th>
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
                        <td className="px-1 py-1 text-center border-r border-border/20">
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold bg-muted/60 text-muted-foreground">{idx + 1}</span>
                        </td>

                        <td className="px-1 py-0.5 border-r border-border/20 relative">
                          <div className="relative">
                            <TableCellInput
                              id={`scan-input-${idx}`}
                              ref={(el) => { barcodeRefs.current[item.id] = el; }}
                              value={item.product ? item.product.barcode || item.product.sku : item.productSearch}
                              onChange={(e) => handleProductSearch(idx, e.target.value)}
                              onFocus={() => setActiveSearchIdx(idx)}
                              onKeyDown={(e) => { handleKeyDown(e, idx); handleCustomTab(e, item.id, "barcode", idx); }}
                              placeholder="Scan..."
                              className={cn(
                                "text-left font-mono text-[11px] bg-primary/5 rounded-md px-1.5 py-0 h-5.5",
                                item.productSearch && !item.product ? "border-amber-500/50 text-amber-500" : ""
                              )}
                            />
                          </div>
                          {activeSearchIdx === idx && item.productSearch.length > 0 && (
                            <div className="absolute z-50 left-0 w-[min(400px,90vw)] top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                              {productResults.length === 0 ? (
                                <div className="p-3 text-[10px] text-center text-muted-foreground">Type to create a new product</div>
                              ) : (
                                productResults.map((p, pIdx) => (
                                  <button key={p._id} type="button" onClick={() => selectProduct(idx, p)} className={`flex items-center gap-2 w-full px-2 py-1.5 text-left transition-colors border-b border-border/10 last:border-0 ${selectedDropdownIdx === pIdx ? "bg-primary/10" : "hover:bg-muted/40"}`}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-semibold truncate">{p.name}</p>
                                      <p className="text-[9px] font-mono text-muted-foreground">{p.sku} {p.barcode ? `• ${p.barcode}` : ""}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[9px] shrink-0">{p.stock} in stock</Badge>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </td>

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

                        <td className="px-1 py-0.5 border-r border-border/20">
                          <TableCellInput
                            ref={(el) => { discountRefs.current[item.id] = el; }}
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={(e) => updateItem(idx, "discount", +e.target.value)}
                            onKeyDown={(e) => handleCustomTab(e, item.id, "discount", idx)}
                            className="text-[12px] font-bold px-1 py-0 h-5.5 text-center"
                          />
                        </td>

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

                        <td className="px-1.5 py-1 text-right border-r border-border/20">
                          <span className="text-[12px] font-black tabular-nums tracking-tight">{formatCurrency(item.total)}</span>
                        </td>

                        <td className="px-0.5 py-0.5 text-center">
                          <button onClick={() => removeRow(idx)} disabled={items.length <= 1} className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-0 disabled:pointer-events-none">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>

                  {/* Empty Filler Row */}
                  <tr className="h-[40px] border-b border-border/10">
                    <td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td className="border-r border-border/10"></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="shrink-0 p-2 border-t bg-muted/10 flex justify-center z-10">
            <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs font-semibold gap-1 px-4 rounded-full border-dashed border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>
        </div>

        {/* Right Side: Bill Summary — hidden on mobile/tablet, visible on lg+ */}
        <div className="hidden lg:flex w-[240px] shrink-0 border-l flex-col bg-card z-20">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Bill Summary</h3>
              <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-3">
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Items</span><span>{items.filter(i => i.product || i.newProductName).length}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-bold">{formatCurrency(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-xs font-bold text-emerald-500"><span>Discount</span><span className="tabular-nums">- {formatCurrency(totalDiscount)}</span></div>}
                {totalTax > 0 && <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Tax Amount</span><span className="tabular-nums font-bold">{formatCurrency(totalTax)}</span></div>}
                <div className="flex justify-between text-xs font-medium items-center">
                  <span className="text-muted-foreground">Shipping</span>
                  <Input
                    type="number"
                    min={0}
                    value={shippingCharges || ""}
                    onChange={(e) => setShippingCharges(+e.target.value)}
                    placeholder="0"
                    data-field="shipping"
                    className="w-[80px] h-6 px-2 text-right tabular-nums font-bold bg-background text-[11px]"
                  />
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-base font-black">
                  <span>Total</span><span className="text-primary tabular-nums tracking-tight">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Details</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="h-8 text-xs font-semibold bg-muted/20 hover:bg-muted/40 border border-border/40 hover:border-border/80 transition-all cursor-pointer focus:ring-1 focus:ring-primary/40 focus:bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-xs">Cash</SelectItem>
                      <SelectItem value="bank_transfer" className="text-xs">Bank Transfer</SelectItem>
                      <SelectItem value="cheque" className="text-xs">Cheque</SelectItem>
                      <SelectItem value="upi" className="text-xs">UPI</SelectItem>
                      <SelectItem value="card" className="text-xs">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod !== "cash" && bankAccounts.length > 0 && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Pay From Bank *</Label>
                    <Select value={cashBankAccountId} onValueChange={setCashBankAccountId}>
                      <SelectTrigger className="h-8 text-xs font-semibold bg-muted/20 hover:bg-muted/40 border border-border/40 hover:border-border/80 transition-all cursor-pointer focus:ring-1 focus:ring-primary/40 focus:bg-background"><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account._id} value={account._id} className="text-xs">
                            {account.accountName} - ₹{account.currentBalance.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Transporter</Label>
                  <Select value={transporterId} onValueChange={setTransporterId}>
                    <SelectTrigger className="h-8 text-xs font-semibold bg-muted/20 hover:bg-muted/40 border border-border/40 hover:border-border/80 transition-all cursor-pointer focus:ring-1 focus:ring-primary/40 focus:bg-background"><SelectValue placeholder="Select Transporter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                      {transporters.map((t) => (
                        <SelectItem key={t._id} value={t._id} className="text-xs">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-field="notes"
                    placeholder="Add purchase notes..."
                    className="h-16 text-xs bg-muted/30 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* New Product Modal */}
      <Dialog open={newProductModalOpen} onOpenChange={setNewProductModalOpen}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-auto sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Fill in the product details and upload images.</DialogDescription>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stock *</Label>
                <Input type="number" value={newProductForm.stock} onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={newProductForm.lowStockThreshold} onChange={(e) => setNewProductForm({ ...newProductForm, lowStockThreshold: e.target.value })} placeholder="10" />
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

      {/* Supplier Modal */}
      <SupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        onSuccess={reloadSuppliers}
      />
    </div>
  );
}
