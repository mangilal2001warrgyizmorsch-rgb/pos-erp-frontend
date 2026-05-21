import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePOSStore, type POSItem } from "@/store/posStore";
import { formatCurrency, cn } from "@/lib/utils";
import { Trash2, Loader2, CornerDownLeft, PackagePlus, ScanBarcode } from "lucide-react";
import { ModifyItemModal } from "./ModifyItemModal";
import { productService } from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import type { Product } from "@/types";
import { toast } from "sonner";
import { SimpleProductModal } from "@/components/shared/SimpleProductModal";


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


export function POSItemTable() {

  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const priceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const discountRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const nextBarcodeRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusCell = (itemId: string, field: "quantity" | "price" | "discount" | "barcode") => {
    setTimeout(() => {
      let input: HTMLInputElement | null = null;
      if (field === "quantity") input = qtyRefs.current[itemId];
      if (field === "price") input = priceRefs.current[itemId];
      if (field === "discount") input = discountRefs.current[itemId];
      if (field === "barcode") input = nextBarcodeRefs.current[itemId];
      
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };



  const { getActiveBill, updateItem, updateItemProduct, removeItem, selectRow, addItem } = usePOSStore();
  const bill = getActiveBill();
  const [editItem, setEditItem] = useState<POSItem | null>(null);

  // Barcode editing state
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [barcodeResults, setBarcodeResults] = useState<Product[]>([]);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeDropdownOpen, setBarcodeDropdownOpen] = useState(false);
  const [barcodeHlIdx, setBarcodeHlIdx] = useState(0);
  const barcodeResultsRef = useRef<Product[]>([]);
  const barcodeHlIdxRef = useRef(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeDropdownRef = useRef<HTMLDivElement>(null);
  const resetBarcodeScannerRef = useRef<(() => void) | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");

  const debouncedBarcodeQuery = useDebounce(barcodeQuery, 250);

  const focusBarcode = (item: POSItem, index: number) => {
    selectRow(index);
    setEditingBarcodeId(item.id);
    setBarcodeQuery(item.itemName === "" ? "" : (item.barcode || item.itemCode || ""));
    // The useEffect will automatically focus the barcode input
  };

  const handleCustomTab = (
    e: React.KeyboardEvent, 
    itemId: string, 
    currentField: "barcode" | "quantity" | "price" | "discount",
    idx: number
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const prevItem = bill?.items[idx - 1];
      const nextItem = bill?.items[idx + 1];

      if (!e.shiftKey) {
        if (currentField === "barcode") focusCell(itemId, "quantity");
        else if (currentField === "quantity") focusCell(itemId, "price");
        else if (currentField === "price") focusCell(itemId, "discount");
        else if (currentField === "discount") {
          if (nextItem) focusBarcode(nextItem, idx + 1);
        }
      } else {
        if (currentField === "quantity") {
           const currentItem = bill?.items[idx];
           if (currentItem) focusBarcode(currentItem, idx);
        }
        else if (currentField === "price") focusCell(itemId, "quantity");
        else if (currentField === "discount") focusCell(itemId, "price");
        else if (currentField === "barcode") {
          if (prevItem) focusCell(prevItem.id, "discount");
        }
      }
    }
  };

  const handleRowClick = (item: POSItem, idx: number) => {
    selectRow(idx);
    // Only open modify modal for non-placeholder items
    if (item.itemName !== "") {
      setEditItem(item);
    }
  };

  const handleAddProduct = useCallback(async (product: Product, targetItemId: string) => {
    let price = product.salesPrice || 0;
    const tax = product.taxRate || 0;
    const incl = (product as any).salesTaxType === "with";
    try {
      const p = await productService.getPricing(product._id);
      updateItemProduct(targetItemId, {
        productId: product._id,
        product,
        itemCode: product.sku,
        itemName: product.name,
        barcode: product.barcode,
        pricePerUnit: p.salesPrice ?? price,
        purchasePrice: p.purchasePrice ?? 0,
        taxPercent: p.taxPercent ?? tax,
        unit: product.unit || "Pcs",
        isInclusive: p.salesTaxType === "with",
        customItem: false,
      });
      focusCell(targetItemId, "quantity");
    } catch {
      updateItemProduct(targetItemId, {
        productId: product._id,
        product,
        itemCode: product.sku,
        itemName: product.name,
        barcode: product.barcode,
        pricePerUnit: price,
        purchasePrice: 0,
        taxPercent: tax,
        unit: product.unit || "Pcs",
        isInclusive: incl,
        customItem: false,
      });
      focusCell(targetItemId, "quantity");
    }
    setEditingBarcodeId(null);
    setBarcodeQuery("");
    setBarcodeResults([]);
    barcodeResultsRef.current = [];
    setBarcodeDropdownOpen(false);
    resetBarcodeScannerRef.current?.();
  }, [updateItemProduct]);

  // Barcode scanner hook — scans fill the active placeholder row
  const { reset: resetBarcodeScanner } = useBarcodeScanner({
    onScan: async (barcode) => {
      try {
        const { data } = await productService.getAll({ search: barcode, limit: 1 });
        const match = data.find(p => p.barcode === barcode || p.sku === barcode);
        if (match && bill) {
          // Find the last placeholder row to fill
          const placeholderItem = bill.items.find(i => i.itemName === "");
          if (placeholderItem) {
            await handleAddProduct(match, placeholderItem.id);
            toast.success(`Scanned: ${match.name}`);
          } else {
            // All rows filled, add a new item
            addItem({
              productId: match._id,
              product: match,
              itemCode: match.sku,
              itemName: match.name,
              barcode: match.barcode,
              pricePerUnit: match.salesPrice || 0,
              taxPercent: match.taxRate || 0,
              unit: match.unit || "Pcs",
            });
            toast.success(`Scanned: ${match.name}`);
          }
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
  resetBarcodeScannerRef.current = resetBarcodeScanner;

  // Search products when barcode query changes
  useEffect(() => {
    if (!debouncedBarcodeQuery.trim()) {
      setBarcodeResults([]);
      barcodeResultsRef.current = [];
      setBarcodeDropdownOpen(false);
      return;
    }
    (async () => {
      setBarcodeLoading(true);
      try {
        const { data } = await productService.getAll({ search: debouncedBarcodeQuery, limit: 8 });
        setBarcodeResults(data);
        barcodeResultsRef.current = data;
        setBarcodeHlIdx(0);
        barcodeHlIdxRef.current = 0;
        setBarcodeDropdownOpen(true);
        // Exact barcode match — auto-select
        const exact = data.find(p => p.barcode === debouncedBarcodeQuery || p.sku === debouncedBarcodeQuery);
        if (exact && data.length === 1 && editingBarcodeId) {
          handleAddProduct(exact, editingBarcodeId);
        }
      } catch {} finally {
        setBarcodeLoading(false);
      }
    })();
  }, [debouncedBarcodeQuery]);


  // Auto-focus barcode input when editingBarcodeId changes
  useEffect(() => {
    if (editingBarcodeId) {
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  }, [editingBarcodeId]);

  // Auto-focus selected placeholder row, or clear editing state for non-placeholders
  useEffect(() => {
    if (bill) {
      const selectedItem = bill.items[bill.selectedRowIndex];
      if (selectedItem) {
        if (selectedItem.itemName === "") {
          setEditingBarcodeId(selectedItem.id);
        } else if (editingBarcodeId !== selectedItem.id) {
          setEditingBarcodeId(null);
        }
      }
    }
  }, [bill?.selectedRowIndex, bill?.items?.[bill.selectedRowIndex]?.id]);

  // Click outside to close barcode dropdown
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (barcodeDropdownRef.current && !barcodeDropdownRef.current.contains(e.target as Node)) {
        setBarcodeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setBarcodeHlIdx(p => { const n = Math.min(p + 1, barcodeResultsRef.current.length - 1); barcodeHlIdxRef.current = n; return n; });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setBarcodeHlIdx(p => { const n = Math.max(p - 1, 0); barcodeHlIdxRef.current = n; return n; });
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const cur = barcodeResultsRef.current[barcodeHlIdxRef.current];
      if (cur) {
        handleAddProduct(cur, itemId);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setBarcodeDropdownOpen(false);
      setEditingBarcodeId(null);
      setBarcodeQuery("");
    }
  };

  // Handle inline discount change
  const handleDiscountChange = (itemId: string, value: string) => {
    const discount = Math.max(0, Math.min(100, Number(value) || 0));
    updateItem(itemId, { discount });
  };

  if (!bill) return null;

  const realItems = bill.items.filter(i => i.itemName !== "");
  const EMPTY_ROWS = Math.max(0, 12 - bill.items.length);

  return (
    <div ref={barcodeDropdownRef} className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      {/* Mobile Card-based Cart List */}
      <div className="hidden">
        {bill.items.filter(i => i.itemName !== "").map((item, idx) => {
          const actualIdx = bill.items.indexOf(item);
          const sel = bill.selectedRowIndex === actualIdx;
          return (
            <div
              key={item.id}
              onClick={() => handleRowClick(item, actualIdx)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative",
                sel 
                  ? "bg-primary/[0.06] border-primary/40 shadow-sm" 
                  : "bg-card border-border/50 hover:bg-muted/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded transition-colors",
                      sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      {item.barcode || item.itemCode || "—"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mt-1.5">{item.itemName || "—"}</h4>
                </div>
                
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/10 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Qty</span>
                  <span className="font-bold text-sm text-foreground">{item.quantity} {item.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Price</span>
                  <span className="font-semibold text-sm text-foreground">{formatCurrency(item.pricePerUnit)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Disc%</span>
                  <span className="font-semibold text-sm text-foreground">{item.discount}%</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Total</span>
                  <span className="font-black text-sm text-primary">{formatCurrency(item.total)}</span>
                </div>
              </div>
              
              {item.taxPercent > 0 && (
                <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 opacity-70">
                  <span>Tax ({item.taxPercent}% GST):</span>
                  <span className="font-medium">{formatCurrency(item.taxAmount)}</span>
                </div>
              )}
            </div>
          );
        })}
        {realItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60 space-y-2">
            <ScanBarcode className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs text-center px-4 text-muted-foreground/45">Scan barcode to add items</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="flex flex-col flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-[680px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/50 backdrop-blur-md border-b-2 border-border/60 whitespace-nowrap">
              <th className="w-[32px] px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">#</th>
              <th className="min-w-[100px] px-2 py-2 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">
                Barcode
              </th>
              <th className="w-full min-w-[120px] px-2 py-2 text-left text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Item Name</th>
              <th className="min-w-[60px] px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Qty</th>
              <th className="min-w-[45px] px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">Unit</th>
              <th className="min-w-[80px] px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">
                Price(₹)
              </th>
              <th className="min-w-[50px] px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">
                Disc%
              </th>
              <th className="min-w-[80px] px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground border-r border-border/30">
                Tax(₹)
              </th>
              <th className="min-w-[100px] px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                Total(₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => {
              const sel = bill.selectedRowIndex === idx;
              const isPlaceholder = item.itemName === "";
              const isEditingBarcode = editingBarcodeId === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    selectRow(idx);
                    if (isPlaceholder) {
                      setEditingBarcodeId(item.id);
                      setBarcodeQuery("");
                    }
                  }}
                  className={cn(
                    "border-b border-border/20 transition-all cursor-pointer group",
                    sel ? "bg-primary/[0.06]" : "hover:bg-muted/20",
                    isPlaceholder && "bg-muted/5"
                  )}
                >
                  {/* # */}
                  <td className="px-2 py-1.5 text-center border-r border-border/20">
                    <span className={cn(
                      "inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold transition-colors",
                      sel ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Barcode — Editable */}
                  <td className="px-1.5 py-1 border-r border-border/20 relative" onClick={(e) => {
                    e.stopPropagation();
                    selectRow(idx);
                    setEditingBarcodeId(item.id);
                    setBarcodeQuery(isPlaceholder ? "" : (item.barcode || item.itemCode || ""));
                  }}>
                    {isEditingBarcode ? (
                      <div className="relative">
                        <TableCellInput
                          ref={(el) => { 
                            barcodeInputRef.current = el; 
                            if (el) nextBarcodeRefs.current[item.id] = el; 
                          }}
                          data-barcode-input="true"
                          value={barcodeQuery}
                          onChange={(e) => setBarcodeQuery(e.target.value)}
                          onKeyDown={(e) => {
                            handleCustomTab(e, item.id, "barcode", bill.items.indexOf(item));
                            if (e.key !== "Tab") handleBarcodeKeyDown(e, item.id);
                          }}
                          onFocus={() => { if (barcodeQuery.trim() && barcodeResults.length > 0) setBarcodeDropdownOpen(true); }}
                          placeholder="Scan/Type..."
                          className="w-full h-6 px-2 text-xs font-mono font-semibold bg-primary/5 transition-all placeholder:text-muted-foreground/40"
                          autoFocus
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                          {barcodeLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          ) : (
                            <ScanBarcode className="h-3 w-3 text-muted-foreground opacity-40" />
                          )}
                        </div>

                        {/* Suggestions dropdown */}
                        {barcodeDropdownOpen && (
                          <div className="absolute top-full left-0 w-[500px] mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl shadow-black/45 overflow-hidden">
                            <div className="grid grid-cols-12 px-3 py-2 border-b border-border/50 bg-muted/40 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                              <div className="col-span-3">Barcode</div>
                              <div className="col-span-5">Item Name</div>
                              <div className="col-span-2 text-center">Stock</div>
                              <div className="col-span-2 text-right">Price (₹)</div>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {barcodeResults.length > 0 ? barcodeResults.map((p, i) => (
                                <div
                                  key={p._id}
                                  onClick={(e) => { e.stopPropagation(); handleAddProduct(p, item.id); }}
                                  onMouseEnter={() => { setBarcodeHlIdx(i); barcodeHlIdxRef.current = i; }}
                                  className={cn(
                                    "grid grid-cols-12 px-3 py-2 cursor-pointer items-center border-b border-border/10 last:border-0 transition-colors",
                                    i === barcodeHlIdx ? "bg-primary/10" : "hover:bg-muted/40"
                                  )}
                                >
                                  <div className="col-span-3 text-xs font-mono font-semibold truncate">{p.barcode || p.sku}</div>
                                  <div className="col-span-5 text-xs font-medium truncate">{p.name}</div>
                                  <div className="col-span-2 text-center text-xs">
                                    <span className={cn("font-bold", (p.stock || 0) <= 0 ? "text-destructive" : "text-emerald-500")}>{p.stock || 0}</span>
                                    <span className="text-[9px] text-muted-foreground ml-1">{p.unit || "Pcs"}</span>
                                  </div>
                                  <div className="col-span-2 text-right text-xs font-bold">{formatCurrency(p.salesPrice || 0)}</div>
                                </div>
                              )) : (
                                <div className="p-3 text-center space-y-2">
                                  <p className="text-[10px] text-muted-foreground">No product found for "<strong>{barcodeQuery}</strong>"</p>
                                  <div className="flex items-center justify-center gap-3">
                                    <button onClick={(e) => { 
                                      e.stopPropagation();
                                      setScannedBarcode(barcodeQuery); 
                                      setShowProductModal(true); 
                                      setBarcodeDropdownOpen(false); 
                                      setEditingBarcodeId(null);
                                      setBarcodeQuery("");
                                    }} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 hover:underline">
                                      <PackagePlus className="h-3 w-3" /> Add New Product
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={cn(
                        "text-xs font-mono font-semibold block truncate",
                        isPlaceholder ? "text-muted-foreground/40 italic" : ""
                      )}>
                        {isPlaceholder ? "Click to scan..." : (item.barcode || item.itemCode || "—")}
                      </span>
                    )}
                  </td>

                  {/* Item Name */}
                  <td className="px-2 py-1 border-r border-border/20" title={isPlaceholder ? "" : (item.itemName || "—")}>
                    <span className={cn(
                      "text-[13px] font-medium whitespace-normal",
                      isPlaceholder ? "text-muted-foreground/30 italic" : ""
                    )}>
                      {isPlaceholder ? "" : (item.itemName || "—")}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="px-1 py-1 text-center border-r border-border/20" onClick={(e) => e.stopPropagation()}>
                    {!isPlaceholder ? (
                      <TableCellInput
                        id={`qty-${item.id}`}
                        ref={(el) => { if (el) qtyRefs.current[item.id] = el; }}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "quantity", bill.items.indexOf(item))}
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(item.id, { quantity: Math.max(0.01, Number(e.target.value)) })}
                        className="h-6 text-[13px]"
                      />
                    ) : null}
                  </td>

                  {/* Unit */}
                  <td className="px-1.5 py-1 text-center border-r border-border/20 text-xs text-muted-foreground">
                    {isPlaceholder ? "" : item.unit}
                  </td>

                  {/* Price */}
                  <td className="px-1 py-1 text-right border-r border-border/20" onClick={(e) => e.stopPropagation()}>
                    {!isPlaceholder ? (
                      <TableCellInput
                        type="number"
                        min="0"
                        step="any"
                        value={item.pricePerUnit || ""}
                        ref={(el) => { if (el) priceRefs.current[item.id] = el; }}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "price", bill.items.indexOf(item))}
                        onChange={(e) => updateItem(item.id, { pricePerUnit: Math.max(0, Number(e.target.value)) })}
                        className="h-6 text-[13px] text-right font-semibold"
                      />
                    ) : null}
                  </td>

                  {/* Discount % — Editable for real items */}
                  <td className="px-1 py-1 text-center border-r border-border/20" onClick={(e) => e.stopPropagation()}>
                    {!isPlaceholder ? (
                      <TableCellInput
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.discount || ""}
                        ref={(el) => { if (el) discountRefs.current[item.id] = el; }}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "discount", bill.items.indexOf(item))}
                        onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                        placeholder="0"
                        className="h-6 text-[11px]"
                      />
                    ) : null}
                  </td>

                  {/* Tax */}
                  <td className="px-2 py-1 text-right border-r border-border/20">
                    {!isPlaceholder && (
                      <>
                        <span className="text-[13px] tabular-nums">{formatCurrency(item.taxAmount)}</span>
                        {item.taxPercent > 0 && (
                          <span className="block text-[10px] text-muted-foreground">{item.taxPercent}% GST</span>
                        )}
                      </>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-2 py-1 text-right">
                    {!isPlaceholder && (
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <span className="text-sm font-black tabular-nums tracking-tight">{formatCurrency(item.total)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Empty filler rows */}
            {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
              <tr key={`e-${i}`} className="border-b border-border/10 h-[34px]">
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modify Item Modal */}
      <ModifyItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
      />

      {/* Product Modal */}
      <SimpleProductModal 
        open={showProductModal} 
        onOpenChange={setShowProductModal}
        initialBarcode={scannedBarcode}
        initialSku={scannedBarcode.length > 5 ? `SKU-${scannedBarcode.slice(-4)}` : undefined}
        onSuccess={(product) => {
          // Add to the last placeholder if available
          if (bill) {
            const placeholder = bill.items.find(i => i.itemName === "");
            if (placeholder) {
              handleAddProduct(product, placeholder.id);
            } else {
              addItem({
                productId: product._id,
                product,
                itemCode: product.sku,
                itemName: product.name,
                barcode: product.barcode,
                pricePerUnit: product.salesPrice || 0,
                taxPercent: product.taxRate || 0,
                unit: product.unit || "Pcs",
              });
            }
          }
          toast.success("Product created and added to cart!");
        }}
      />
    </div>
  );
}
