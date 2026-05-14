"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, ArrowLeft, Plus, Trash2, Loader2, Save, Search, Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/services/supplierService";
import { transporterService } from "@/services/transporterService";
import { productService } from "@/services/productService";
import { purchaseService } from "@/services/purchaseService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { formatCurrency } from "@/lib/utils";
import type { Supplier, Transporter, Product, Category, Subcategory } from "@/types";

// ---------- Item Row Type ----------
interface ItemRow {
  id: string;
  product: Product | null;
  productSearch: string;
  quantity: number;
  purchaseRate: number;
  salesPrice: number;
  discount: number;
  taxRate: number;
  total: number;
  isNewProduct?: boolean;
  newProductData?: any;
  _autoCalculated?: number;
}

const newItem = (): ItemRow => ({
  id: crypto.randomUUID(),
  product: null,
  productSearch: "",
  quantity: 1,
  purchaseRate: 0,
  salesPrice: 0,
  discount: 0,
  taxRate: 0,
  total: 0,
});

const calcItemTotal = (item: ItemRow) => {
  const base = item.quantity * item.purchaseRate;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  // New Product Modal state
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProductIdx, setNewProductIdx] = useState<number | null>(null);
  const [newProductSaving, setNewProductSaving] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "", description: "", barcode: "", sku: "", category: "", subcategoryId: "",
    hsnCode: "", unit: "piece", stock: "0", lowStockThreshold: "10", images: [] as string[]
  });

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierGst, setSupplierGst] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shippingCharges, setShippingCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supplierService.getAll({ limit: 200 }).then((r) => setSuppliers(r.data)).catch(() => {});
    transporterService.getAll({ limit: 200 }).then((r) => setTransporters(r.data)).catch(() => {});
    productService.getAll({ limit: 500 }).then((r) => setProducts(r.data)).catch(() => {});
    categoryService.getAll().then((r) => setCategories(r)).catch(() => {});
    subcategoryService.getAll().then((r) => setSubcategories(r)).catch(() => {});
  }, []);

  // On supplier select
  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find((x) => x._id === id);
    if (s) {
      setSupplierPhone(s.phone);
      setSupplierGst(s.gstNumber || "");
    }
  };

  // Product search within item row
  const handleProductSearch = (idx: number, query: string) => {
    const updated = [...items];
    updated[idx].productSearch = query;
    updated[idx].product = null; // Reset product when typing
    setItems(updated);
    setActiveSearchIdx(idx);

    if (query.trim().length === 0) {
      setProductResults([]);
      return;
    }

    const q = query.toLowerCase();

    // Auto-select exact barcode/SKU
    const exactMatch = products.find(p => p.barcode?.toLowerCase() === q || p.sku.toLowerCase() === q);
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

  // Select product for item row
  const selectProduct = (idx: number, product: Product) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      product,
      productSearch: product.name,
      purchaseRate: (product as any).purchasePrice || 0,
      salesPrice: (product as any).salesPrice || 0,
      taxRate: (product as any).taxRate || 0,
      total: 0,
      isNewProduct: false,
      newProductData: undefined,
    };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);
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
      // Add saved product to local list so it's searchable
      setProducts(prev => [...prev, savedProduct]);
      // Populate the item row with the real saved product
      const updated = [...items];
      updated[newProductIdx] = {
        ...updated[newProductIdx],
        product: savedProduct,
        productSearch: savedProduct.name,
        purchaseRate: 0,
        salesPrice: 0,
        taxRate: 0,
        total: 0,
        isNewProduct: false,
        newProductData: undefined,
      };
      setItems(updated);
      setNewProductModalOpen(false);
      setNewProductForm({
        name: "", description: "", barcode: "", sku: "", category: "", subcategoryId: "",
        hsnCode: "", unit: "piece", stock: "0", lowStockThreshold: "10", images: []
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
  const updateItem = (idx: number, field: keyof ItemRow, value: number | string) => {
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
    const totalQty = items.reduce((s, item) => s + (item.product || item.isNewProduct ? item.quantity : 0), 0);
    const perItemShipping = totalQty > 0 ? shippingCharges / totalQty : 0;

    setItems((prev) => {
      let changed = false;
      const next = prev.map(item => {
        if (!item.product && !item.isNewProduct) return item;
        
        const base = item.purchaseRate;
        const discAmt = (base * item.discount) / 100;
        const afterDisc = base - discAmt;
        const taxAmt = (afterDisc * item.taxRate) / 100;
        
        // Auto-calculated sales price: Purchase + Tax + Pro-rata Shipping - Discount
        const newSalesPrice = Number((afterDisc + taxAmt + perItemShipping).toFixed(2));
        
        // Only update if it's currently 0 or we want strict tracking (we will overwrite if they change cost)
        if (item.salesPrice !== newSalesPrice && (item.salesPrice === 0 || item._autoCalculated === item.salesPrice)) {
          changed = true;
          return { ...item, salesPrice: newSalesPrice, _autoCalculated: newSalesPrice };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [items, shippingCharges]);

  // Calculations
  const subtotal = items.reduce((s, item) => {
    const base = item.quantity * item.purchaseRate;
    const discAmt = (base * item.discount) / 100;
    return s + (base - discAmt);
  }, 0);

  const totalTax = items.reduce((s, item) => {
    const base = item.quantity * item.purchaseRate;
    const discAmt = (base * item.discount) / 100;
    const afterDisc = base - discAmt;
    return s + (afterDisc * item.taxRate) / 100;
  }, 0);

  const totalDiscount = items.reduce((s, item) => {
    const base = item.quantity * item.purchaseRate;
    return s + (base * item.discount) / 100;
  }, 0);

  const grandTotal = subtotal + totalTax + shippingCharges;

  // Submit
  const handleSubmit = async (status: "confirmed" | "draft") => {
    if (!supplierId) { toast.error("Select a supplier"); return; }
    
    const validItems = items.filter(i => i.product || i.productSearch.trim() !== "");
    if (validItems.length === 0) { toast.error("Please add at least one product"); return; }
    if (validItems.some((i) => !i.product)) { toast.error("Please select a valid product from the search dropdown for all item rows"); return; }
    if (validItems.some((i) => i.quantity <= 0)) { toast.error("Quantity must be > 0"); return; }

    const supplier = suppliers.find((s) => s._id === supplierId);

    try {
      setSaving(true);
      const payload = {
        supplier: supplierId,
        supplierName: supplier?.name || "",
        transporter: transporterId || undefined,
        transporterName: transporters.find((t) => t._id === transporterId)?.name || undefined,
        invoiceNumber,
        purchaseDate,
        items: validItems.map((i) => ({
          product: i.isNewProduct ? undefined : i.product!._id,
          isNewProduct: i.isNewProduct,
          newProductData: i.newProductData,
          name: i.isNewProduct ? i.newProductData.name : i.product!.name,
          sku: i.isNewProduct ? i.newProductData.sku : i.product!.sku,
          quantity: i.quantity,
          purchasePrice: i.purchaseRate,
          salesPrice: i.salesPrice, // Added
          discount: i.discount,
          discountAmount: (i.quantity * i.purchaseRate * i.discount) / 100,
          taxRate: i.taxRate,
          taxAmount:
            ((i.quantity * i.purchaseRate -
              (i.quantity * i.purchaseRate * i.discount) / 100) *
              i.taxRate) /
            100,
          total: i.total,
        })),
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        shippingCharges,
        totalAmount: grandTotal,
        amountPaid: status === "confirmed" ? grandTotal : 0,
        dueAmount: status === "confirmed" ? 0 : grandTotal,
        status,
        paymentStatus: status === "confirmed" ? "paid" : "pending",
        paymentMethod: status === "confirmed" ? paymentMethod : undefined,
        notes,
      };

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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Create Purchase Bill
          </h1>
          <p className="text-sm text-muted-foreground">Add supplier details and item entries</p>
        </div>
      </div>

      {/* Supplier Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input value={supplierPhone} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input value={supplierGst} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Supplier invoice no." />
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Transporter</Label>
              <Select value={transporterId} onValueChange={setTransporterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Transporter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {transporters.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name} {t.vehicleNumber ? `(${t.vehicleNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Item Details</CardTitle>
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1">
            <Plus className="h-4 w-4" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-48">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground w-40">Barcode / SKU</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground min-w-[200px]">Product Name</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-20">Qty</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Purchase (₹)</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Sales (₹)</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-20">Disc %</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-20">Tax %</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Total (₹)</th>
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
                      className="border-b border-border/30"
                    >
                      <td className="p-2 text-sm text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 relative">
                        <div className="relative">
                          <Input
                            value={item.product ? (item.product.barcode || item.product.sku) : item.productSearch}
                            onChange={(e) => handleProductSearch(idx, e.target.value)}
                            onFocus={() => setActiveSearchIdx(idx)}
                            placeholder="Scan..."
                            className={`h-9 text-sm font-mono ${item.productSearch && !item.product ? 'border-destructive/60 focus-visible:ring-destructive' : item.product ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                          />
                        </div>
                        {/* Product search dropdown */}
                        {activeSearchIdx === idx && item.productSearch.length > 0 && (
                          <div className="absolute z-50 left-0 w-[400px] top-full mt-1 bg-card border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {productResults.length === 0 ? (
                                <div className="p-3 text-sm text-center flex flex-col items-center justify-center gap-2">
                                  <span className="text-muted-foreground">Product not found.</span>
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setNewProductIdx(idx);
                                      setNewProductForm(prev => ({
                                        ...prev,
                                        barcode: item.productSearch,
                                        sku: `SKU-${Date.now().toString().slice(-6)}`
                                      }));
                                      setNewProductModalOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add New Product
                                  </Button>
                                </div>
                            ) : (
                              productResults.map((p) => (
                                <button
                                  key={p._id}
                                  onClick={() => selectProduct(idx, p)}
                                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors text-sm"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    {p.image ? (
                                      <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                    ) : (
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      SKU: {p.sku} {p.barcode ? `• ${p.barcode}` : ""}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <Badge variant="secondary" className="text-[10px]">{p.stock} in stock</Badge>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.product?.name || (item.isNewProduct ? item.newProductData?.name : "")}
                          readOnly
                          placeholder="Product Name"
                          className="h-9 text-sm bg-muted/20 border-transparent focus-visible:ring-0"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                          className="h-9 text-sm text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.purchaseRate}
                          onChange={(e) => updateItem(idx, "purchaseRate", +e.target.value)}
                          className="h-9 text-sm text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.salesPrice}
                          onChange={(e) => updateItem(idx, "salesPrice", +e.target.value)}
                          className="h-9 text-sm text-center"
                        />
                      </td>

                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount}
                          onChange={(e) => updateItem(idx, "discount", +e.target.value)}
                          className="h-9 text-sm text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.taxRate}
                          onChange={(e) => updateItem(idx, "taxRate", +e.target.value)}
                          className="h-9 text-sm text-center"
                        />
                      </td>
                      <td className="p-2 text-right font-semibold text-sm">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeRow(idx)}
                          disabled={items.length <= 1}
                          className="text-destructive"
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

          {/* Add row button below table */}
          <div className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1 border-dashed border-2 w-full max-w-xs">
              <Plus className="h-4 w-4" /> Add Another Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shipping Charges</Label>
                <Input
                  type="number"
                  min={0}
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(+e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this purchase..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{items.filter((i) => i.product).length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-500">
              <span>Discount</span>
              <span>- {formatCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            {shippingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(shippingCharges)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                onClick={() => handleSubmit("confirmed")}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Purchase
              </Button>
              <Button
                variant="outline"
                className="w-full"
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

      {/* New Product Modal — matches Products page */}
      <Dialog open={newProductModalOpen} onOpenChange={setNewProductModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Fill in the product details and upload images.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Images */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newProductForm.description} onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })} placeholder="Brief description" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newProductForm.category} onValueChange={(v) => setNewProductForm({ ...newProductForm, category: v, subcategoryId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={newProductForm.subcategoryId} onValueChange={(v) => setNewProductForm({ ...newProductForm, subcategoryId: v })} disabled={!newProductForm.category}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.filter(s => {
                      const pId = typeof s.parentCategoryId === 'string' ? s.parentCategoryId : (s.parentCategoryId as any)._id;
                      return pId === newProductForm.category;
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
                    {["piece", "kg", "liter", "meter", "box", "dozen"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewProductSubmit} disabled={newProductSaving} className="min-w-24">
              {newProductSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
