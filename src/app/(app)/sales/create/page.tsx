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
import { Badge } from "@/components/ui/badge";
import { customerService } from "@/services/customerService";
import { productService } from "@/services/productService";
import { saleService } from "@/services/saleService";
import { formatCurrency } from "@/lib/utils";
import type { Customer, Product } from "@/types";

// ---------- Item Row Type ----------
interface ItemRow {
  id: string;
  product: Product | null;
  productSearch: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

const newItem = (): ItemRow => ({
  id: crypto.randomUUID(),
  product: null,
  productSearch: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 0,
  total: 0,
});

const calcItemTotal = (item: ItemRow) => {
  const base = item.quantity * item.unitPrice;
  const discAmt = (base * item.discount) / 100;
  const afterDisc = base - discAmt;
  const taxAmt = (afterDisc * item.taxRate) / 100;
  return afterDisc + taxAmt;
};

// ---------- Component ----------
export default function CreateSalePage() {
  const router = useRouter();

  // Master data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shippingCharges, setShippingCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [saving, setSaving] = useState(false);

  // Load master data
  useEffect(() => {
    customerService.getAll({ limit: 200 }).then((r) => setCustomers(r.data)).catch(() => {});
    productService.getAll({ limit: 500 }).then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  // On customer select
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const s = customers.find((x) => x._id === id);
    if (s) {
      setCustomerPhone(s.phone);
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
      unitPrice: product.sellingPrice || 0,
      taxRate: 0,
      total: (product.sellingPrice || 0) * updated[idx].quantity,
    };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);
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

  // Calculations
  const subtotal = items.reduce((s, item) => {
    const base = item.quantity * item.unitPrice;
    const discAmt = (base * item.discount) / 100;
    return s + (base - discAmt);
  }, 0);

  const totalTax = items.reduce((s, item) => {
    const base = item.quantity * item.unitPrice;
    const discAmt = (base * item.discount) / 100;
    const afterDisc = base - discAmt;
    return s + (afterDisc * item.taxRate) / 100;
  }, 0);

  const totalDiscount = items.reduce((s, item) => {
    const base = item.quantity * item.unitPrice;
    return s + (base * item.discount) / 100;
  }, 0);

  const grandTotal = subtotal + totalTax;

  // Submit
  const handleSubmit = async (status: "completed") => {
    if (!customerId) { toast.error("Select a customer"); return; }
    
    const validItems = items.filter(i => i.product || i.productSearch.trim() !== "");
    if (validItems.length === 0) { toast.error("Please add at least one product"); return; }
    if (validItems.some((i) => !i.product)) { toast.error("Please select a valid product from the search dropdown for all item rows"); return; }
    if (validItems.some((i) => i.quantity <= 0)) { toast.error("Quantity must be > 0"); return; }

    const customer = customers.find((s) => s._id === customerId);

    try {
      setSaving(true);
      const payload = {
        customer: customerId,
        customerName: customer?.name || "",
        invoiceNumber,
        saleDate,
        items: validItems.map((i) => ({
          product: i.product!._id,
          name: i.product!.name,
          sku: i.product!.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
        subtotal,
        taxAmount: totalTax,
        discountType: "percentage",
        discountValue: 0,
        discountAmount: totalDiscount,
        totalAmount: grandTotal,
        amountPaid: status === "completed" ? grandTotal : 0,
        changeAmount: 0,
        status,
        paymentStatus: status === "completed" ? "paid" : "pending",
        paymentMethod: status === "completed" ? paymentMethod : undefined,
        notes,
      };

      await saleService.create(payload);
      toast.success("Sale created! Stock updated automatically.");
      
      router.push("/sales");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create sale");
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
            Create Sale Bill
          </h1>
          <p className="text-sm text-muted-foreground">Add customer details and item entries</p>
        </div>
      </div>

      {/* Customer Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input value={customerPhone} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label>Sale Date</Label>
              <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
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
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Rate (₹)</th>
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
                              <div className="p-3 text-sm text-center text-muted-foreground">
                                No products found. <br/>
                                <span className="text-xs">Add products in Masters first.</span>
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
                                    <p className="text-xs font-medium">{formatCurrency(p.sellingPrice || 0)}</p>
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
                          value={item.product?.name || ""}
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
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", +e.target.value)}
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
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this sale..."
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
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                onClick={() => handleSubmit("completed")}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
