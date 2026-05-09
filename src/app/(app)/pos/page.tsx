"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, Search, ShoppingCart, Plus, Minus, Trash2, X,
  Banknote, CreditCard, Smartphone, Receipt, Loader2, Check, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { productService } from "@/services/productService";
import { customerService } from "@/services/customerService";
import { saleService } from "@/services/saleService";
import { categoryService } from "@/services/categoryService";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category, Customer, Sale } from "@/types";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  const cart = useCartStore();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 100, search };
      if (catFilter !== "all") params.category = catFilter;
      const result = await productService.getAll(
        params as Parameters<typeof productService.getAll>[0]
      );
      setProducts(result.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch { /* silent */ }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await customerService.getAll({ limit: 100 });
      setCustomers(result.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCategories(); loadCustomers(); }, [loadCategories, loadCustomers]);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    const existing = cart.items.find((i) => i.product._id === product._id);
    if (existing && existing.quantity >= product.stock) {
      toast.error(`Only ${product.stock} available`);
      return;
    }
    cart.addItem(product);
    setCartOpen(true);
    toast.success(`Added ${product.name}`, { duration: 1000 });
  };

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
      setCartOpen(false);
      cart.clearCart();
      loadProducts();
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

  return (
    <div className="relative flex flex-col h-[calc(100vh-7rem)] no-print">
      {/* Search and Filter Header */}
      <div className="flex flex-col gap-4 mb-4 shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, barcode or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/50 shadow-sm"
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={catFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCatFilter("all")}
            className="shrink-0 rounded-full px-5"
          >
            All Products
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat._id}
              variant={catFilter === cat._id ? "default" : "outline"}
              size="sm"
              onClick={() => setCatFilter(cat._id)}
              className="shrink-0 rounded-full px-5"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20">
            <Monitor className="h-12 w-12 mb-4 opacity-20" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
                  {(product.images && product.images.length > 0) ? (
                    product.images.length === 1 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                        {product.images.map((img, idx) => (
                          <motion.img
                            key={idx}
                            src={img}
                            alt={product.name}
                            className="absolute inset-0 object-cover w-full h-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatType: "reverse",
                              repeatDelay: product.images!.length * 2,
                              delay: idx * 2
                            }}
                            style={{ zIndex: product.images!.length - idx }}
                          />
                        ))}
                      </div>
                    )
                  ) : product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/30">
                      <Monitor className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <Badge variant={product.stock === 0 ? "destructive" : "secondary"} className="bg-background/90 backdrop-blur-sm text-[10px]">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={product.name}>
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="text-lg font-bold text-primary mb-2">
                    {formatCurrency(product.sellingPrice)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 font-mono">
                    <span>SKU: {product.sku}</span>
                    {product.hsnCode && <span>• HSN: {product.hsnCode}</span>}
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description}</p>
                  )}
                  
                  <div className="mt-auto pt-3">
                    <Button 
                      className="w-full gap-2 rounded-xl transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md" 
                      variant="secondary"
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      <Plus className="h-4 w-4" /> Add to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating View Cart Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button 
          size="lg" 
          onClick={() => setCartOpen(true)}
          className="rounded-full h-14 px-6 shadow-2xl shadow-primary/30 flex items-center gap-3"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.items.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {cart.items.length}
              </span>
            )}
          </div>
          <span className="font-semibold text-base">View Cart</span>
          {cart.items.length > 0 && (
            <span className="ml-2 font-mono bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {formatCurrency(cart.totalAmount)}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Slide Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l shadow-2xl">
          {/* Cart header */}
          <SheetHeader className="p-4 border-b bg-muted/30 text-left">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Your Cart
              <Badge variant="secondary" className="ml-2">{cart.items.length} items</Badge>
            </SheetTitle>
          </SheetHeader>

          {/* Customer select moved to checkout */}

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            <AnimatePresence>
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-10 w-10 opacity-30" />
                  </div>
                  <p className="font-medium text-foreground">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some products to get started</p>
                  <Button variant="outline" className="mt-6" onClick={() => setCartOpen(false)}>
                    Browse Products
                  </Button>
                </div>
              ) : (
                cart.items.map((item) => (
                  <motion.div
                    key={item.product._id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 p-3 rounded-2xl bg-card border shadow-sm"
                  >
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0">
                      {item.product.image ? (
                        <img src={item.product.image} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Monitor className="h-6 w-6 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium line-clamp-2 leading-tight pr-2">{item.product.name}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 -mt-1 text-muted-foreground hover:text-destructive" onClick={() => cart.removeItem(item.product._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {formatCurrency(item.unitPrice)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 border">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={() => cart.updateQuantity(item.product._id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={() => {
                              if (item.quantity >= item.product.stock) {
                                toast.error("Max stock reached"); return;
                              }
                              cart.updateQuantity(item.product._id, item.quantity + 1);
                            }}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Cart summary */}
          {cart.items.length > 0 && (
            <div className="border-t p-5 bg-card shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] space-y-4">
              <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="text-muted-foreground font-medium">Subtotal ({cart.items.length} items)</span>
                <span className="font-bold text-xl">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-14 px-4 text-destructive hover:bg-destructive hover:text-white transition-colors" onClick={cart.clearCart}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1 h-14 text-lg font-bold shadow-xl shadow-primary/20"
                  onClick={() => { setCartOpen(false); router.push('/checkout'); }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Sale Complete
            </DialogTitle>
            <DialogDescription>Invoice #{lastSale?.invoiceNumber}</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4" id="receipt-content">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">POS ERP</h3>
                <p className="text-xs text-muted-foreground">Tax Invoice</p>
                <p className="text-sm font-mono mt-1">{lastSale.invoiceNumber}</p>
              </div>
              <div className="text-sm space-y-1">
                <p>Customer: {lastSale.customerName}</p>
                <p>Date: {new Date(lastSale.createdAt).toLocaleString()}</p>
                <p>Payment: {lastSale.paymentMethod.toUpperCase()}</p>
              </div>
              <div className="border-t border-b py-3 space-y-2">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.subtotal)}</span>
                </div>
                {lastSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastSale.discountAmount)}</span>
                  </div>
                )}
                {lastSale.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(lastSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(lastSale.totalAmount)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  <Receipt className="h-4 w-4 mr-2" />Print
                </Button>
                <Button className="flex-1" onClick={() => setReceiptOpen(false)}>
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
