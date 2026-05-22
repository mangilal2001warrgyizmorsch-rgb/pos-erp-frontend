import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, Plus, Trash2 } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { formatCurrency, formatNumberInputValue } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveNew: () => void;
}

export function MultiPayModal({ open, onClose, onSave, onSaveNew }: Props) {
  const store = usePOSStore();
  const bill = store.getActiveBill();
  
  const [payments, setPayments] = useState<Array<{ id: string; mode: string; amount: number }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when bill changes
  useEffect(() => {
    if (!bill || !open) return;
    const realItems = bill.items.filter(i => i.itemName !== "");
    const grandTotal = realItems.reduce((s, i) => s + i.total, 0);
    const existingAmount = bill.amountReceived || 0;
    const firstAmount = existingAmount > 0 && existingAmount < grandTotal ? existingAmount : 0;
    const balanceAmount = Math.max(0, grandTotal - firstAmount);

    setPayments([
      { id: crypto.randomUUID(), mode: "Cash", amount: firstAmount },
      { id: crypto.randomUUID(), mode: "UPI", amount: balanceAmount },
    ]);
  }, [bill, open]);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Esc to close
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-black tracking-tight">Multi Pay</h2>
          <button onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
            <span className="text-[10px] font-mono opacity-60">[Esc]</span>
          </button>
        </div>

        {/* Body */}
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

        {/* Footer */}
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
