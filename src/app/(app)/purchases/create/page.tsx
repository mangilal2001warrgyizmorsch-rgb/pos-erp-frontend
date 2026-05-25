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
import { useThemeStore } from "@/store/themeStore";
import { PageHeader } from "@/components/shared/PageHeader";
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

const newItem = (purchaseTaxType: "with" | "without" = "without"): ItemRow => {
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
    purchaseTaxType,
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
  const { sidebarCollapsed } = useThemeStore();

  // Global Tax Mode State
  const [globalTaxType, setGlobalTaxType] = useState<"without" | "with">("without");

  const handleGlobalTaxTypeChange = (newType: "without" | "with") => {
    setGlobalTaxType(newType);
    setItems((prev) =>
      prev.map((item) => {
        const updated = { ...item, purchaseTaxType: newType };
        updated.total = calcItemTotal(updated);
        return updated;
      })
    );
  };

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
  const [notes, setNotes] = useState("Thanks for doing business with us!");
  const [termsTemplate, setTermsTemplate] = useState("default");

  const handleTemplateChange = (val: string) => {
    setTermsTemplate(val);
    if (val === "default") {
      setNotes("Thanks for doing business with us!");
    } else if (val === "standard") {
      setNotes("1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.\n3. Payment due within 15 days.");
    } else {
      setNotes("");
    }
  };

  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [stateOfSupply, setStateOfSupply] = useState("Rajasthan");
  const [roundOff, setRoundOff] = useState(false);

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
    const ni = newItem(globalTaxType);
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

  const calculatedGrandTotal = subtotal + totalTax + shippingCharges;
  const finalTotal = roundOff ? Math.round(calculatedGrandTotal) : calculatedGrandTotal;
  const roundOffValue = finalTotal - calculatedGrandTotal;
  const grandTotal = finalTotal;

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
        stateOfSupply,
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
        totalAmount: finalTotal,
        roundOff: roundOffValue,
        amountPaid: status === "confirmed" ? finalTotal : 0,
        dueAmount: status === "confirmed" ? 0 : finalTotal,
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

  // Calculate totalQty at render scope
  const totalQty = items.reduce((s, item) => s + (item.product || item.newProductName ? item.quantity : 0), 0);

  return (
    <div className="bg-slate-50/50 pb-32 relative">
      {/* Top Header */}
      <div className="mb-4">
        <PageHeader
          title="Purchase"
          description="Create and manage purchase bills"
          icon={Receipt}
        />
      </div>

      {/* Top Purchase Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-sm mb-4">
        {/* Left Side: Supplier Details */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 border-b pb-1">Supplier Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Supplier select */}
            <div className="space-y-1.5 relative" ref={supplierWrapperRef}>
              <Label className="text-xs font-semibold text-foreground">Supplier / Party <span className="text-destructive">*</span></Label>
              <div className="relative flex items-center">
                <Input
                  value={supplierSearch}
                  onChange={(e) => {
                    handleSupplierSearch(e.target.value);
                    setShowSupplierSuggestions(true);
                  }}
                  onFocus={() => setShowSupplierSuggestions(true)}
                  onKeyDown={handleSupplierKeyDown}
                  placeholder="Search by Name/Phone"
                  className={cn(
                    "h-9 text-xs font-semibold pr-9 bg-card shadow-sm border border-border/80 transition-all placeholder:text-muted-foreground/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30",
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
                    className="absolute right-2.5 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                )}
              </div>

              {showSupplierSuggestions && (
                <div className="absolute z-50 left-0 w-full min-w-[240px] top-full mt-1.5 bg-card border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto flex flex-col">
                  <button
                    type="button"
                    onClick={() => { setSupplierModalOpen(true); setShowSupplierSuggestions(false); }}
                    className="px-3 py-2.5 text-left text-xs font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2 transition-colors cursor-pointer"
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
                          "w-full px-3 py-2.5 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between border-b border-border/10 last:border-0",
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

            {/* Phone No */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Phone No.</Label>
              <Input
                value={supplierPhone}
                onChange={(e) => { if (!isSupplierMatched) setSupplierPhone(e.target.value); }}
                readOnly={isSupplierMatched}
                placeholder="Phone No."
                className={cn(
                  "h-9 text-xs bg-card border border-border/80 shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30",
                  isSupplierMatched && "bg-muted/30 text-muted-foreground border-transparent shadow-none cursor-not-allowed"
                )}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Bill Details */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 border-b pb-1">Bill Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bill Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Bill Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Bill Number"
                className="h-9 text-xs bg-card border border-border/80 shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            {/* Bill Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Bill Date</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="h-9 text-xs bg-card border border-border/80 shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 cursor-pointer"
              />
            </div>

            {/* State of Supply */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">State of Supply</Label>
              <Select value={stateOfSupply} onValueChange={setStateOfSupply}>
                <SelectTrigger className="h-9 text-xs font-semibold bg-card border border-border/85 shadow-sm rounded-lg focus:ring-1 focus:ring-primary/30 transition-all hover:bg-card/90 cursor-pointer">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {["Rajasthan", "Delhi", "Maharashtra", "Gujarat", "Uttar Pradesh", "Haryana", "Punjab", "Karnataka", "Tamil Nadu", "Telangana", "Other"].map((state) => (
                    <SelectItem key={state} value={state} className="text-xs font-medium">{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                <th className="w-[18%] py-2 text-left px-3 border-r border-border/30">ITEM / PRODUCT NAME</th>
                <th className="w-[5%] py-2 border-r border-border/30">QTY</th>
                <th className="w-[7%] py-2 border-r border-border/30">UNIT</th>
                <th className="w-[13%] py-2 px-2 border-r border-border/30">
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-black">PRICE / UNIT</span>
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
                <th className="w-[6%] py-2 border-r border-border/30">DISC %</th>
                <th className="w-[7%] py-2 border-r border-border/30">TAX %</th>
                <th className="w-[12%] py-2 text-right px-3 border-r border-border/30">AMOUNT</th>
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
                  {/* # */}
                  <td className="py-1 border-r border-border/15 font-bold text-[10px] text-muted-foreground">
                    {idx + 1}
                  </td>

                  {/* Barcode / Scan */}
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

                  {/* Product Name */}
                  <td className="py-0.5 px-1 border-r border-border/15 text-left">
                    {item.product ? (
                      <span className="text-xs font-semibold px-2 block truncate w-full" title={item.product.name}>
                        {item.product.name}
                      </span>
                    ) : (
                      <TableCellInput
                        ref={(el) => { nameRefs.current[item.id] = el; }}
                        value={item.newProductName}
                        onChange={(e) => updateItem(idx, "newProductName", e.target.value)}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "name", idx)}
                        placeholder="New product name..."
                        className="h-8 text-left text-xs font-semibold bg-amber-500/5 border border-amber-500/20 text-amber-500 placeholder:text-amber-500/40 rounded-lg px-2.5 w-full focus:bg-background focus:border-amber-500/45 focus:ring-1 focus:ring-amber-500/20 focus:shadow-sm"
                      />
                    )}
                  </td>

                  {/* Qty */}
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

                  {/* Unit */}
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

                  {/* Purchase Price */}
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

                  {/* Sale Price */}
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

                  {/* Discount % */}
                  <td className="py-0.5 px-1 border-r border-border/15">
                    <TableCellInput
                      ref={(el) => { discountRefs.current[item.id] = el; }}
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount}
                      onChange={(e) => updateItem(idx, "discount", +e.target.value)}
                      onKeyDown={(e) => handleCustomTab(e, item.id, "discount", idx)}
                      className="h-8 text-center text-xs font-bold bg-muted/10 border border-border/40 rounded-lg px-1 focus:bg-background focus:border-primary/45 focus:ring-1 focus:ring-primary/20 focus:shadow-sm transition-all w-full"
                    />
                  </td>

                  {/* Tax % */}
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

                  {/* Amount */}
                  <td className="py-1 px-3 border-r border-border/15 text-right font-black text-xs text-foreground tabular-nums">
                    {formatCurrency(item.total)}
                  </td>

                  {/* Delete row button */}
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
                <td className="border-r border-border/10"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add Row Button below table */}
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

      {/* Bottom Section: 3 Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Column 1: Terms & Conditions */}
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Terms & Conditions</h3>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Template</Label>
              <Select value={termsTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-card border border-border/80 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="text-xs font-medium">Purchase Bill</SelectItem>
                  <SelectItem value="standard" className="text-xs font-medium">Standard Terms</SelectItem>
                  <SelectItem value="custom" className="text-xs font-medium">Custom / Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 flex flex-col">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Terms Text</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-field="notes"
                placeholder="Thanks for doing business with us!"
                className="flex-1 min-h-[96px] text-xs bg-card border border-border/80 shadow-sm focus:border-border hover:bg-card/95 transition-all resize-none p-2 rounded-lg leading-relaxed w-full"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Payment & Attachments */}
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Payment & Attachments</h3>
            </div>
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Payment Type</Label>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="h-8 text-xs font-semibold bg-card border border-border/80 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-xs font-medium">Cash</SelectItem>
                      <SelectItem value="upi" className="text-xs font-medium">UPI</SelectItem>
                      <SelectItem value="card" className="text-xs font-medium">Card</SelectItem>
                      <SelectItem value="bank_transfer" className="text-xs font-medium">Bank</SelectItem>
                      <SelectItem value="cheque" className="text-xs font-medium">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Shipping Charges</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[10px] font-bold text-muted-foreground/60 pointer-events-none">₹</span>
                    <Input
                      type="number"
                      min={0}
                      value={shippingCharges || ""}
                      onChange={(e) => setShippingCharges(+e.target.value)}
                      placeholder="0"
                      data-field="shipping"
                      className="w-full h-8 pl-6 pr-2 text-right tabular-nums font-bold bg-card border border-border/80 rounded-lg shadow-sm text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Accounts */}
              {paymentMethod !== "cash" && bankAccounts.length > 0 && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Pay From Bank *</Label>
                  <Select value={cashBankAccountId} onValueChange={setCashBankAccountId}>
                    <SelectTrigger className="h-8 text-xs font-semibold bg-card border border-border/80 rounded-lg">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id} className="text-xs font-medium">
                          {account.accountName} - ₹{account.currentBalance.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Transporter selector positioned at the bottom */}
          <div className="space-y-1 mt-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Transporter</Label>
            <Select value={transporterId} onValueChange={setTransporterId}>
              <SelectTrigger className="h-8 text-xs font-semibold bg-card border border-border/80 rounded-lg">
                <SelectValue placeholder="Select Transporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs font-medium">None</SelectItem>
                {transporters.map((t) => (
                  <SelectItem key={t._id} value={t._id} className="text-xs font-medium">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Column 3: Totals & Round-off */}
        <div className="bg-card p-4 rounded-xl border border-border/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-1 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Totals</h3>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Discount</span>
                <span className="tabular-nums text-emerald-600">- {formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Tax Amount</span>
                <span className="tabular-nums text-foreground">{formatCurrency(totalTax)}</span>
              </div>
              {shippingCharges > 0 && (
                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                  <span>Shipping Charges</span>
                  <span className="tabular-nums text-foreground">{formatCurrency(shippingCharges)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 space-y-2 mt-2">
            {/* Round Off Checkbox */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <input
                  id="roundOffCheckbox"
                  type="checkbox"
                  checked={roundOff}
                  onChange={(e) => setRoundOff(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="roundOffCheckbox" className="font-semibold text-muted-foreground uppercase text-[10px] cursor-pointer">Round Off</Label>
              </div>
              {roundOff && (
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                  {roundOffValue >= 0 ? "+" : ""}{roundOffValue.toFixed(2)}
                </span>
              )}
            </div>

            {/* Grand Total Display */}
            <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
              <span className="text-xs font-black uppercase text-foreground">Grand Total</span>
              <span className="text-lg font-black text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
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
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "image/*,application/pdf";
              fileInput.onchange = () => {
                toast.success("Bill document selected and attached to this purchase invoice draft.");
              };
              fileInput.click();
            }}
            className="h-9 text-xs font-bold gap-2 hover:bg-muted transition-all border border-border/80 text-foreground"
          >
            Upload Bill
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Share Button with Dropdown Menu */}
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-1 border border-border/80 text-foreground hover:bg-muted"
            >
              Share
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <div className="absolute right-0 bottom-full mb-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[160px] hidden group-hover:block hover:block z-50">
              <button
                type="button"
                onClick={() => toast.success("WhatsApp link generated and copied!")}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-muted transition-colors border-b border-border/10"
              >
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => toast.success("Email drafted to supplier!")}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-muted transition-colors border-b border-border/10"
              >
                Email Invoice
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-muted transition-colors border-b border-border/10"
              >
                Print Bill
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </div>

          {/* Primary Save Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit("confirmed")}
            disabled={saving}
            className="h-9 text-xs font-bold shadow-md shadow-primary/20 px-6 min-w-[100px]"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
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
