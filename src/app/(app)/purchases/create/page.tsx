"use client";

import { useEffect, useState, useCallback } from "react";
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
import { formatCurrency } from "@/lib/utils";
import type {
  Supplier,
  Transporter,
  Product,
  Category,
  Subcategory,
} from "@/types";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supplierService
      .getAll({ limit: 200 })
      .then((r) => setSuppliers(r.data))
      .catch(() => {});
    transporterService
      .getAll({ limit: 200 })
      .then((r) => setTransporters(r.data))
      .catch(() => {});
    productService
      .getAll({ limit: 500 })
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
    cashBankService
      .getAccounts()
      .then((res) => {
        if (res.success && res.data) {
          setBankAccounts(
            res.data.filter(
              (a: any) => a.accountType === "bank" && a.status === "active",
            ),
          );
        }
      })
      .catch((err) => console.error("Failed to load bank accounts:", err));
  }, []);

  useEffect(() => {
    setSelectedDropdownIdx(-1);
  }, [productResults, activeSearchIdx]);

  const handlePaymentMethodChange = (val: string) => {
    setPaymentMethod(val);
    if (val !== "cash") {
      const defaultBank =
        bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
      if (defaultBank && !cashBankAccountId) {
        setCashBankAccountId(defaultBank._id);
      }
    } else {
      setCashBankAccountId("");
    }
  };

  // On supplier select
  const handleSupplierSearch = (query: string) => {
    setSupplierSearch(query);
    setSelectedSupplierDropdownIdx(-1);

    if (query.trim() === "") {
      setSupplierId("");
      setSupplierPhone("");
      setSupplierGst("");
      setIsSupplierMatched(false);
      setShowSupplierSuggestions(false);
      return;
    }

    // Try to find if there's an exact match (case-insensitive)
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
    const filtered = suppliers.filter((s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );

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
      if (
        selectedSupplierDropdownIdx >= 0 &&
        selectedSupplierDropdownIdx < filtered.length
      ) {
        selectSupplier(filtered[selectedSupplierDropdownIdx]);
      } else if (filtered.length > 0) {
        selectSupplier(filtered[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSupplierSuggestions(false);
    }
  };

  const handleSupplierBlur = () => {
    setTimeout(() => {
      setShowSupplierSuggestions(false);
    }, 200);
  };

  // Product search within item row
  const handleProductSearch = (idx: number, query: string) => {
    const updated = [...items];
    updated[idx].productSearch = query;
    updated[idx].product = null; // Reset product when typing
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

    // Auto-select exact barcode/SKU
    const exactMatch = products.find(
      (p) => p.barcode?.toLowerCase() === q || p.sku.toLowerCase() === q,
    );
    if (exactMatch) {
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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
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

  // Select product for item row
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
      isNewProduct: false,
      newProductData: undefined,
    };
    updated[idx].total = calcItemTotal(updated[idx]);

    // Automatically add a new row if we selected the product for the last row
    if (idx === updated.length - 1) {
      updated.push(newItem());
      // Set focus to the new barcode input after rendering
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

  const handleAddNewProductSubmit = async () => {
    if (newProductIdx === null) return;
    if (
      !newProductForm.name ||
      !newProductForm.category ||
      !newProductForm.sku
    ) {
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
        image:
          newProductForm.images.length > 0
            ? newProductForm.images[0]
            : undefined,
      };
      const savedProduct = await productService.create(payload);
      // Add saved product to local list so it's searchable
      setProducts((prev) => [...prev, savedProduct]);
      // Populate the item row with the real saved product
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
      });
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

  // Update item field
  const updateItem = (
    idx: number,
    field: keyof ItemRow,
    value: number | string,
  ) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
  };

  // Add / Remove rows
  const addRow = () => setItems([...items, newItem()]);
  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Auto-calculate salesPrice preview
  useEffect(() => {
    const totalQty = items.reduce(
      (s, item) => s + (item.product || item.isNewProduct ? item.quantity : 0),
      0,
    );
    const perItemShipping = totalQty > 0 ? shippingCharges / totalQty : 0;

    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (!item.product && !item.isNewProduct) return item;

        const base = item.purchaseRate;
        const discAmt = (base * item.discount) / 100;
        const afterDisc = base - discAmt;
        const taxAmt = (afterDisc * item.taxRate) / 100;

        // Auto-calculated sales price: Purchase + Tax + Pro-rata Shipping - Discount
        const newSalesPrice = Number(
          (afterDisc + taxAmt + perItemShipping).toFixed(2),
        );

        // Only update if it's currently 0 or we want strict tracking (we will overwrite if they change cost)
        if (
          item.salesPrice !== newSalesPrice &&
          (item.salesPrice === 0 || item._autoCalculated === item.salesPrice)
        ) {
          changed = true;
          return {
            ...item,
            salesPrice: newSalesPrice,
            _autoCalculated: newSalesPrice,
          };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [items, shippingCharges]);

  // Calculations
  const subtotal = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate =
      item.purchaseTaxType === "with"
        ? item.purchaseRate / taxMultiplier
        : item.purchaseRate;
    const base = item.quantity * baseRate;
    const discAmt = (base * item.discount) / 100;
    return s + (base - discAmt);
  }, 0);

  const totalTax = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate =
      item.purchaseTaxType === "with"
        ? item.purchaseRate / taxMultiplier
        : item.purchaseRate;
    const base = item.quantity * baseRate;
    const discAmt = (base * item.discount) / 100;
    const afterDisc = base - discAmt;
    return s + (afterDisc * item.taxRate) / 100;
  }, 0);

  const totalDiscount = items.reduce((s, item) => {
    const taxMultiplier = 1 + item.taxRate / 100;
    const baseRate =
      item.purchaseTaxType === "with"
        ? item.purchaseRate / taxMultiplier
        : item.purchaseRate;
    const base = item.quantity * baseRate;
    return s + (base * item.discount) / 100;
  }, 0);

  const grandTotal = subtotal + totalTax + shippingCharges;

  // Submit
  const handleSubmit = async (status: "confirmed" | "draft") => {
    let finalSupplierId = supplierId;
    let finalSupplierName = "";

    if (!finalSupplierId) {
      if (!supplierSearch.trim()) {
        toast.error("Please enter a supplier name");
        return;
      }
      if (!supplierPhone.trim()) {
        toast.error("Please enter a mobile number for the unmatched supplier");
        return;
      }
    }

    const validItems = items.filter(
      (i) => i.product || (i.productSearch.trim() !== "" || (i.newProductName && i.newProductName.trim() !== "")),
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    if (validItems.some((i) => !i.product && (!i.newProductName || i.newProductName.trim() === ""))) {
      toast.error("Please enter a product name for all new items");
      return;
    }
    if (validItems.some((i) => i.quantity <= 0)) {
      toast.error("Quantity must be > 0");
      return;
    }

    try {
      setSaving(true);

      // Create new supplier inline if unmatched
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

      // 1. Create any brand new products inline first!
      const resolvedItems = await Promise.all(
        validItems.map(async (item) => {
          if (item.product) {
            return item;
          }

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

          const finalBarcode = item.barcode.trim();
          const finalSku =
            item.sku.trim() ||
            finalBarcode ||
            `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

          const savedProduct = await productService.create({
            name: item.newProductName!.trim(),
            sku: finalSku,
            barcode: finalBarcode,
            category: defaultCategoryId,
            stock: 0, // Purchase transaction will add the stock
            purchasePrice: purchasePrice,
            salesPrice: salesPrice,
            taxRate: item.taxRate,
            unit: item.unit || "piece",
          });

          // Add saved product to local state list
          setProducts((prev) => [...prev, savedProduct]);

          return {
            ...item,
            product: savedProduct,
          };
        })
      );

      const payload = {
        supplier: finalSupplierId,
        supplierName: finalSupplierName,
        transporter:
          transporterId && transporterId !== "none" ? transporterId : undefined,
        transporterName:
          transporterId && transporterId !== "none"
            ? transporters.find((t) => t._id === transporterId)?.name
            : undefined,
        invoiceNumber,
        purchaseDate,
        items: resolvedItems.map((i) => {
          // Calculate base purchase price without tax if entered "with" tax
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice =
            i.purchaseTaxType === "with"
              ? i.purchaseRate / taxMultiplier
              : i.purchaseRate;

          // Calculate base sales price without tax if entered "with" tax
          const salesPrice =
            i.salesTaxType === "with"
              ? i.salesPrice / taxMultiplier
              : i.salesPrice;

          const finalSubtotal = i.quantity * purchasePrice;
          const discountAmt = (finalSubtotal * i.discount) / 100;
          const finalAfterDisc = finalSubtotal - discountAmt;
          const taxAmt = (finalAfterDisc * i.taxRate) / 100;

          return {
            product: i.product!._id,
            name: i.product!.name,
            sku: i.product!.sku,
            quantity: i.quantity,
            purchasePrice: purchasePrice,
            salesPrice: salesPrice,
            discount: i.discount,
            discountAmount: discountAmt,
            taxRate: i.taxRate,
            taxAmount: taxAmt,
            total: finalAfterDisc + taxAmt,
          };
        }),
        subtotal: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice =
            i.purchaseTaxType === "with"
              ? i.purchaseRate / taxMultiplier
              : i.purchaseRate;
          return s + i.quantity * purchasePrice;
        }, 0),
        taxAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice =
            i.purchaseTaxType === "with"
              ? i.purchaseRate / taxMultiplier
              : i.purchaseRate;
          const base = i.quantity * purchasePrice;
          const disc = (base * i.discount) / 100;
          return s + ((base - disc) * i.taxRate) / 100;
        }, 0),
        discountAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice =
            i.purchaseTaxType === "with"
              ? i.purchaseRate / taxMultiplier
              : i.purchaseRate;
          const base = i.quantity * purchasePrice;
          return s + (base * i.discount) / 100;
        }, 0),
        totalAmount: resolvedItems.reduce((s, i) => {
          const taxMultiplier = 1 + i.taxRate / 100;
          const purchasePrice =
            i.purchaseTaxType === "with"
              ? i.purchaseRate / taxMultiplier
              : i.purchaseRate;
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
        cashBankAccountId:
          status === "confirmed" && paymentMethod !== "cash"
            ? cashBankAccountId
            : undefined,
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
    <div className="flex flex-col lg:h-[calc(100vh-115px)] overflow-y-auto lg:overflow-hidden space-y-4 pb-2 h-auto">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Create Purchase Bill
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 min-h-0">
        {/* Left Side: Supplier details and products table */}
        <div className="lg:col-span-2 flex flex-col lg:h-full lg:min-h-0 h-auto space-y-4">
          {/* Supplier Details Card */}
          <Card className="shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 relative">
                  <Label className="text-xs">Supplier *</Label>
                  <Input
                    value={supplierSearch}
                    onChange={(e) => handleSupplierSearch(e.target.value)}
                    onKeyDown={handleSupplierKeyDown}
                    onFocus={() => setShowSupplierSuggestions(true)}
                    onBlur={handleSupplierBlur}
                    placeholder="Type Supplier Name..."
                    className={`h-9 text-sm transition-all ${
                      isSupplierMatched
                        ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-200"
                        : supplierSearch.trim() !== ""
                        ? "border-amber-500/50 bg-amber-500/5 text-amber-200"
                        : ""
                    }`}
                  />
                  {showSupplierSuggestions && supplierSearch.length > 0 && (
                    <div className="absolute z-50 left-0 w-full top-full mt-1 bg-card border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {suppliers.filter((s) =>
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-sm text-center text-muted-foreground">
                          Supplier not found. Enter details manually to register them on save.
                        </div>
                      ) : (
                        suppliers
                          .filter((s) =>
                            s.name.toLowerCase().includes(supplierSearch.toLowerCase())
                          )
                          .map((s, idx) => (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => selectSupplier(s)}
                              className={`flex items-center justify-between w-full px-3 py-2 text-left transition-colors text-sm ${
                                selectedSupplierDropdownIdx === idx
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div>
                                <p className="font-medium">{s.name}</p>
                                <p className="text-xs text-muted-foreground">{s.phone}</p>
                              </div>
                              {s.gstNumber && (
                                <Badge variant="secondary" className="text-[10px]">
                                  GST
                                </Badge>
                              )}
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mobile Number</Label>
                  <Input
                    value={supplierPhone}
                    onChange={(e) => {
                      if (!isSupplierMatched) {
                        setSupplierPhone(e.target.value);
                      }
                    }}
                    readOnly={isSupplierMatched}
                    placeholder="Enter phone number..."
                    className={`h-9 text-sm transition-all ${
                      isSupplierMatched
                        ? "bg-muted/50 text-muted-foreground border-transparent"
                        : "border-amber-500/30 focus-visible:ring-amber-500 bg-amber-500/5 font-semibold text-amber-100 placeholder:text-amber-500/30"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">GST Number</Label>
                  <Input
                    value={supplierGst}
                    onChange={(e) => {
                      if (!isSupplierMatched) {
                        setSupplierGst(e.target.value);
                      }
                    }}
                    readOnly={isSupplierMatched}
                    placeholder="Enter GST number..."
                    className={`h-9 text-sm transition-all ${
                      isSupplierMatched
                        ? "bg-muted/50 text-muted-foreground border-transparent"
                        : "border-amber-500/30 focus-visible:ring-amber-500 bg-amber-500/5 font-semibold text-amber-100 placeholder:text-amber-500/30"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Supplier invoice no."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Purchase Date</Label>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Transporter</Label>
                  <Select
                    value={transporterId}
                    onValueChange={setTransporterId}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Transporter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {transporters.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name}{" "}
                          {t.vehicleNumber ? `(${t.vehicleNumber})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details Card */}
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-3 shrink-0">
              <CardTitle className="text-sm font-semibold">
                Item Details
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={addRow}
                className="gap-1 h-8 py-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
              <div className="flex-1 overflow-auto border-t animate-in fade-in duration-300">
                <table className="w-full min-w-[1320px]">
                  <thead>
                    <tr className="border-b bg-muted/30 sticky top-0 z-10">
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-12">
                        #
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-40">
                        Barcode
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-40">
                        SKU / Item Code
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground min-w-[200px]">
                        Product Name
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-28">
                        Unit
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-20">
                        Qty
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-48">
                        Purchase Price
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-48">
                        Sales Price
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-20">
                        Disc %
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground w-24">
                        Tax %
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground w-32 pr-4">
                        Total (₹)
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {items.map((item, idx) => {
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                          >
                            <td className="p-2 text-sm text-muted-foreground font-mono text-center">
                              {idx + 1}
                            </td>

                            {/* Barcode Scan Column */}
                            <td className="p-2 relative">
                              <div className="relative">
                                <Input
                                  id={`scan-input-${idx}`}
                                  value={
                                    item.product
                                      ? item.product.barcode || item.product.sku
                                      : item.productSearch
                                  }
                                  onChange={(e) =>
                                    handleProductSearch(idx, e.target.value)
                                  }
                                  onFocus={() => setActiveSearchIdx(idx)}
                                  onKeyDown={(e) => handleKeyDown(e, idx)}
                                  placeholder="Scan Barcode..."
                                  className={`h-9 text-sm font-mono transition-all ${
                                    item.productSearch && !item.product
                                      ? "border-amber-500/50 bg-amber-500/5 focus-visible:ring-amber-500 text-amber-200"
                                      : item.product
                                      ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-200"
                                      : ""
                                  }`}
                                />
                              </div>
                              {/* Dropdown list */}
                              {activeSearchIdx === idx &&
                                item.productSearch.length > 0 && (
                                  <div className="absolute z-50 left-0 w-[400px] top-full mt-1 bg-card border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                    {productResults.length === 0 ? (
                                      <div className="p-3 text-sm text-center text-muted-foreground">
                                        No matching product. Type details directly in the row to create.
                                      </div>
                                    ) : (
                                      productResults.map((p, pIdx) => (
                                        <button
                                          key={p._id}
                                          type="button"
                                          onClick={() => selectProduct(idx, p)}
                                          className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors text-sm ${
                                            selectedDropdownIdx === pIdx
                                              ? "bg-primary/10 text-primary font-medium"
                                              : "hover:bg-muted/50"
                                          }`}
                                        >
                                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            {p.image ? (
                                              <img
                                                src={p.image}
                                                alt=""
                                                className="h-8 w-8 rounded-lg object-cover"
                                              />
                                            ) : (
                                              <Package className="h-4 w-4 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                              {p.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              SKU: {p.sku}{" "}
                                              {p.barcode ? `• ${p.barcode}` : ""}
                                            </p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <Badge
                                              variant="secondary"
                                              className="text-[10px]"
                                            >
                                              {p.stock} in stock
                                            </Badge>
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                            </td>

                            {/* SKU / Item Code Column */}
                            <td className="p-2">
                              <Input
                                value={item.sku}
                                onChange={(e) =>
                                  updateItem(idx, "sku", e.target.value)
                                }
                                placeholder="SKU-XXXX"
                                className="h-9 text-sm text-center font-mono"
                              />
                            </td>

                            {/* Product Name Column */}
                            <td className="p-2">
                              {item.product ? (
                                <Input
                                  value={item.product.name}
                                  readOnly
                                  className="h-9 text-sm bg-muted/20 border-transparent focus-visible:ring-0"
                                />
                              ) : (
                                <Input
                                  value={item.newProductName}
                                  onChange={(e) =>
                                    updateItem(idx, "newProductName", e.target.value)
                                  }
                                  placeholder="Enter Product Name..."
                                  className="h-9 text-sm border-amber-500/30 focus-visible:ring-amber-500 bg-amber-500/5 font-semibold text-amber-100 placeholder:text-amber-500/50"
                                />
                              )}
                            </td>

                            {/* Unit Selection Column */}
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

                            {/* Quantity Column */}
                            <td className="p-2">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(idx, "quantity", +e.target.value)
                                }
                                className="h-9 px-2 text-sm text-center font-medium"
                              />
                            </td>

                            {/* Purchase Price Column */}
                            <td className="p-2">
                              <div className="flex items-center gap-1.5 min-w-[130px]">
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.purchaseRate || ""}
                                  onChange={(e) =>
                                    updateItem(idx, "purchaseRate", +e.target.value)
                                  }
                                  className="h-9 px-2 text-sm text-center flex-1 font-medium"
                                />
                                <Select
                                  value={item.purchaseTaxType}
                                  onValueChange={(val: any) =>
                                    updateItem(idx, "purchaseTaxType", val)
                                  }
                                >
                                  <SelectTrigger className="h-9 w-[70px] text-[10px] px-1 bg-muted/30">
                                    <SelectValue placeholder="Tax" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="without" className="text-xs">Without</SelectItem>
                                    <SelectItem value="with" className="text-xs">With Tax</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>

                            {/* Sales Price Column */}
                            <td className="p-2">
                              <div className="flex items-center gap-1.5 min-w-[130px]">
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.salesPrice || ""}
                                  onChange={(e) =>
                                    updateItem(idx, "salesPrice", +e.target.value)
                                  }
                                  className="h-9 px-2 text-sm text-center flex-1 font-medium"
                                />
                                <Select
                                  value={item.salesTaxType}
                                  onValueChange={(val: any) =>
                                    updateItem(idx, "salesTaxType", val)
                                  }
                                >
                                  <SelectTrigger className="h-9 w-[70px] text-[10px] px-1 bg-muted/30">
                                    <SelectValue placeholder="Tax" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="without" className="text-xs">Without</SelectItem>
                                    <SelectItem value="with" className="text-xs">With Tax</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>

                            {/* Discount Column */}
                            <td className="p-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(idx, "discount", +e.target.value)
                                }
                                className="h-9 px-2 text-sm text-center font-medium"
                              />
                            </td>

                            {/* Tax Rate Dropdown */}
                            <td className="p-2">
                              <Select
                                value={item.taxRate.toString()}
                                onValueChange={(val) =>
                                  updateItem(idx, "taxRate", +val)
                                }
                              >
                                <SelectTrigger className="h-9 w-20 text-xs px-1 text-center">
                                  <SelectValue placeholder="GST" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0" className="text-xs">0% GST</SelectItem>
                                  <SelectItem value="5" className="text-xs">5% GST</SelectItem>
                                  <SelectItem value="12" className="text-xs">12% GST</SelectItem>
                                  <SelectItem value="18" className="text-xs">18% GST</SelectItem>
                                  <SelectItem value="28" className="text-xs">28% GST</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Total Column */}
                            <td className="p-2 text-right font-bold text-sm text-emerald-400 font-mono pr-4">
                              {formatCurrency(item.total)}
                            </td>

                            {/* Actions Column */}
                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeRow(idx)}
                                disabled={items.length <= 1}
                                className="text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Add row button below table */}
              <div className="py-2 px-4 border-t flex justify-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="gap-1 border-dashed border-2 w-full max-w-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Another Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Additional details & Bill Summary */}
        <div className="lg:col-span-1 flex flex-col lg:h-full lg:min-h-0 h-auto space-y-4 lg:overflow-y-auto pr-1">
          {/* Additional Details */}
          <Card className="shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={handlePaymentMethodChange}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shipping Charges</Label>
                  <Input
                    type="number"
                    min={0}
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(+e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {paymentMethod !== "cash" && bankAccounts.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Pay From Bank Account *</Label>
                  <Select
                    value={cashBankAccountId}
                    onValueChange={setCashBankAccountId}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.accountName}{" "}
                          {account.bankName ? `(${account.bankName})` : ""} - ₹
                          {account.currentBalance.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for this purchase..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="bg-muted/20 shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Items</span>
                <span>{items.filter((i) => i.product).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-500">
                <span>Discount</span>
                <span>- {formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
              {shippingCharges > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(shippingCharges)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Grand Total</span>
                <span className="text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full h-10 text-sm font-semibold shadow-lg shadow-primary/20"
                  onClick={() => handleSubmit("confirmed")}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit Purchase
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Product Modal — matches Products page */}
      <Dialog open={newProductModalOpen} onOpenChange={setNewProductModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Fill in the product details and upload images.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Images */}
            <div className="space-y-2">
              <Label>Product Images</Label>
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
                maxFiles={10}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newProductForm.description}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label>Category *</Label>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={newProductForm.subcategoryId}
                  onValueChange={(v) =>
                    setNewProductForm({ ...newProductForm, subcategoryId: v })
                  }
                  disabled={!newProductForm.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
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
                        <SelectItem key={sub._id} value={sub._id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={newProductForm.sku}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input
                  value={newProductForm.hsnCode}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      hsnCode: e.target.value,
                    })
                  }
                  placeholder="HSN"
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={newProductForm.barcode}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      barcode: e.target.value,
                    })
                  }
                  placeholder="Barcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stock *</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={newProductForm.unit}
                  onValueChange={(v) =>
                    setNewProductForm({ ...newProductForm, unit: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["piece", "kg", "liter", "meter", "box", "dozen"].map(
                      (u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewProductSubmit}
              disabled={newProductSaving}
              className="min-w-24"
            >
              {newProductSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
