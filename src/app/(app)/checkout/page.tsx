"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, ArrowLeft, Trash2, Minus, Plus, Monitor, 
  Banknote, CreditCard, Smartphone, Receipt, Loader2, Check, UserPlus 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { customerService } from "@/services/customerService";
import { saleService } from "@/services/saleService";
import type { Customer, Sale } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [processing, setProcessing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => {
    // If cart is empty, redirect back to POS
    if (cart.items.length === 0 && !receiptOpen) {
      router.push("/pos");
    }
    
    // Load customers
    customerService.getAll({ limit: 100 })
      .then(res => setCustomers(res.data))
      .catch(() => {});
  }, [cart.items.length, receiptOpen, router]);

  const handleCompleteSale = async () => {
    if (cart.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    try {
      setProcessing(true);
      const payload = {
        items: cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        customer: cart.customer?._id,
        customerName: cart.customer?.name || "Walk-in Customer",
        subtotal: cart.subtotal,
        taxRate: cart.taxRate,
        taxAmount: cart.taxAmount,
        discountType: cart.discountType,
        discountValue: cart.discountValue,
        discountAmount: cart.discountAmount,
        totalAmount: cart.totalAmount,
        paymentMethod: cart.paymentMethod,
        paymentStatus: "paid",
        amountPaid: cart.amountPaid || cart.totalAmount,
        changeAmount: cart.changeAmount,
        notes: cart.notes,
      };

      const sale = await saleService.create(payload);
      setLastSale(sale);
      setReceiptOpen(true);
      toast.success("Sale completed!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Sale failed");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    cart.clearCart();
    setReceiptOpen(false);
    router.push("/pos");
  };

  if (cart.items.length === 0 && !receiptOpen) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pos")} className="h-10 w-10 bg-card border shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground text-sm">Review your cart and process payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT SIDE: CART ITEMS */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart Items
              </h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {cart.items.length} items
              </span>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.div
                    key={item.product._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-muted/20 items-center sm:items-start"
                  >
                    <div className="h-20 w-20 rounded-xl bg-card border overflow-hidden shrink-0">
                      {item.product.image || (item.product.images && item.product.images.length > 0) ? (
                        <img src={item.product.images?.[0] || item.product.image} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Monitor className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col w-full">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-base line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {item.product.sku}</p>
                        </div>
                        <p className="font-bold whitespace-nowrap">{formatCurrency(item.total)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-4">
                        <p className="text-sm text-muted-foreground font-medium">
                          {formatCurrency(item.unitPrice)} / {item.product.unit}
                        </p>
                        <div className="flex items-center gap-1 bg-card rounded-lg p-1 border shadow-sm">
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-md hover:bg-muted" onClick={() => cart.updateQuantity(item.product._id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-md hover:bg-muted" onClick={() => {
                              if (item.quantity >= item.product.stock) {
                                toast.error("Max stock reached"); return;
                              }
                              cart.updateQuantity(item.product._id, item.quantity + 1);
                            }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => cart.removeItem(item.product._id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: CHECKOUT FORM */}
        <div className="space-y-6 sticky top-6">
          <div className="bg-card rounded-2xl border shadow-xl shadow-primary/5 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Customer */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Customer</Label>
                <Select
                  value={cart.customer?._id || "walk-in"}
                  onValueChange={(v) => {
                    if (v === "walk-in") { cart.setCustomer(null); return; }
                    const c = customers.find((c) => c._id === v);
                    if (c) cart.setCustomer(c);
                  }}
                >
                  <SelectTrigger className="h-12 bg-muted/50 border-transparent hover:border-border transition-colors">
                    <UserPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name} — {c.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Tax %</Label>
                  <Input type="number" value={cart.taxRate} onChange={(e) => cart.setTaxRate(Number(e.target.value))} className="h-12 bg-muted/50 border-transparent hover:border-border transition-colors" min={0} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Discount</Label>
                  <div className="flex gap-1">
                    <Select value={cart.discountType} onValueChange={(v) => cart.setDiscount(v as "percentage" | "fixed", cart.discountValue)}>
                      <SelectTrigger className="h-12 w-16 px-2 bg-muted/50 border-transparent"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">₹</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={cart.discountValue} onChange={(e) => cart.setDiscount(cart.discountType, Number(e.target.value))} className="h-12 flex-1 bg-muted/50 border-transparent hover:border-border transition-colors" min={0} />
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-semibold">-{formatCurrency(cart.discountAmount)}</span>
                  </div>
                )}
                {cart.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Tax ({cart.taxRate}%)</span>
                    <span className="font-semibold">{formatCurrency(cart.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-xl pt-4 border-t border-border/50 mt-2">
                  <span>Grand Total</span>
                  <span className="text-primary text-2xl">{formatCurrency(cart.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Payment Method</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "cash" as const, icon: Banknote, label: "Cash" },
                    { value: "card" as const, icon: CreditCard, label: "Card" },
                    { value: "upi" as const, icon: Smartphone, label: "UPI" },
                  ].map((pm) => (
                    <Button
                      key={pm.value}
                      variant={cart.paymentMethod === pm.value ? "default" : "outline"}
                      className={`h-16 flex-col gap-1.5 px-0 rounded-xl transition-all ${cart.paymentMethod !== pm.value && 'bg-card'}`}
                      onClick={() => cart.setPaymentMethod(pm.value)}
                    >

                      <pm.icon className="h-5 w-5" />
                      <span className="text-[11px] font-semibold">{pm.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amount Received (Cash) */}
              {cart.paymentMethod === "cash" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Amount Received</Label>
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <Input type="number" value={cart.amountPaid || ""} onChange={(e) => cart.setAmountPaid(Number(e.target.value))} className="h-14 pl-8 text-xl font-bold bg-muted/50 border-transparent hover:border-border transition-colors" placeholder={cart.totalAmount.toFixed(2)} />
                    </div>
                  </div>
                  {cart.changeAmount > 0 && (
                    <div className="bg-emerald-500/10 text-emerald-600 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-500/20 text-center mt-3">
                      Return Change: {formatCurrency(cart.changeAmount)}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            
            <div className="p-6 border-t bg-muted/10">
              <Button
                className="w-full h-16 text-xl font-bold shadow-2xl shadow-primary/20 rounded-xl"
                onClick={handleCompleteSale}
                disabled={processing}
              >
                {processing ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Check className="h-6 w-6 mr-2" />}
                {processing ? "Processing..." : `Pay ${formatCurrency(cart.totalAmount)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={(open) => {
        if (!open) handleNewSale();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-primary">
              <Receipt className="h-6 w-6" />
              Sale Completed Successfully
            </DialogTitle>
            <DialogDescription>Invoice #{lastSale?.invoiceNumber}</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-5" id="receipt-content">
              <div className="text-center border-b pb-5">
                <h3 className="font-bold text-2xl tracking-tight">POS ERP</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Tax Invoice</p>
                <p className="text-sm font-mono mt-2 bg-muted inline-block px-3 py-1 rounded-full">{lastSale.invoiceNumber}</p>
              </div>
              <div className="text-sm space-y-1.5 px-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{lastSale.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(lastSale.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode:</span> <span className="font-medium uppercase">{lastSale.paymentMethod}</span></div>
              </div>
              <div className="border-t border-b py-4 space-y-3 px-2">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium">{item.name} <span className="text-muted-foreground text-xs ml-1">× {item.quantity}</span></span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm px-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(lastSale.subtotal)}</span>
                </div>
                {lastSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(lastSale.discountAmount)}</span>
                  </div>
                )}
                {lastSale.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(lastSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t mt-2">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatCurrency(lastSale.totalAmount)}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 h-12" onClick={handlePrint}>
                  <Receipt className="h-4 w-4 mr-2" /> Print Receipt
                </Button>
                <Button className="flex-1 h-12" onClick={handleNewSale}>
                  Start New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
