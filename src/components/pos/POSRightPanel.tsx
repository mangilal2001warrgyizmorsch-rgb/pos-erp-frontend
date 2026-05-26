import { useState, useEffect, useRef } from "react";
import { ChevronDown, Receipt, Printer, Calendar, User, X, Plus, AlertCircle, Trash2 } from "lucide-react";
import { usePOSStore, WALK_IN_CUSTOMER, type POSBill } from "@/store/posStore";
import { useThemeStore } from "@/store/themeStore";
import { saleService } from "@/services/saleService";
import { cashBankService } from "@/services/cashBankService";
import { customerService } from "@/services/customerService";
import { formatCurrency, formatNumberInputValue, cn } from "@/lib/utils";
import type { BankAccount, Customer, Sale } from "@/types";
import { toast } from "sonner";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";
import { CustomerModal } from "@/components/shared/CustomerModal";

type POSBankAccount = BankAccount & {
  accountType?: string;
  bankName?: string;
  isDefault?: boolean;
  status?: string;
};

interface SplitPayment {
  id: string;
  mode: string;
  amount: number;
}

export function POSRightPanel() {
  const activeBillId = usePOSStore((state) => state.activeBillId);

  return <POSRightPanelContent key={activeBillId || "empty"} />;
}

function POSRightPanelContent() {
  const store = usePOSStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const bill = store.getActiveBill();
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showFullBreakup, setShowFullBreakup] = useState(false);
  const [showMultiPay, setShowMultiPay] = useState(false);
  const [printSaleData, setPrintSaleData] = useState<Sale | null>(null);
  const [bankAccounts, setBankAccounts] = useState<POSBankAccount[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Mobile-responsive states for customer & date
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const customerDDRef = useRef<HTMLDivElement>(null);

  // Auto-sync amount received with grand total
  const [isAmountEdited, setIsAmountEdited] = useState(false);
  const [showPaymentDD, setShowPaymentDD] = useState(false);
  const [showBankDD, setShowBankDD] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cashBankService.getAccounts()
      .then(res => {
        if (res.success && res.data) {
          const accounts = res.data as POSBankAccount[];
          setBankAccounts(accounts.filter((account) => account.accountType === "bank" && account.status === "active"));
        }
      })
      .catch(err => console.error("Failed to load bank accounts:", err));
    
    // Load customers for mobile view
    customerService.getAll({ limit: 200 })
      .then(res => {
        if (res.data) {
          setCustomers(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (paymentRef.current && !paymentRef.current.contains(e.target as Node)) setShowPaymentDD(false);
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) setShowBankDD(false);
      if (customerDDRef.current && !customerDDRef.current.contains(e.target as Node)) setShowCustomerDD(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const realItems = bill?.items.filter(i => i.itemName !== "") || [];
  const totalItems = realItems.length;
  const totalQty = realItems.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = realItems.reduce((s, i) => s + i.total, 0);
  const amountReceived = bill?.amountReceived || 0;
  const change = Math.max(0, amountReceived - grandTotal);
  const remaining = Math.max(0, grandTotal - amountReceived);
  const paymentBalance = remaining > 0 ? remaining : change;
  const paymentBalanceLabel = remaining > 0 ? "Remaining Amount:" : "Change to Return:";

  // Sync amount when total changes (if not manually edited)
  useEffect(() => {
    if (!bill || isAmountEdited) return;

    if (bill.amountReceived !== grandTotal) {
      store.setAmountReceived(grandTotal);
    }
  }, [bill, grandTotal, isAmountEdited, store]);

  if (!bill) return null;

  const handleSave = async () => {
    const activeBill = store.getActiveBill();
    if (!activeBill) return;
    const currentItems = activeBill.items.filter(i => i.itemName !== "");
    const currentGrandTotal = currentItems.reduce((s, i) => s + i.total, 0);
    if (currentItems.length === 0) { toast.error("Add items first"); return; }
    setSaving(true);
    try {
      // Use the customer from the bill; if walk-in, pass walk-in name but no DB id
      const isWalkIn = !activeBill.customer || activeBill.customer._id === "walk-in";
      const cId = isWalkIn ? undefined : activeBill.customer?._id;
      const cName = isWalkIn ? "Walk-in Customer" : (activeBill.customer?.name || "Walk-in Customer");
      
      const subtotal = currentItems.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);
      const taxAmt = currentItems.reduce((s, i) => s + i.taxAmount, 0);
      const discountAmt = currentItems.reduce((s, i) => {
        const base = i.quantity * i.pricePerUnit;
        return s + base * (i.discount / 100);
      }, 0);
      
      // Use the selected date from mobile, or current date for desktop
      const dateToUse = saleDate ? new Date(saleDate).toISOString() : new Date().toISOString();
      
      const receivedAmount = Math.min(activeBill.amountReceived || currentGrandTotal, currentGrandTotal);
      const paidInFull = receivedAmount >= currentGrandTotal;
      const paymentMethod = activeBill.paymentMode === "Partial"
        ? "cash"
        : activeBill.paymentMode === "Bank"
          ? "upi"
          : activeBill.paymentMode.toLowerCase();

      const saleData = {
        customer: cId, customerName: cName, saleDate: dateToUse,
        items: currentItems.map(i => ({ product: i.productId || undefined, name: i.itemName, sku: i.itemCode, quantity: i.quantity, unitPrice: i.pricePerUnit, purchasePrice: i.purchasePrice, discount: i.discount, total: i.total })),
        subtotal, taxAmount: taxAmt, discountAmount: discountAmt, totalAmount: currentGrandTotal, amountPaid: receivedAmount,
        status: "completed", paymentStatus: paidInFull ? "paid" : "partial", paymentMethod, notes: activeBill.remarks,
        cashBankAccountId: (activeBill.paymentMode !== "Cash" && activeBill.paymentMode !== "Wallet" && activeBill.paymentMode !== "Partial") ? activeBill.cashBankAccountId : undefined,
      };

      let savedSale;
      if (activeBill.editingId) {
        // Update existing sale
        await saleService.update(activeBill.editingId, saleData);
        toast.success("Sale updated successfully!"); 
        // Fetch updated sale data for printing
        savedSale = await saleService.getById(activeBill.editingId);
      } else {
        // Create new sale
        savedSale = await saleService.create(saleData);
        toast.success("Sale saved!"); 
      }
      
      setPrintSaleData(savedSale);
      store.resetActiveBill();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Failed to save");
    }
    finally { setSaving(false); }
  };

  const modes = ["Cash", "UPI", "Card", "Bank", "Wallet", "Partial"];
  
  const isWalkIn = !bill?.customer || bill.customer._id === "walk-in";
  const filtered = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone && c.phone.includes(custSearch)))
    : customers;

  return (
    <div className="flex flex-col h-full bg-card dark:bg-card">
      {/* ═══ TOTAL BILL CARD ═══ */}
      <div className={cn(
        "mx-4 mt-4 px-3.5 py-3 rounded-2xl shadow-xl",
        isDark 
          ? "bg-gradient-to-br from-orange-100 via-amber-100 to-orange-50 text-slate-900"
          : "bg-gradient-to-br from-slate-700 via-slate-700 to-slate-800 text-white"
      )}>
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <Receipt className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", isDark ? "opacity-70" : "opacity-75")} />
            <span className={cn("text-[10px] font-semibold uppercase tracking-normal leading-5", isDark ? "opacity-75" : "opacity-80")}>
              Total Bill Amount
            </span>
          </div>
          <button 
            onClick={() => setShowFullBreakup(true)}
            className={cn(
              "text-[10px] font-semibold leading-3 text-right transition-colors shrink-0",
              isDark ? "text-orange-600 hover:text-orange-700" : "text-orange-200 hover:text-white"
            )}
          >
            Full Breakup<br />
            <span className="font-bold">[CTRL+F]</span>
          </button>
        </div>
        <p className={cn("mt-4 text-[24px] leading-none font-bold font-sans tracking-normal tabular-nums", isDark ? "text-slate-950" : "text-white")}>
          {formatCurrency(grandTotal)}
        </p>
        <div className={cn("my-4 h-px", isDark ? "bg-slate-300/80" : "bg-white/10")} />
        <div className={cn("flex items-center justify-between text-[12px] uppercase tracking-normal", isDark ? "text-slate-700" : "text-slate-300")}>
          <span>Items: <b className={cn("font-black", isDark ? "text-slate-950" : "text-white")}>{totalItems}</b></span>
          <span>Quantity: <b className={cn("font-black", isDark ? "text-slate-950" : "text-white")}>{totalQty}</b></span>
        </div>
      </div>

      {/* ═══ MOBILE-ONLY: DATE & CUSTOMER SECTION ═══ */}
      <div className="md:hidden px-3 mt-3 space-y-2.5">
        {/* Date Section */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Sale Date
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full h-10 px-3 text-sm font-semibold bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all"
          />
        </div>

        {/* Customer Section with Search */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Customer
          </label>
          <div className="relative" ref={customerDDRef}>
            <div className="relative flex items-center">
              <User className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
              <input
                value={isWalkIn ? custSearch : (bill.customer?.name || "")}
                onChange={(e) => { setCustSearch(e.target.value); setShowCustomerDD(true); if (!isWalkIn) store.setCustomer(WALK_IN_CUSTOMER); }}
                onFocus={() => setShowCustomerDD(true)}
                placeholder="Walk-in Customer"
                className="w-full h-10 pl-8 pr-8 text-sm font-semibold bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
              />
              {!isWalkIn ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); store.setCustomer(WALK_IN_CUSTOMER); setCustSearch(""); setShowCustomerDD(true); }}
                  className="absolute right-2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              )}
            </div>

            {/* Customer dropdown */}
            {showCustomerDD && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto no-scrollbar z-50 flex flex-col min-w-full">
                <button 
                  onClick={() => { setShowCustomerModal(true); setShowCustomerDD(false); setCustSearch(""); }} 
                  className="px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Customer
                </button>
                {/* Walk-in option always at top */}
                <button
                  onClick={() => { store.setCustomer(WALK_IN_CUSTOMER); setShowCustomerDD(false); setCustSearch(""); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between border-b border-border/20",
                    isWalkIn && "bg-primary/5"
                  )}
                >
                  <span className="font-medium text-muted-foreground">Walk-in Customer</span>
                  <span className="text-[10px] text-muted-foreground/50">Default</span>
                </button>
                {filtered.slice(0, 8).map(c => (
                  <button key={c._id} onClick={() => { store.setCustomer(c); setShowCustomerDD(false); setCustSearch(""); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between">
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                  </button>
                ))}
                {filtered.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">No customer found</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Mode + Amount */}
      <div className="p-4 flex-1 space-y-4 overflow-y-auto overflow-x-visible no-scrollbar bg-background dark:bg-background">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground pl-1">Payment Mode</label>
            <div className="relative" ref={paymentRef}>
              <button
                type="button"
                onClick={() => setShowPaymentDD(!showPaymentDD)}
                className="w-full h-11 pl-4 pr-8 text-sm font-semibold text-left bg-card dark:bg-card border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 cursor-pointer transition-all hover:border-border dark:hover:border-border/50"
              >
                {bill.paymentMode}
              </button>
              <ChevronDown className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform",
                showPaymentDD && "rotate-180"
              )} />
              {showPaymentDD && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-1000 max-h-40 overflow-y-auto no-scrollbar bg-card dark:bg-card border border-border/50 dark:border-border/30 rounded-lg shadow-xl">
                  {modes.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        store.setPaymentMode(m);
                        if (m === "Partial") {
                          setShowPaymentDD(false);
                          setShowMultiPay(true);
                          return;
                        }
                        if (m !== "Cash" && m !== "Wallet") {
                          const defaultBank = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
                          if (defaultBank && !bill.cashBankAccountId) {
                            store.updateBillField("cashBankAccountId", defaultBank._id);
                          }
                        } else {
                          store.updateBillField("cashBankAccountId", "");
                        }
                        setShowPaymentDD(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors border-b border-border/10 last:border-0",
                        bill.paymentMode === m
                          ? "bg-primary/10 dark:bg-primary/15 text-primary"
                          : "text-foreground hover:bg-muted/50 dark:hover:bg-muted/30"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground pl-1">Amount Received</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
              <input 
                type="number" 
                step="0.01"
                value={bill.amountReceived === 0 && !isAmountEdited ? "" : formatNumberInputValue(bill.amountReceived)} 
                onChange={(e) => {
                  setIsAmountEdited(true);
                  store.setAmountReceived(e.target.value === "" ? 0 : Number(e.target.value));
                }}
                placeholder={grandTotal.toFixed(2)}
                className="w-full h-11 pl-8 pr-3 text-sm text-right font-bold bg-card dark:bg-card border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-all hover:border-border dark:hover:border-border/50 placeholder:text-muted-foreground/50" 
              />
            </div>
          </div>
        </div>

        {bill.paymentMode !== "Cash" && bill.paymentMode !== "Wallet" && bankAccounts.length > 0 && (
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground pl-1">Collect in Bank Account</label>
            <div className="relative" ref={bankRef}>
              <button
                type="button"
                onClick={() => setShowBankDD(!showBankDD)}
                className="w-full h-11 pl-4 pr-8 text-sm font-semibold text-left bg-card dark:bg-card border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 cursor-pointer transition-all hover:border-border dark:hover:border-border/50 truncate"
              >
                {bill.cashBankAccountId
                  ? (bankAccounts.find(a => a._id === bill.cashBankAccountId)?.accountName || "Select Bank Account")
                  : "Select Bank Account"}
              </button>
              <ChevronDown className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform",
                showBankDD && "rotate-180"
              )} />
              {showBankDD && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 bg-card dark:bg-card border border-border/50 dark:border-border/30 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                  {bankAccounts.map((account) => (
                    <button
                      key={account._id}
                      type="button"
                      onClick={() => {
                        store.updateBillField("cashBankAccountId", account._id);
                        setShowBankDD(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors border-b border-border/10 last:border-0",
                        bill.cashBankAccountId === account._id
                          ? "bg-primary/10 dark:bg-primary/15 text-primary"
                          : "text-foreground hover:bg-muted/50 dark:hover:bg-muted/30"
                      )}
                    >
                      <span className="block truncate">{account.accountName} {account.bankName ? `(${account.bankName})` : ""}</span>
                      <span className="text-[10px] text-muted-foreground">₹{account.currentBalance.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 dark:border-border/30 space-y-3 bg-card dark:bg-card">
        {/* Change */}
        <div className="flex items-center justify-between px-2 py-2 bg-success/10 dark:bg-success/15 rounded-lg border border-success/20 dark:border-success/30">
          <span className="text-xs font-bold text-foreground">{paymentBalanceLabel}</span>
          <span className="text-lg font-black text-success tabular-nums">{formatCurrency(paymentBalance)}</span>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || realItems.length === 0}
          className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold text-xs uppercase tracking-[0.15em] rounded-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          {saving ? (bill?.editingId ? "Updating..." : "Saving...") : (bill?.editingId ? "UPDATE & PRINT BILL" : "SAVE & PRINT BILL")}
        </button>
        <button 
          onClick={() => setShowMultiPay(true)}
          className="w-full h-10 border border-border/50 dark:border-border/30 bg-muted/20 dark:bg-muted/15 hover:bg-muted/40 dark:hover:bg-muted/25 text-foreground font-bold text-[10px] uppercase tracking-[0.12em] rounded-lg transition-colors"
        >
          Other/Credit Payments [CTRL+M]
        </button>
      </div>

      {/* Modals */}
      <FullBreakupModal 
        open={showFullBreakup} 
        onClose={() => setShowFullBreakup(false)} 
      />
      {showMultiPay && (
        <MultiPayModal
          open={showMultiPay}
          onClose={() => setShowMultiPay(false)}
          onSave={() => {
            setShowMultiPay(false);
            handleSave();
          }}
          onSaveNew={async () => {
            setShowMultiPay(false);
            await handleSave();
            store.createNewBill();
          }}
        />
      )}
      <PrintSaleDialog 
        open={!!printSaleData} 
        onOpenChange={(open) => { if (!open) setPrintSaleData(null); }} 
        sale={printSaleData} 
      />
      <CustomerModal 
        open={showCustomerModal} 
        onOpenChange={setShowCustomerModal} 
        onSuccess={(customer) => {
          if (customer) {
            setCustomers(prev => [...prev, customer]);
            store.setCustomer(customer);
          }
          setShowCustomerModal(false);
        }} 
      />
    </div>
  );
}

// ═══ LOCAL MODAL COMPONENTS ═══

interface FullBreakupModalProps {
  open: boolean;
  onClose: () => void;
}

function FullBreakupModal({ open, onClose }: FullBreakupModalProps) {
  const bill = usePOSStore().getActiveBill();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !bill) return null;

  const realItems = bill.items.filter(i => i.itemName !== "");

  const subtotal = realItems.reduce((s, i) => {
    const base = i.quantity * i.pricePerUnit;
    if (i.isInclusive && i.taxPercent > 0) {
      return s + base / (1 + i.taxPercent / 100);
    }
    return s + base;
  }, 0);

  const discountTotal = realItems.reduce((s, i) => {
    const base = i.quantity * i.pricePerUnit;
    return s + base * (i.discount / 100);
  }, 0);

  const itemTax = realItems.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = realItems.reduce((s, i) => s + i.total, 0);
  const roundOff = Math.round(grandTotal) - grandTotal;
  const finalTotal = Math.round(grandTotal);

  const rows = [
    { label: "Sub Total", value: subtotal },
    { label: "Discount", value: -discountTotal },
    { label: "Item Tax", value: itemTax },
    { label: "Round Off", value: roundOff },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-black tracking-tight">Full Bill Breakup</h2>
          <button onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
            <span className="text-[10px] font-mono opacity-60">[Esc]</span>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-0">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm font-semibold text-foreground">{row.label}</span>
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground text-sm">:</span>
                  <span className="text-sm font-bold tabular-nums min-w-[100px] text-right">{formatCurrency(row.value)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-4 mt-2 bg-emerald-500/10 rounded-xl px-4 -mx-1">
            <span className="text-base font-black text-foreground">Total</span>
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground text-sm">:</span>
              <span className="text-lg font-black tabular-nums min-w-[100px] text-right text-emerald-600 dark:text-emerald-400">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MultiPayModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveNew: () => void;
}

function getInitialSplitPayments(bill: POSBill | undefined): SplitPayment[] {
  if (!bill) return [];

  const grandTotal = bill.items
    .filter((item) => item.itemName !== "")
    .reduce((sum, item) => sum + item.total, 0);
  const existingAmount = bill.amountReceived || 0;
  const firstAmount = existingAmount > 0 && existingAmount < grandTotal ? existingAmount : 0;

  return [
    { id: crypto.randomUUID(), mode: "Cash", amount: firstAmount },
    { id: crypto.randomUUID(), mode: "UPI", amount: Math.max(0, grandTotal - firstAmount) },
  ];
}

function MultiPayModal({ open, onClose, onSave, onSaveNew }: MultiPayModalProps) {
  const store = usePOSStore();
  const bill = store.getActiveBill();
  
  const [payments, setPayments] = useState<SplitPayment[]>(() => getInitialSplitPayments(bill));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !bill) return null;

  const realItems = bill.items.filter(i => i.itemName !== "");
  const grandTotal = realItems.reduce((s, i) => s + i.total, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const balance = grandTotal - totalPaid;
  const isLess = totalPaid < grandTotal;
  const modes = ["Cash", "UPI", "Bank", "Card", "Wallet"];
  const isWalkIn = !bill.customer || bill.customer._id === "walk-in";

  const updatePayment = (id: string, updates: Partial<{ mode: string; amount: number }>) => {
    const nextPayments = payments.map(payment => payment.id === id ? { ...payment, ...updates } : payment);
    setPayments(nextPayments);
    store.setAmountReceived(nextPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
    store.setPaymentMode("Partial");
  };

  const addPaymentRow = () => {
    const paid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    setPayments(prev => [
      ...prev,
      { id: crypto.randomUUID(), mode: "Bank", amount: Math.max(0, grandTotal - paid) },
    ]);
  };

  const removePaymentRow = (id: string) => {
    const nextPayments = payments.filter(payment => payment.id !== id);
    setPayments(nextPayments);
    store.setAmountReceived(nextPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
    store.setPaymentMode("Partial");
  };

  const applySplitPayment = () => {
    store.setAmountReceived(totalPaid);
    store.setPaymentMode("Partial");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl shadow-black/30 w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-black tracking-tight">Multi Pay</h2>
          <button onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
            <span className="text-[10px] font-mono opacity-60">[Esc]</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={payment.id} className="grid grid-cols-[1fr_1.2fr_auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Payment {index + 1}
                  </label>
                  <select
                    value={payment.mode}
                    onChange={(e) => updatePayment(payment.id, { mode: e.target.value })}
                    className="w-full h-10 px-3 text-sm font-bold bg-muted/20 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    {modes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                    <input
                      ref={index === 0 ? inputRef : undefined}
                      type="number"
                      min={0}
                      step="0.01"
                      value={formatNumberInputValue(payment.amount)}
                      onChange={(e) => updatePayment(payment.id, { amount: e.target.value === "" ? 0 : Number(e.target.value) })}
                      className="w-full h-10 pl-7 pr-3 text-sm font-bold bg-muted/20 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePaymentRow(payment.id)}
                  disabled={payments.length <= 2}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:bg-transparent transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addPaymentRow}
              className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-black uppercase tracking-wider hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Payment Option
            </button>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-4 border-dashed">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Received:</span>
              <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black">
              <span>{balance > 0 ? "Balance" : "Change"}</span>
              <span>{formatCurrency(Math.abs(balance))}</span>
            </div>
            {isLess && isWalkIn && (
               <div className="flex items-center gap-1.5 mt-1 text-destructive text-xs">
                 <AlertCircle className="h-3.5 w-3.5" />
                 <span>Party should be selected if amount is less than bill total</span>
               </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex gap-4">
          <button
            onClick={() => {
              applySplitPayment();
              onSave();
            }}
            disabled={totalPaid <= 0 || (isLess && isWalkIn)}
            className="flex-1 h-11 bg-muted-foreground/20 hover:bg-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xs uppercase tracking-wide rounded-lg transition-colors"
          >
            Save & Print Bill [Ctrl+P]
          </button>
          <button
            onClick={() => {
              applySplitPayment();
              onSaveNew();
            }}
            disabled={totalPaid <= 0 || (isLess && isWalkIn)}
            className="flex-1 h-11 bg-muted-foreground/20 hover:bg-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xs uppercase tracking-wide rounded-lg transition-colors"
          >
            Save & New Bill [Ctrl+N]
          </button>
        </div>
      </div>
    </div>
  );
}
