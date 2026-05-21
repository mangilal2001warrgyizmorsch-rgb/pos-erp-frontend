import { useState, useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveNew: () => void;
}

export function MultiPayModal({ open, onClose, onSave, onSaveNew }: Props) {
  const store = usePOSStore();
  const bill = store.getActiveBill();
  
  const [cashAmount, setCashAmount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when bill changes
  useEffect(() => {
    if (!bill || !open) return;
    setCashAmount(bill.amountReceived || 0);
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
  // Based on the reference, the amount is just the cash amount inputted.
  const balance = grandTotal - cashAmount;
  const isLess = cashAmount < grandTotal;

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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold">1</span>
              <span className="text-base font-bold">Cash</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <input
                  ref={inputRef}
                  type="number"
                  min={0}
                  step="0.01"
                  value={cashAmount || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCashAmount(val);
                    store.setAmountReceived(val);
                  }}
                  className="w-full h-10 pl-7 pr-3 text-sm font-bold bg-muted/20 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-4 border-dashed">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black">
              <span>Balance</span>
              <span>{formatCurrency(Math.max(0, balance))}</span>
            </div>
            {isLess && !bill.customer && (
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
            onClick={onSave}
            disabled={isLess && !bill.customer}
            className="flex-1 h-11 bg-muted-foreground/20 hover:bg-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xs uppercase tracking-wide rounded-lg transition-colors"
          >
            Save & Print Bill [Ctrl+P]
          </button>
          <button
            onClick={onSaveNew}
            disabled={isLess && !bill.customer}
            className="flex-1 h-11 bg-muted-foreground/20 hover:bg-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold text-xs uppercase tracking-wide rounded-lg transition-colors"
          >
            Save & New Bill [Ctrl+N]
          </button>
        </div>
      </div>
    </div>
  );
}
