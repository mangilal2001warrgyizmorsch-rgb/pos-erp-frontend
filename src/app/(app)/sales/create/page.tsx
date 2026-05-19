"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, ArrowLeft, Plus, Trash2, Loader2, Save, Search, Package, Calendar
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { customerService } from "@/services/customerService";
import { productService } from "@/services/productService";
import { saleService } from "@/services/saleService";
import { cashBankService } from "@/services/cashBankService";
import { formatCurrency, cn } from "@/lib/utils";
import axios from "axios";
import type { Customer, Product, Sale } from "@/types";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";

// ---------- Item Row Type ----------
interface ItemRow {
  id: string;
  product: Product | null;
  productSearch: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number; // Added
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
  purchasePrice: 0,
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
  const [customerId, setCustomerId] = useState("walk-in");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shippingCharges, setShippingCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [roundOff, setRoundOff] = useState(false);
  const [amountReceived, setAmountReceived] = useState(0);
  const [isFullyReceived, setIsFullyReceived] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Printing state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Load master data
  useEffect(() => {
    customerService.getAll({ limit: 200 }).then((r) => {
      setCustomers(r.data);
      // Auto-select walk-in customer if found
      const walkIn = r.data.find((c: Customer) => 
        c.name.toLowerCase().includes("walk-in") || 
        c.name.toLowerCase().includes("cash") ||
        c.name.toLowerCase().includes("guest") ||
        c.name.toLowerCase().includes("retail") ||
        c.name.toLowerCase().includes("pos") ||
        c.name.toLowerCase().includes("counter")
      );
      if (walkIn) {
        setCustomerId(walkIn._id);
        setCustomerPhone(walkIn.phone || "");
      }
    }).catch(() => {});
    productService.getAll({ limit: 500 }).then((r) => setProducts(r.data)).catch(() => {});
    cashBankService.getAccounts()
      .then(res => {
        if (res.success && res.data) {
          setBankAccounts(res.data.filter((a: any) => a.accountType === "bank" && a.status === "active"));
        }
      })
      .catch(err => console.error("Failed to load bank accounts:", err));
  }, []);

  const handlePaymentMethodChange = (val: string) => {
    setPaymentMethod(val);
    if (val !== "cash") {
      const defaultBank = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
      if (defaultBank && !cashBankAccountId) {
        setCashBankAccountId(defaultBank._id);
      }
    } else {
      setCashBankAccountId("");
    }
  };

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
  const selectProduct = async (idx: number, product: Product) => {
    // Optimistically populate from product master data immediately
    const updated = [...items];
    const p = product as any;
    
    // Determine base unit price based on tax type (inclusive vs exclusive)
    let basePrice = p.salesPrice || 0;
    const taxRate = p.taxRate || 0;
    
    if (p.salesTaxType === "with" && taxRate > 0) {
      // Back-calculate base price: Price / (1 + Rate/100)
      basePrice = basePrice / (1 + taxRate / 100);
    }

    updated[idx] = {
      ...updated[idx],
      product,
      productSearch: product.name,
      unitPrice: basePrice,
      purchasePrice: p.purchasePrice || 0,
      taxRate: taxRate,
    };
    updated[idx].total = calcItemTotal(updated[idx]);
    setItems(updated);
    setProductResults([]);
    setActiveSearchIdx(null);

    // Then try to fetch batch-level pricing (FIFO/latest) and update if available
    try {
      const pricing = await productService.getPricing(product._id);
      setItems((prev) => {
        const next = [...prev];
        // Only update if this row still holds the same product
        if (next[idx]?.product?._id !== product._id) return prev;
        
        let batchUnitPrice = pricing.salesPrice ?? next[idx].unitPrice;
        const batchTaxRate = pricing.taxPercent ?? next[idx].taxRate;
        
        // If batch pricing is inclusive, handle it
        if (pricing.salesTaxType === "with" && batchTaxRate > 0) {
          batchUnitPrice = batchUnitPrice / (1 + batchTaxRate / 100);
        }

        next[idx] = {
          ...next[idx],
          unitPrice: batchUnitPrice,
          purchasePrice: pricing.purchasePrice ?? next[idx].purchasePrice,
          taxRate: batchTaxRate,
        };
        next[idx].total = calcItemTotal(next[idx]);
        return next;
      });
    } catch {
      // No stock batch found — product master prices already applied above.
      // Only warn if there really is no price at all.
      if (!(product as any).salesPrice) {
        toast.warning(`No batch pricing found for "${product.name}". Please enter the rate manually.`);
      }
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
  const finalTotal = roundOff ? Math.round(grandTotal) : grandTotal;
  const roundOffValue = finalTotal - grandTotal;
  const balance = finalTotal - (isFullyReceived ? finalTotal : amountReceived);

  // Submit
  const handleSubmit = async (status: "completed") => {
    let finalCustomerId = customerId;
    const currentCustomer = customers.find(c => c._id === customerId);
    let finalCustomerName = currentCustomer?.name || "Walk-in Customer";

    // If it's still the default string, try to resolve to a real ID
    if (finalCustomerId === "walk-in") {
      const walkIn = customers.find((c) => 
        c.name.toLowerCase().includes("walk-in") || 
        c.name.toLowerCase().includes("cash") ||
        c.name.toLowerCase().includes("guest") ||
        c.name.toLowerCase().includes("retail") ||
        c.name.toLowerCase().includes("pos") ||
        c.name.toLowerCase().includes("counter")
      );
      
      if (walkIn) {
        finalCustomerId = walkIn._id;
        finalCustomerName = walkIn.name;
      } else {
        // Auto-create walk-in customer if totally missing
        try {
          const newWalkIn = await customerService.create({
            name: "Walk-in Customer",
            phone: "0000000000",
            isActive: true
          });
          finalCustomerId = newWalkIn._id;
          finalCustomerName = newWalkIn.name;
          // Update local state to avoid repeat creation
          setCustomers(prev => [...prev, newWalkIn]);
        } catch {
          toast.error("Please create a 'Walk-in Customer' manually in the Parties section first.");
          return;
        }
      }
    }
    
    const validItems = items.filter(i => i.product || i.productSearch.trim() !== "");
    if (validItems.length === 0) { toast.error("Please add at least one product"); return; }
    if (validItems.some((i) => !i.product)) { toast.error("Please select a valid product from the search dropdown for all item rows"); return; }
    if (validItems.some((i) => i.quantity <= 0)) { toast.error("Quantity must be > 0"); return; }

    const customer = customers.find((s) => s._id === customerId);

    try {
      setSaving(true);
      const payload = {
        customer: finalCustomerId,
        customerName: finalCustomerName,
        invoiceNumber,
        saleDate,
        items: validItems.map((i) => ({
          product: i.product!._id,
          name: i.product!.name,
          sku: i.product!.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          purchasePrice: i.purchasePrice,
          total: i.total,
        })),
        subtotal,
        taxAmount: totalTax,
        discountType: "percentage",
        discountValue: 0,
        discountAmount: totalDiscount,
        totalAmount: finalTotal,
        amountPaid: status === "completed" ? (isFullyReceived ? finalTotal : amountReceived) : 0,
        changeAmount: 0,
        status,
        paymentStatus: status === "completed" ? "paid" : "pending",
        paymentMethod: status === "completed" ? paymentMethod : undefined,
        cashBankAccountId: (status === "completed" && paymentMethod !== "cash") ? cashBankAccountId : undefined,
        notes,
      };

      const response = await saleService.create(payload);
      toast.success("Sale created successfully!");
      
      // Open Print Dialog
      setLastSale(response as unknown as Sale);
      setPrintDialogOpen(true);
      
      // Reset form instead of redirecting immediately
      setItems([newItem()]);
      setCustomerId("walk-in");
      setPaymentMethod("cash");
      setNotes("");
      setAmountReceived(0);
      setIsFullyReceived(true);
      setInvoiceNumber(""); // Clear for auto-gen
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
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.filter(s => s.name.toLowerCase() !== "walk-in").map((s) => (
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
              <div className="relative group">
                <Input 
                  type="date" 
                  value={saleDate} 
                  onChange={(e) => setSaleDate(e.target.value)} 
                  className="h-10 rounded-xl bg-muted/30 border-border pr-10 appearance-none custom-date-input"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
              </div>
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
                <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
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

            {paymentMethod !== "cash" && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label>Collect in Bank Account *</Label>
                <Select value={cashBankAccountId} onValueChange={setCashBankAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.accountName} {account.bankName ? `(${account.bankName})` : ""} - ₹{account.currentBalance.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 items-center">
              {/* Round Off */}
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="round-off" 
                  checked={roundOff} 
                  onCheckedChange={(v) => setRoundOff(!!v)}
                  className="h-5 w-5 rounded border-border data-[state=checked]:bg-primary"
                />
                <Label htmlFor="round-off" className="text-sm font-medium text-muted-foreground">Round Off</Label>
              </div>
              <Input 
                readOnly 
                value={roundOffValue.toFixed(2)} 
                className="h-10 text-right bg-muted/20 border-border font-medium rounded-lg" 
              />

              {/* Total */}
              <Label className="text-sm font-bold text-muted-foreground">Total Amount</Label>
              <Input 
                readOnly 
                value={finalTotal.toFixed(2)} 
                className="h-11 text-right bg-muted/30 border-border font-bold text-lg text-primary rounded-lg" 
              />

              {/* Received */}
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="received" 
                  checked={isFullyReceived} 
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setIsFullyReceived(isChecked);
                    if (isChecked) {
                      setAmountReceived(finalTotal);
                    }
                  }}
                  className="h-5 w-5 rounded border-border data-[state=checked]:bg-primary"
                />
                <Label htmlFor="received" className="text-sm font-medium text-muted-foreground cursor-pointer">Received</Label>
              </div>
              <Input 
                type="number"
                value={isFullyReceived ? finalTotal.toFixed(2) : amountReceived}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAmountReceived(val);
                  if (val !== parseFloat(finalTotal.toFixed(2))) {
                    setIsFullyReceived(false);
                  }
                }}
                className="h-10 text-right bg-muted/20 border-border font-medium rounded-lg" 
              />
            </div>

            <Separator className="bg-border/50" />

            <div className="flex justify-between items-center px-2">
              <span className="text-base font-bold text-foreground">Balance</span>
              <span className={cn("text-xl font-bold", balance > 0 ? "text-destructive" : "text-emerald-500")}>
                {formatCurrency(balance)}
              </span>
            </div>

            <div className="pt-4">
              <Button
                className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl active:scale-95 transition-all"
                onClick={() => handleSubmit("completed")}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Print (F5)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        .custom-date-input::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
      <PrintSaleDialog 
        open={printDialogOpen} 
        onOpenChange={setPrintDialogOpen} 
        sale={lastSale} 
      />
    </div>
  );
}
