import { useState, useRef, useEffect } from "react";
import { Search, Loader2, CornerDownLeft, PackagePlus } from "lucide-react";
import { productService } from "@/services/productService";
import { usePOSStore } from "@/store/posStore";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export function POSProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const resultsRef = useRef<Product[]>([]);
  const highlightIdxRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { addItem, getActiveBill, updateItemProduct } = usePOSStore();

  const debouncedQuery = useDebounce(query, 250);

  // F1 shortcut + auto-focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); resultsRef.current = []; setIsOpen(false); return; }
    (async () => {
      setLoading(true);
      try {
        const { data } = await productService.getAll({ search: debouncedQuery, limit: 10 });
        setResults(data);
        resultsRef.current = data;
        setHighlightIdx(0);
        highlightIdxRef.current = 0;
        setIsOpen(true);
        // Exact barcode match → auto add
        const exact = data.find(p => p.barcode === debouncedQuery || p.sku === debouncedQuery);
        if (exact && data.length === 1) { handleAddProduct(exact); return; }
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, [debouncedQuery]);

  const handleAddProduct = async (product: Product) => {
    let price = product.salesPrice || 0;
    const taxRate = product.taxRate || 0;
    const isInclusive = (product as any).salesTaxType === "with";
    const bill = getActiveBill();
    let targetItemId: string | null = null;

    const payloadTemplate = {
      productId: product._id, product, itemCode: product.sku, itemName: product.name,
      barcode: product.barcode, unit: product.unit || "Pcs", customItem: false
    };

    try {
      const pricing = await productService.getPricing(product._id);
      price = pricing.salesPrice ?? price;
      const payload = {
        ...payloadTemplate, pricePerUnit: price, purchasePrice: pricing.purchasePrice ?? 0,
        taxPercent: pricing.taxPercent ?? taxRate, isInclusive: pricing.salesTaxType === "with"
      };
      
      const placeholderItem = bill?.items.find(i => i.itemName === "");
      if (placeholderItem) {
        updateItemProduct(placeholderItem.id, payload);
        targetItemId = placeholderItem.id;
      } else {
        addItem(payload);
      }
    } catch {
      const payload = {
        ...payloadTemplate, pricePerUnit: price, purchasePrice: (product as any).purchasePrice ?? 0,
        taxPercent: taxRate, isInclusive
      };
      const placeholderItem = bill?.items.find(i => i.itemName === "");
      if (placeholderItem) {
        updateItemProduct(placeholderItem.id, payload);
        targetItemId = placeholderItem.id;
      } else {
        addItem(payload);
      }
    }
    toast.success(`Added ${product.name}`);
    setQuery(""); setIsOpen(false); setResults([]); resultsRef.current = [];
    
    // Focus the barcode input of the active placeholder
    setTimeout(() => {
      // It's handled by POSItemTable's useEffect automatically.
      // Or we can manually blur this input so the other one takes focus.
      inputRef.current?.blur();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== "Enter") return;
    switch (e.key) {
      case "ArrowDown": 
        e.preventDefault(); 
        e.stopPropagation();
        setHighlightIdx(p => { const n = Math.min(p + 1, resultsRef.current.length - 1); highlightIdxRef.current = n; return n; }); 
        break;
      case "ArrowUp":   
        e.preventDefault(); 
        e.stopPropagation();
        setHighlightIdx(p => { const n = Math.max(p - 1, 0); highlightIdxRef.current = n; return n; }); 
        break;
      case "Enter":
        e.preventDefault();
        e.stopPropagation();
        const cur = resultsRef.current[highlightIdxRef.current];
        if (cur) {
          handleAddProduct(cur);
        } else if (query.trim()) {
          addItem({ itemName: query, customItem: true, unit: "Pcs" });
          toast.info("Blank row added"); setQuery(""); setIsOpen(false);
        }
        break;
      case "Escape": 
        setIsOpen(false); 
        break;
    }
  };

  return (
    <div className="relative z-20 shrink-0 border-b border-border/70 bg-card" ref={containerRef}>
      <div className="space-y-2 p-4">
        <h2 className="text-base font-medium text-foreground">POS Billing</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            data-barcode-input="true"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim() && results.length > 0) setIsOpen(true); }}
            placeholder="Scan barcode or search product name"
            className="h-14 w-full rounded-lg border border-border/70 bg-background pl-12 pr-20 text-base font-semibold text-foreground shadow-sm transition-all placeholder:text-muted-foreground/55 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-border/60 bg-muted/60 px-2 font-mono text-[10px] font-bold text-muted-foreground">F1</kbd>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-4 right-4 top-full z-50 overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/20">
          {/* Header row */}
          <div className="grid grid-cols-12 border-b border-border/60 bg-muted/50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="col-span-3">Barcode / SKU</div>
            <div className="col-span-4">Product Name</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-3 text-right">Sale Price</div>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {results.length > 0 ? results.map((p, i) => (
              <div
                key={p._id}
                onClick={() => handleAddProduct(p)}
                onMouseEnter={() => { setHighlightIdx(i); highlightIdxRef.current = i; }}
                className={cn(
                  "grid cursor-pointer grid-cols-12 items-center border-b border-border/20 px-4 py-3 transition-colors last:border-0",
                  i === highlightIdx ? "bg-primary/10 text-primary" : "hover:bg-muted/40"
                )}
              >
                <div className="col-span-3 text-sm font-mono font-semibold truncate">{p.barcode || p.sku}</div>
                <div className="col-span-4 text-sm font-medium truncate">{p.name}</div>
                <div className="col-span-2 text-center text-sm">
                  <span className={cn("font-bold", (p.stock || 0) <= 0 ? "text-destructive" : "text-emerald-500")}>
                    {p.stock || 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">{p.unit || "Pcs"}</span>
                </div>
                <div className="col-span-3 text-right text-sm font-bold">{formatCurrency(p.salesPrice || 0)}</div>
              </div>
            )) : (
              <div className="space-y-3 p-6 text-center">
                <p className="text-sm font-semibold text-foreground">No product found</p>
                <p className="text-xs text-muted-foreground">No match for "<strong>{query}</strong>"</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      addItem({ itemName: query, customItem: true, unit: "Pcs" });
                      toast.info("Blank row added"); setQuery(""); setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <CornerDownLeft className="h-4 w-4" /> Add Blank Row
                  </button>
                  <span className="text-muted-foreground/40">|</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle "Add New Product" - could open a modal or redirect
                      // For now, just add a blank row with the search query as name
                      addItem({ itemName: query || "New Product", customItem: true, unit: "Pcs" });
                      toast.info("Blank row added"); 
                      setQuery(""); 
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:underline"
                  >
                    <PackagePlus className="h-4 w-4" /> Add New Product
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
