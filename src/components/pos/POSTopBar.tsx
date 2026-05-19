import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, X, Plus, Search, Loader2, CornerDownLeft, PackagePlus, ScanBarcode } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { productService } from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/types";
import { toast } from "sonner";
import { SimpleProductModal } from "@/components/shared/SimpleProductModal";

export function POSTopBar() {
  const { bills, activeBillId, setActiveBill, createNewBill, closeBill, addItem } = usePOSStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(0);
  const [showProductModal, setShowProductModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(query, 250);

  // Barcode scanner hook
  useBarcodeScanner({
    onScan: async (barcode) => {
      try {
        const { data } = await productService.getAll({ search: barcode, limit: 1 });
        const match = data.find(p => p.barcode === barcode || p.sku === barcode);
        if (match) {
          handleAdd(match);
          toast.success(`Scanned: ${match.name}`);
        } else {
          toast.error("Product not found for barcode: " + barcode);
          setScannedBarcode(barcode);
          setShowProductModal(true);
        }
      } catch {
        toast.error("Failed to lookup barcode");
      }
    },
    onError: (err) => toast.error(err)
  });

  // F1 to focus search, auto-focus on mount
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); inputRef.current?.focus(); }
      if (e.ctrlKey && e.key === "t") { e.preventDefault(); createNewBill(); }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        if (activeBillId) closeBill(activeBillId);
      }
    };
    window.addEventListener("keydown", h);
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => window.removeEventListener("keydown", h);
  }, [activeBillId]);

  // Click outside to close dropdown
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Search products
  useEffect(() => {
    if (!debouncedQ.trim()) { setResults([]); setIsOpen(false); return; }
    (async () => {
      setLoading(true);
      try {
        const { data } = await productService.getAll({ search: debouncedQ, limit: 8 });
        setResults(data); setHlIdx(0); setIsOpen(true);
        const exact = data.find(p => p.barcode === debouncedQ || p.sku === debouncedQ);
        if (exact && data.length === 1) { handleAdd(exact); return; }
      } catch {} finally { setLoading(false); }
    })();
  }, [debouncedQ]);

  const handleAdd = async (product: Product) => {
    let price = product.salesPrice || 0;
    const tax = product.taxRate || 0;
    const incl = (product as any).salesTaxType === "with";
    try {
      const p = await productService.getPricing(product._id);
      addItem({
        productId: product._id, product, itemCode: product.sku, itemName: product.name,
        barcode: product.barcode, pricePerUnit: p.salesPrice ?? price,
        purchasePrice: p.purchasePrice ?? 0, taxPercent: p.taxPercent ?? tax,
        unit: product.unit || "Pcs", isInclusive: p.salesTaxType === "with",
      });
    } catch {
      addItem({
        productId: product._id, product, itemCode: product.sku, itemName: product.name,
        barcode: product.barcode, pricePerUnit: price, purchasePrice: 0,
        taxPercent: tax, unit: product.unit || "Pcs", isInclusive: incl,
      });
    }
    setQuery(""); setIsOpen(false); inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== "Enter") return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHlIdx(p => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHlIdx(p => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (results[hlIdx]) handleAdd(results[hlIdx]);
      else if (query.trim()) {
        addItem({ itemName: query, customItem: true, unit: "Pcs" });
        toast.info("Blank row added"); setQuery(""); setIsOpen(false);
      }
    } else if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <div className="shrink-0 bg-card border-b border-border flex flex-col relative" ref={ddRef}>
      {/* Row 1: Tabs + Search + Icons */}
      <div className="flex flex-col lg:flex-row lg:items-center py-2 lg:py-0 px-3 gap-2 lg:h-14">
        {/* Bill Tabs */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
          {/* Exit POS / Go to Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-black border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 mr-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit POS</span>
          </Link>
          {bills.map((bill) => {
            const active = bill.id === activeBillId;
            return (
              <button
                key={bill.id}
                onClick={() => setActiveBill(bill.id)}
                className={cn(
                  "group flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>#{bill.billNo}</span>
                {active && <span className="text-[9px] opacity-70 font-mono hidden sm:inline">CTRL+W</span>}
                {bills.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }}
                    className={cn(
                      "rounded-full p-0.5 transition-all",
                      active ? "hover:bg-white/20" : "opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={createNewBill}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New Bill
            <span className="text-[9px] opacity-70 font-mono ml-0.5 hidden sm:inline">Ctrl+T</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 w-full relative lg:ml-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim() && results.length > 0) setIsOpen(true); }}
            placeholder="Scan or search by item code, model no or item name"
            className="w-full h-10 pl-11 pr-24 bg-muted/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ScanBarcode className="h-4 w-4 text-muted-foreground opacity-60" />
            )}
            <kbd className="h-5 px-1.5 rounded border border-border/60 bg-muted/60 font-mono text-[10px] font-bold text-muted-foreground hidden sm:inline-flex items-center">F1</kbd>
          </div>
        </div>

        {/* Right icons removed per request */}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-3 z-50 bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border/50 bg-muted/40 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            <div className="col-span-3">Item Code</div>
            <div className="col-span-4">Item Name</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-3 text-right">Sale Price (₹)</div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {results.length > 0 ? results.map((p, i) => (
              <div
                key={p._id}
                onClick={() => handleAdd(p)}
                onMouseEnter={() => setHlIdx(i)}
                className={cn(
                  "grid grid-cols-12 px-4 py-3 cursor-pointer items-center border-b border-border/10 last:border-0 transition-colors",
                  i === hlIdx ? "bg-primary/10" : "hover:bg-muted/40"
                )}
              >
                <div className="col-span-3 text-sm font-mono font-semibold truncate">{p.barcode || p.sku}</div>
                <div className="col-span-4 text-sm font-medium truncate">{p.name}</div>
                <div className="col-span-2 text-center text-sm">
                  <span className={cn("font-bold", (p.stock || 0) <= 0 ? "text-destructive" : "text-emerald-500")}>{p.stock || 0}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{p.unit || "Pcs"}</span>
                </div>
                <div className="col-span-3 text-right text-sm font-bold">{formatCurrency(p.salesPrice || 0)}</div>
              </div>
            )) : (
              <div className="p-5 text-center space-y-3">
                <p className="text-sm text-muted-foreground">No product found for "<strong>{query}</strong>"</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => { addItem({ itemName: query, customItem: true, unit: "Pcs" }); toast.info("Blank row added"); setQuery(""); setIsOpen(false); }}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <CornerDownLeft className="h-4 w-4" /> Add Blank Row
                  </button>
                  <span className="text-muted-foreground/30">|</span>
                  <button onClick={() => { setScannedBarcode(query); setShowProductModal(true); setIsOpen(false); }} className="flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:underline">
                    <PackagePlus className="h-4 w-4" /> Add New Product
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Modal */}
      <SimpleProductModal 
        open={showProductModal} 
        onOpenChange={setShowProductModal}
        initialBarcode={scannedBarcode}
        initialSku={scannedBarcode.length > 5 ? `SKU-${scannedBarcode.slice(-4)}` : undefined}
        onSuccess={(product) => {
          handleAdd(product);
          toast.success("Product created and added to cart!");
        }}
      />
    </div>
  );
}
