import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePOSStore, WALK_IN_CUSTOMER, type POSItem } from "@/store/posStore";
import { formatCurrency, formatNumberInputValue, cn } from "@/lib/utils";
import { Trash2, Loader2, PackagePlus, ScanBarcode, X, Plus, ChevronDown, Calendar, User, ReceiptText, MoreVertical, Pencil, Percent, Ruler } from "lucide-react";
import { productService } from "@/services/productService";
import { customerService } from "@/services/customerService";
import { useDebounce } from "@/hooks/useDebounce";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import type { Customer, Product } from "@/types";
import { toast } from "sonner";
import { SimpleProductModal } from "@/components/shared/SimpleProductModal";
import { CustomerModal } from "@/components/shared/CustomerModal";


const TableCellInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-transparent border-none outline-none ring-0 shadow-none px-2 py-1 text-center font-semibold tabular-nums",
        "focus:outline-none focus:ring-0 focus:border-none focus-visible:ring-0 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
});
TableCellInput.displayName = "TableCellInput";

function POSBillTopBar() {
  const { bills, activeBillId, setActiveBill, createNewBill, closeBill, getActiveBill, setCustomer } = usePOSStore();
  const bill = getActiveBill();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showDD, setShowDD] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "t") {
        e.preventDefault();
        createNewBill();
      }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        if (activeBillId) closeBill(activeBillId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [activeBillId, createNewBill, closeBill]);

  useEffect(() => {
    customerService.getAll({ limit: 200 }).then(r => {
      setCustomers(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDD(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone && c.phone.includes(custSearch)))
    : customers;

  const isWalkIn = !bill?.customer || bill.customer._id === "walk-in";
  const customerDisplayName = isWalkIn ? "" : (bill?.customer?.name || "");

  return (
    <div className="relative flex shrink-0 flex-col border-b border-border/70 bg-card">
      <div className="flex h-12 items-center gap-2 px-3 py-1.5">
        

        <div className="flex shrink-0 items-center gap-1 overflow-x-auto pb-1 no-scrollbar lg:pb-0">
          {bills.map((b) => {
            const active = b.id === activeBillId;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBill(b.id)}
                className={cn(
                  "group flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-bold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>#{b.billNo}</span>
                {active && <span className="text-[9px] opacity-70 font-mono hidden sm:inline">CTRL+W</span>}
                {bills.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); closeBill(b.id); }}
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
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Bill
            <span className="text-[9px] opacity-70 font-mono ml-0.5 hidden sm:inline">Ctrl+T</span>
          </button>
        </div>

        <div className="flex-1" />

        <div className="relative shrink-0 hidden md:block" ref={wrapperRef}>
          <div className="relative flex items-center">
            <User className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
            <input
              value={isWalkIn ? custSearch : customerDisplayName}
              onChange={(e) => { setCustSearch(e.target.value); setShowDD(true); if (!isWalkIn) setCustomer(WALK_IN_CUSTOMER); }}
              onFocus={() => setShowDD(true)}
              placeholder="Walk-in Customer"
            className="h-8 w-[190px] rounded-md border border-border/60 bg-muted/25 pl-8 pr-7 text-xs font-semibold transition-all placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 xl:w-[210px]"
            />
            {!isWalkIn ? (
              <button
                onClick={(e) => { e.stopPropagation(); setCustomer(WALK_IN_CUSTOMER); setCustSearch(""); setShowDD(true); }}
                className="absolute right-2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            )}
          </div>

          {showDD && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 flex flex-col min-w-[240px]">
              <button
                onClick={() => { setShowCustomerModal(true); setShowDD(false); setCustSearch(""); }}
                className="px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Customer
              </button>
              <button
                onClick={() => { setCustomer(WALK_IN_CUSTOMER); setShowDD(false); setCustSearch(""); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between border-b border-border/20",
                  isWalkIn && "bg-primary/5"
                )}
              >
                <span className="font-medium text-muted-foreground">Walk-in Customer</span>
                <span className="text-[10px] text-muted-foreground/50">Default</span>
              </button>
              {filtered.slice(0, 6).map(c => (
                <button
                  key={c._id}
                  onClick={() => { setCustomer(c); setShowDD(false); setCustSearch(""); }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between"
                >
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                </button>
              ))}
              {filtered.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">No customer found</div>}
            </div>
          )}
        </div>

        <div className="relative shrink-0 hidden md:block">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="h-8 w-[135px] rounded-md border border-border/60 bg-muted/25 pl-8 pr-2 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {showCustomerModal && (
        <CustomerModal
          open={showCustomerModal}
          onOpenChange={setShowCustomerModal}
          onSuccess={(customer) => {
            if (customer) {
              setCustomers(prev => [...prev, customer]);
              setCustomer(customer);
            }
            setShowCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}


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

  const { activeBillId, getActiveBill, updateItem, updateItemProduct, removeItem, selectRow, addItem, setActiveModal, activeModal } = usePOSStore();
  const bill = getActiveBill();
  const [editItem, setEditItem] = useState<POSItem | null>(null);
  const tableViewportRef = useRef<HTMLDivElement>(null);

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
          // Don't automatically open the modal - let the user explicitly click "Add New Product"
          // setScannedBarcode(barcode);
          // setShowProductModal(true);
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
      setTimeout(() => barcodeInputRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [editingBarcodeId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      tableViewportRef.current?.scrollTo({ top: 0, left: 0 });
    });
  }, [activeBillId]);

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
  const EMPTY_ROWS = Math.max(0, 18 - bill.items.length);

  return (
    <div ref={barcodeDropdownRef} className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      <POSBillTopBar />

      {/* Mobile Card-based Cart List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-background p-3 lg:hidden">
        {bill.items.filter(i => i.itemName !== "").map((item, idx) => {
          const actualIdx = bill.items.indexOf(item);
          const sel = bill.selectedRowIndex === actualIdx;
          return (
            <div
              key={item.id}
              onClick={() => handleRowClick(item, actualIdx)}
              className={cn(
                "relative cursor-pointer space-y-3 rounded-lg border p-4 transition-all",
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
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card px-6 py-12 text-center text-muted-foreground">
            <ScanBarcode className="h-9 w-9 opacity-45" />
            <p className="mt-3 text-sm font-bold text-foreground">Start billing</p>
            <p className="mt-1 text-xs">Scan barcode or search product to add items</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div ref={tableViewportRef} className="hidden flex-1 min-h-0 overflow-hidden bg-background lg:block">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="whitespace-nowrap border-b border-border/80 bg-muted/60 backdrop-blur-md dark:bg-muted/35">
              <th className="w-[34px] border-r border-border/70 px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">#</th>
              <th className="w-[12%] border-r border-border/70 px-2 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Barcode
              </th>
              <th className="w-[25%] border-r border-border/70 px-2 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Item Name</th>
              <th className="w-[7%] border-r border-border/70 px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">Qty</th>
              <th className="w-[6%] border-r border-border/70 px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">Unit</th>
              <th className="w-[10%] border-r border-border/70 px-2 py-2 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Price(₹)
              </th>
              <th className="w-[7%] border-r border-border/70 px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Disc%
              </th>
              <th className="w-[10%] border-r border-border/70 px-2 py-2 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Tax(₹)
              </th>
              <th className="w-[11%] border-r border-border/70 px-2 py-2 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Total(₹)
              </th>
              <th className="w-[44px] px-1.5 py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
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
                    "group h-9 cursor-pointer border-b border-border/70 transition-all duration-150",
                    "hover:bg-muted/20 dark:hover:bg-muted/15",
                    sel && "bg-primary/10 dark:bg-primary/15",
                    isPlaceholder && "bg-muted/5 dark:bg-muted/5"
                  )}
                >
                  {/* # */}
                  <td className="border-r border-border/60 px-1.5 py-1 text-center">
                    <span className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold transition-colors",
                      sel ? "bg-primary text-primary-foreground" : "bg-muted/60 dark:bg-muted/50 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Barcode — Editable */}
                  <td className="relative border-r border-border/60 px-1.5 py-1" onClick={(e) => {
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
                          className="h-6 w-full rounded bg-primary/5 px-1.5 text-[11px] font-mono font-semibold transition-all placeholder:text-muted-foreground/40"
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
                          <div className="absolute left-0 top-full z-50 mt-1 w-[520px] overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/25">
                            <div className="grid grid-cols-12 border-b border-border/50 bg-muted/50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
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
                                    "grid cursor-pointer grid-cols-12 items-center border-b border-border/10 px-3 py-2 transition-colors last:border-0",
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
                                <div className="space-y-2 p-4 text-center">
                                  <p className="text-xs font-semibold text-foreground">No product found</p>
                                  <p className="text-[10px] text-muted-foreground">No match for "<strong>{barcodeQuery}</strong>"</p>
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
                        "block truncate text-[11px] font-mono font-semibold",
                        isPlaceholder ? "text-muted-foreground/40 italic" : ""
                      )}>
                        {isPlaceholder ? "Click to scan..." : (item.barcode || item.itemCode || "—")}
                      </span>
                    )}
                  </td>

                  {/* Item Name */}
                  <td className="border-r border-border/60 px-2 py-1" title={isPlaceholder ? "" : (item.itemName || "—")}>
                    <span className={cn(
                      "block truncate text-[12px] font-semibold leading-tight text-foreground",
                      isPlaceholder ? "text-muted-foreground/30 italic" : ""
                    )}>
                      {isPlaceholder ? "" : (item.itemName || "—")}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="border-r border-border/60 px-1 py-1 text-center" onClick={(e) => e.stopPropagation()}>
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
                        className="h-6 rounded bg-muted/20 text-[12px]"
                      />
                    ) : null}
                  </td>

                  {/* Unit */}
                  <td className="border-r border-border/60 px-1 py-1 text-center text-[11px] font-semibold text-muted-foreground">
                    {isPlaceholder ? "" : item.unit}
                  </td>

                  {/* Price */}
                  <td className="border-r border-border/60 px-1 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                    {!isPlaceholder ? (
                      <TableCellInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={formatNumberInputValue(item.pricePerUnit)}
                        ref={(el) => { if (el) priceRefs.current[item.id] = el; }}
                        onKeyDown={(e) => handleCustomTab(e, item.id, "price", bill.items.indexOf(item))}
                        onChange={(e) => updateItem(item.id, { pricePerUnit: Math.max(0, Number(e.target.value)) })}
                        className="h-6 rounded bg-muted/20 text-right text-[12px] font-semibold"
                      />
                    ) : null}
                  </td>

                  {/* Discount % — Editable for real items */}
                  <td className="border-r border-border/60 px-1 py-1 text-center" onClick={(e) => e.stopPropagation()}>
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
                        className="h-6 rounded bg-muted/20 text-[12px]"
                      />
                    ) : null}
                  </td>

                  {/* Tax */}
                  <td className="border-r border-border/60 px-1.5 py-1 text-right">
                    {!isPlaceholder && (
                      <>
                        <span className="text-[12px] tabular-nums">{formatCurrency(item.taxAmount)}</span>
                        {item.taxPercent > 0 && (
                          <span className="block text-[9px] text-muted-foreground">{item.taxPercent}% GST</span>
                        )}
                      </>
                    )}
                  </td>

                  {/* Total */}
                  <td className="border-r border-border/60 px-1.5 py-1 text-right">
                    {!isPlaceholder && (
                      <span className="whitespace-nowrap text-[12px] font-black tabular-nums tracking-tight">{formatCurrency(item.total)}</span>
                    )}
                  </td>
                  <td className="px-1 py-1 text-center">
                    {!isPlaceholder && (
                      <div className="relative inline-flex group/actions">
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        <div className="invisible absolute right-0 top-full z-40 mt-1 min-w-[150px] overflow-hidden rounded-md border border-border bg-card p-1 text-left opacity-0 shadow-xl transition-all group-hover/actions:visible group-hover/actions:opacity-100">
                          <button onClick={(e) => { e.stopPropagation(); setEditItem(item); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-semibold hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5" /> Edit item
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); selectRow(idx); setActiveModal("itemDisc"); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-semibold hover:bg-muted">
                            <Percent className="h-3.5 w-3.5" /> Add discount
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); selectRow(idx); setActiveModal("unit"); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-semibold hover:bg-muted">
                            <Ruler className="h-3.5 w-3.5" /> Change unit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" /> Remove item
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Empty filler rows */}
            {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
              <tr key={`e-${i}`} className="h-9 border-b border-border/30">
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
                <td className="border-r border-border/30" />
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

      {/* Action Modals for keyboard shortcuts */}
      <ActionModals
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}

// ═══ LOCAL MODAL COMPONENTS ═══

interface ModifyItemModalProps {
  item: POSItem | null;
  onClose: () => void;
}

function ModifyItemModal({ item, onClose }: ModifyItemModalProps) {
  const { updateItem } = usePOSStore();

  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("Pcs");
  const [discPercent, setDiscPercent] = useState(0);
  const [discRupee, setDiscRupee] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [freeQty, setFreeQty] = useState(0);
  const [updatePermanently, setUpdatePermanently] = useState(false);

  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!item) return;
    setQty(item.quantity);
    setUnit(item.unit);
    setDiscPercent(item.discount || 0);
    setDiscRupee(0);
    setNewPrice(item.pricePerUnit);
    setFreeQty(0);
  }, [item]);

  useEffect(() => {
    if (item) setTimeout(() => qtyRef.current?.select(), 100);
  }, [item]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!item) return null;

  const handleSave = () => {
    updateItem(item.id, {
      quantity: qty,
      unit,
      pricePerUnit: newPrice,
      discount: discPercent,
    });
    toast.success(`Updated ${item.itemName}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-black tracking-tight">Modify Item</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="text-[10px] font-mono opacity-60">[Esc]</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Item Name:</span>
              <span className="text-sm font-bold">{item.itemName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Price/Unit:</span>
              <span className="text-sm font-bold">{formatCurrency(item.pricePerUnit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Quantity</label>
              <input
                ref={qtyRef}
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-full h-11 px-3 text-sm font-bold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 text-sm font-semibold bg-muted/30 border border-border/50 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all"
              >
                <option value="Pcs">PIECES (Pcs)</option>
                <option value="Kg">KILOGRAMS (Kg)</option>
                <option value="Ltr">LITRES (Ltr)</option>
                <option value="Mtr">METERS (Mtr)</option>
                <option value="Box">BOX (Box)</option>
                <option value="Dozen">DOZEN (Dzn)</option>
                <option value="Pair">PAIR (Pr)</option>
                <option value="Set">SET (Set)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Discount in %</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discPercent || ""}
                  onChange={(e) => { setDiscPercent(Number(e.target.value)); setDiscRupee(0); }}
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-3 text-sm text-right font-medium bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-center pb-2">
              <span className="text-xs font-bold text-muted-foreground">OR</span>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Discount in ₹</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <input
                  type="number"
                  min={0}
                  value={discRupee || ""}
                  onChange={(e) => { setDiscRupee(Number(e.target.value)); setDiscPercent(0); }}
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-3 text-sm text-right font-medium bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">New Price/Unit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full h-11 pl-8 pr-3 text-sm font-medium bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Free Quantity</label>
              <input
                type="number"
                min={0}
                value={freeQty || ""}
                onChange={(e) => setFreeQty(Number(e.target.value))}
                placeholder=""
                className="w-full h-11 px-3 text-sm font-medium bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={updatePermanently}
              onChange={(e) => setUpdatePermanently(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Update Item Price Permanently
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-muted/50 hover:bg-muted border border-border/50 text-foreground font-bold text-sm rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type ActionModalType = "qty" | "itemDisc" | "unit" | "addCharges" | "billDisc" | "loyalty" | "remarks" | null;

interface ActionModalsProps {
  type: ActionModalType;
  onClose: () => void;
}

function ActionModals({ type, onClose }: ActionModalsProps) {
  const { getActiveBill, updateItem, updateBillField } = usePOSStore();
  const bill = getActiveBill();
  
  const [val, setVal] = useState<string>("");
  const [val2, setVal2] = useState<string>(""); 
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  const selectedItem = bill && bill.selectedRowIndex >= 0 ? bill.items[bill.selectedRowIndex] : null;

  useEffect(() => {
    if (!type || !bill) return;
    
    if (type === "qty" && selectedItem) setVal(selectedItem.quantity.toString());
    if (type === "itemDisc" && selectedItem) {
      setVal(selectedItem.discount.toString());
      setVal2("0");
    }
    if (type === "unit" && selectedItem) setVal(selectedItem.unit);
    if (type === "addCharges") setVal(bill.additionalCharges?.toString() || "0");
    if (type === "billDisc") setVal(bill.discount?.toString() || "0");
    if (type === "loyalty") setVal("0");
    if (type === "remarks") setVal(bill.remarks || "");

    setTimeout(() => {
      if (inputRef.current) {
        if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
          inputRef.current.select();
        } else {
          inputRef.current.focus();
        }
      }
    }, 100);
  }, [type, selectedItem, bill]);

  useEffect(() => {
    if (!type) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [type, onClose]);

  if (!type || !bill) return null;

  const handleSave = () => {
    if (["qty", "itemDisc", "unit"].includes(type) && !selectedItem) {
      onClose();
      return;
    }

    if (type === "qty") {
      updateItem(selectedItem!.id, { quantity: Math.max(1, Number(val)) });
    } else if (type === "itemDisc") {
      updateItem(selectedItem!.id, { discount: Number(val) });
    } else if (type === "unit") {
      updateItem(selectedItem!.id, { unit: val });
    } else if (type === "addCharges") {
      updateBillField("additionalCharges", Number(val));
    } else if (type === "billDisc") {
      updateBillField("discount", Number(val));
    } else if (type === "loyalty") {
      // updateBillField("loyaltyPoints", Number(val));
    } else if (type === "remarks") {
      updateBillField("remarks", val);
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const renderContent = () => {
    switch (type) {
      case "qty":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Item Name:</span>
              <span className="text-sm font-bold">{selectedItem?.itemName}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enter New Quantity</label>
              <input ref={inputRef as any} type="number" value={val} onChange={(e) => setVal(e.target.value)}
                className="w-full h-11 px-3 text-sm font-bold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
        );
      case "itemDisc":
        return (
          <div className="space-y-4">
             <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Item Name:</span>
              <span className="text-sm font-bold">{selectedItem?.itemName}</span>
            </div>
            <div className="grid grid-cols-5 gap-3 items-end">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount in %</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                  <input ref={inputRef as any} type="number" value={val} onChange={(e) => { setVal(e.target.value); setVal2("0"); }}
                    className="w-full h-11 pl-8 pr-3 text-sm font-bold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-center pb-2">
                <span className="text-xs font-bold text-muted-foreground">OR</span>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount in ₹</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                  <input type="number" value={val2} onChange={(e) => { setVal2(e.target.value); setVal("0"); }}
                    className="w-full h-11 pl-8 pr-3 text-sm font-bold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                </div>
              </div>
            </div>
          </div>
        );
      case "unit":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Item Name:</span>
              <span className="text-sm font-bold">{selectedItem?.itemName}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Unit</label>
              <select ref={inputRef as any} value={val} onChange={(e) => setVal(e.target.value)}
                className="w-full h-11 px-3 text-sm font-semibold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <option value="Pcs">PIECES (Pcs)</option>
                <option value="Kg">KILOGRAMS (Kg)</option>
                <option value="Ltr">LITRES (Ltr)</option>
                <option value="Mtr">METERS (Mtr)</option>
                <option value="Box">BOX (Box)</option>
              </select>
            </div>
          </div>
        );
      case "addCharges":
      case "billDisc":
      case "loyalty":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enter Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <input ref={inputRef as any} type="number" value={val} onChange={(e) => setVal(e.target.value)}
                  className="w-full h-11 pl-8 pr-3 text-sm font-bold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
            </div>
          </div>
        );
      case "remarks":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enter Remarks</label>
              <textarea ref={inputRef as any} value={val} onChange={(e) => setVal(e.target.value)} rows={3}
                className="w-full p-3 text-sm font-semibold bg-primary/5 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const titles = {
    qty: "Change Quantity",
    itemDisc: "Item Discount",
    unit: "Change Unit",
    addCharges: "Additional Charges",
    billDisc: "Bill Discount",
    loyalty: "Loyalty Points",
    remarks: "Remarks"
  };

  const needSelection = ["qty", "itemDisc", "unit"].includes(type) && (!selectedItem || selectedItem.itemName === "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative bg-card border border-border rounded-xl shadow-2xl shadow-black/30 w-full max-w-sm mx-4 animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
          <h2 className="text-base font-black tracking-tight">{titles[type]}</h2>
          <button onClick={onClose} className="flex items-center gap-1 px-1.5 py-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
            <span className="text-[10px] font-mono opacity-60">[Esc]</span>
          </button>
        </div>

        <div className="px-5 py-4">
          {needSelection ? (
            <div className="text-sm text-destructive font-semibold text-center py-4">
              Please select an item first!
            </div>
          ) : (
            renderContent()
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border/50 flex gap-3">
          <button
            onClick={handleSave}
            disabled={needSelection}
            className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-md active:scale-[0.98] transition-all"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 bg-muted/50 hover:bg-muted border border-border/50 text-foreground font-bold text-sm rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
