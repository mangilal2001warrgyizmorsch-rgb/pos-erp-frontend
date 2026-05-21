import { useState, useEffect, useRef } from "react";
import { ChevronDown, Receipt, Printer, Calendar, User, X, Plus } from "lucide-react";
import { usePOSStore, WALK_IN_CUSTOMER } from "@/store/posStore";
import { saleService } from "@/services/saleService";
import { cashBankService } from "@/services/cashBankService";
import { customerService } from "@/services/customerService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Sale } from "@/types";
import { toast } from "sonner";
import { FullBreakupModal } from "./FullBreakupModal";
import { MultiPayModal } from "./MultiPayModal";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";
import { CustomerModal } from "@/components/shared/CustomerModal";

export function POSRightPanel() {
  const store = usePOSStore();
  const bill = store.getActiveBill();
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showFullBreakup, setShowFullBreakup] = useState(false);
  const [showMultiPay, setShowMultiPay] = useState(false);
  const [printSaleData, setPrintSaleData] = useState<Sale | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Mobile-responsive states for customer & date
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
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
          setBankAccounts(res.data.filter((a: any) => a.accountType === "bank" && a.status === "active"));
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

  // Reset edited state when active bill changes
  useEffect(() => {
    setIsAmountEdited(false);
  }, [bill?.id]);

  if (!bill) return null;

  const realItems = bill.items.filter(i => i.itemName !== "");
  const totalItems = realItems.length;
  const totalQty = realItems.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = realItems.reduce((s, i) => s + i.total, 0);
  const change = Math.max(0, bill.amountReceived - grandTotal);

  // Sync amount when total changes (if not manually edited)
  useEffect(() => {
    if (!isAmountEdited && grandTotal > 0) {
      store.setAmountReceived(grandTotal);
    } else if (!isAmountEdited && grandTotal === 0) {
      store.setAmountReceived(0);
    }
  }, [grandTotal, isAmountEdited]);

  const handleSave = async () => {
    if (realItems.length === 0) { toast.error("Add items first"); return; }
    setSaving(true);
    try {
      // Use the customer from the bill; if walk-in, pass walk-in name but no DB id
      const isWalkIn = !bill.customer || bill.customer._id === "walk-in";
      const cId = isWalkIn ? undefined : bill.customer?._id;
      const cName = isWalkIn ? "Walk-in Customer" : (bill.customer?.name || "Walk-in Customer");
      
      const subtotal = realItems.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);
      const taxAmt = realItems.reduce((s, i) => s + i.taxAmount, 0);
      const discountAmt = realItems.reduce((s, i) => {
        const base = i.quantity * i.pricePerUnit;
        return s + base * (i.discount / 100);
      }, 0);
      
      // Use the selected date from mobile, or current date for desktop
      const dateToUse = saleDate ? new Date(saleDate).toISOString() : new Date().toISOString();
      
      const savedSale = await saleService.create({
        customer: cId, customerName: cName, saleDate: dateToUse,
        items: realItems.map(i => ({ product: i.productId || undefined, name: i.itemName, sku: i.itemCode, quantity: i.quantity, unitPrice: i.pricePerUnit, purchasePrice: i.purchasePrice, discount: i.discount, total: i.total })),
        subtotal, taxAmount: taxAmt, discountAmount: discountAmt, totalAmount: grandTotal, amountPaid: bill.amountReceived || grandTotal,
        status: "completed", paymentStatus: "paid", paymentMethod: bill.paymentMode.toLowerCase(), notes: bill.remarks,
        cashBankAccountId: (bill.paymentMode !== "Cash" && bill.paymentMode !== "Wallet") ? bill.cashBankAccountId : undefined,
      });
      toast.success("Sale saved!"); 
      setPrintSaleData(savedSale);
      store.resetActiveBill();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const modes = ["Cash", "UPI", "Card", "Bank", "Wallet"];
  
  const isWalkIn = !bill?.customer || bill.customer._id === "walk-in";
  const filtered = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.mobileNo && c.mobileNo.includes(custSearch)))
    : customers;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* ═══ TOTAL BILL CARD ═══ */}
      <div className="mx-3 mt-3 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Total Bill Amount</span>
          </div>
          <button 
            onClick={() => setShowFullBreakup(true)}
            className="text-[10px] font-bold text-blue-300 hover:text-blue-200 transition-colors"
          >
            Full Breakup [CTRL+F]
          </button>
        </div>
        <p className="text-3xl font-black tracking-tight mb-3">
          {formatCurrency(grandTotal)}
        </p>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-60 font-bold">
          <span>Items: {totalItems}</span>
          <span>Quantity: {totalQty}</span>
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
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 flex flex-col min-w-full">
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
                    {c.mobileNo && <span className="text-[10px] text-muted-foreground">{c.mobileNo}</span>}
                  </button>
                ))}
                {filtered.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">No customer found</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Mode + Amount */}
      <div className="p-3 flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5">Payment Mode</label>
            <div className="relative" ref={paymentRef}>
              <button
                type="button"
                onClick={() => setShowPaymentDD(!showPaymentDD)}
                className="w-full h-10 pl-3 pr-7 text-sm font-semibold text-left bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all"
              >
                {bill.paymentMode}
              </button>
              <ChevronDown className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none transition-transform",
                showPaymentDD && "rotate-180"
              )} />
              {showPaymentDD && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  {modes.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        store.setPaymentMode(m);
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
                        "w-full px-3 py-2.5 text-left text-sm font-semibold transition-colors border-b border-border/10 last:border-0",
                        bill.paymentMode === m
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5">Amount Received</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
              <input 
                type="number" 
                value={bill.amountReceived === 0 && !isAmountEdited ? "" : bill.amountReceived || ""} 
                onChange={(e) => {
                  setIsAmountEdited(true);
                  store.setAmountReceived(e.target.value === "" ? 0 : Number(e.target.value));
                }}
                placeholder={grandTotal.toFixed(2)}
                className="w-full h-10 pl-7 pr-2 text-sm text-right font-bold bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" 
              />
            </div>
          </div>
        </div>

        {bill.paymentMode !== "Cash" && bill.paymentMode !== "Wallet" && bankAccounts.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5">Collect in Bank Account</label>
            <div className="relative" ref={bankRef}>
              <button
                type="button"
                onClick={() => setShowBankDD(!showBankDD)}
                className="w-full h-10 pl-3 pr-7 text-sm font-semibold text-left bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all truncate"
              >
                {bill.cashBankAccountId
                  ? (bankAccounts.find(a => a._id === bill.cashBankAccountId)?.accountName || "Select Bank Account")
                  : "Select Bank Account"}
              </button>
              <ChevronDown className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none transition-transform",
                showBankDD && "rotate-180"
              )} />
              {showBankDD && (
                <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {bankAccounts.map((account) => (
                    <button
                      key={account._id}
                      type="button"
                      onClick={() => {
                        store.updateBillField("cashBankAccountId", account._id);
                        setShowBankDD(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2.5 text-left text-sm font-semibold transition-colors border-b border-border/10 last:border-0",
                        bill.cashBankAccountId === account._id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/50"
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
      <div className="p-3 border-t border-border/50 space-y-2.5 bg-card">
        {/* Change */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-muted-foreground">Change to Return:</span>
          <span className="text-xl font-black text-emerald-500 tabular-nums">{formatCurrency(change)}</span>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || realItems.length === 0}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          {saving ? "Saving..." : "Save & Print Bill [Ctrl+P]"}
        </button>
        <button 
          onClick={() => setShowMultiPay(true)}
          className="w-full h-10 border border-border/50 bg-muted/20 hover:bg-muted/40 text-foreground font-bold text-[10px] uppercase tracking-[0.12em] rounded-xl transition-colors"
        >
          Other/Credit Payments [Ctrl+M]
        </button>
      </div>

      {/* Modals */}
      <FullBreakupModal 
        open={showFullBreakup} 
        onClose={() => setShowFullBreakup(false)} 
      />
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
