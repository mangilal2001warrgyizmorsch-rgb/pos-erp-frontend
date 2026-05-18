import { useState, useEffect } from "react";
import { Calendar, Search, ChevronDown, Receipt, Printer, Plus } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { customerService } from "@/services/customerService";
import { saleService } from "@/services/saleService";
import { formatCurrency, cn } from "@/lib/utils";
import type { Customer, Sale } from "@/types";
import { toast } from "sonner";
import { FullBreakupModal } from "./FullBreakupModal";
import { MultiPayModal } from "./MultiPayModal";
import { CustomerModal } from "@/components/shared/CustomerModal";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";

export function POSRightPanel() {
  const store = usePOSStore();
  const bill = store.getActiveBill();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showDD, setShowDD] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showFullBreakup, setShowFullBreakup] = useState(false);
  const [showMultiPay, setShowMultiPay] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [printSaleData, setPrintSaleData] = useState<Sale | null>(null);

  // Auto-sync amount received with grand total
  const [isAmountEdited, setIsAmountEdited] = useState(false);

  useEffect(() => {
    customerService.getAll({ limit: 200 }).then(r => {
      setCustomers(r.data);
      if (bill && !bill.customer) {
        const walkIn = r.data.find(c => c.name.toLowerCase().includes("walk-in") || c.name.toLowerCase().includes("cash"));
        if (walkIn) {
          store.setCustomer(walkIn);
        }
      }
    }).catch(() => {});
  }, []);

  // Reset edited state and default walk-in customer when active bill changes
  useEffect(() => {
    setIsAmountEdited(false);
    if (bill && !bill.customer && customers.length > 0) {
      const walkIn = customers.find(c => c.name.toLowerCase().includes("walk-in") || c.name.toLowerCase().includes("cash"));
      if (walkIn) {
        store.setCustomer(walkIn);
      }
    }
  }, [bill?.id]);

  if (!bill) return null;

  const totalItems = bill.items.length;
  const totalQty = bill.items.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = bill.items.reduce((s, i) => s + i.total, 0);
  const change = Math.max(0, bill.amountReceived - grandTotal);

  // Sync amount when total changes (if not manually edited)
  useEffect(() => {
    if (!isAmountEdited && grandTotal > 0) {
      store.setAmountReceived(grandTotal);
    } else if (!isAmountEdited && grandTotal === 0) {
      store.setAmountReceived(0);
    }
  }, [grandTotal, isAmountEdited]);

  const filtered = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone && c.phone.includes(custSearch)))
    : customers;

  const handleSave = async () => {
    if (bill.items.length === 0) { toast.error("Add items first"); return; }
    setSaving(true);
    try {
      let cId = bill.customer?._id;
      let cName = bill.customer?.name || "Walk-in Customer";
      if (!cId) {
        const w = customers.find(c => c.name.toLowerCase().includes("walk-in") || c.name.toLowerCase().includes("cash"));
        if (w) { cId = w._id; cName = w.name; }
        else { const n = await customerService.create({ name: "Walk-in Customer", phone: "0000000000", isActive: true }); cId = n._id; cName = n.name; }
      }
      const subtotal = bill.items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);
      const taxAmt = bill.items.reduce((s, i) => s + i.taxAmount, 0);
      const savedSale = await saleService.create({
        customer: cId, customerName: cName, saleDate: new Date().toISOString(),
        items: bill.items.map(i => ({ product: i.productId || undefined, name: i.itemName, sku: i.itemCode, quantity: i.quantity, unitPrice: i.pricePerUnit, purchasePrice: i.purchasePrice, total: i.total })),
        subtotal, taxAmount: taxAmt, totalAmount: grandTotal, amountPaid: bill.amountReceived || grandTotal,
        status: "completed", paymentStatus: "paid", paymentMethod: bill.paymentMode.toLowerCase(), notes: bill.remarks,
      });
      toast.success("Sale saved!"); 
      setPrintSaleData(savedSale);
      store.resetActiveBill();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const modes = ["Cash", "UPI", "Card", "Bank", "Wallet"];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Date */}
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="date" defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full h-10 pl-10 pr-3 text-sm font-semibold bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
      </div>

      {/* Customer */}
      <div className="px-3 py-2.5 border-b border-border/40 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={bill.customer ? bill.customer.name : custSearch}
            onChange={(e) => { setCustSearch(e.target.value); setShowDD(true); store.setCustomer(null); }}
            onFocus={() => setShowDD(true)}
            placeholder="Search customer [F11]"
            className="w-full h-10 pl-10 pr-8 text-sm bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {showDD && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 flex flex-col">
            <button 
              onClick={() => { setShowCustomerModal(true); setShowDD(false); setCustSearch(""); }} 
              className="px-3 py-2.5 text-left text-sm font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add New Customer
            </button>
            {!bill.customer && filtered.slice(0, 6).map(c => (
              <button key={c._id} onClick={() => { store.setCustomer(c); setShowDD(false); setCustSearch(""); }}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex justify-between">
                <span className="font-medium">{c.name}</span>
                {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
              </button>
            ))}
            {!bill.customer && filtered.length === 0 && <div className="p-3 text-center text-sm text-muted-foreground">No customer found</div>}
          </div>
        )}
      </div>

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

      {/* Payment Mode + Amount */}
      <div className="p-3 flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground pl-0.5">Payment Mode</label>
            <div className="relative">
              <select value={bill.paymentMode} onChange={(e) => store.setPaymentMode(e.target.value)}
                className="w-full h-10 pl-3 pr-7 text-sm font-semibold bg-muted/30 border border-border/50 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all">
                {modes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
          disabled={saving || bill.items.length === 0}
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
      {showCustomerModal && (
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
      )}
    </div>
  );
}
