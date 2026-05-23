import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePOSStore, WALK_IN_CUSTOMER, type POSItem } from "@/store/posStore";
import { formatCurrency, formatNumberInputValue, cn } from "@/lib/utils";
import { Trash2, Loader2, PackagePlus, ScanBarcode, X, Plus, ChevronDown, Calendar, User, ReceiptText, MoreVertical, Pencil, Percent, Ruler } from "lucide-react";
import { ModifyItemModal } from "./ModifyItemModal";
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



  const { activeBillId, getActiveBill, updateItem, updateItemProduct, removeItem, selectRow, addItem, setActiveModal } = usePOSStore();
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
    </div>
  );
}
