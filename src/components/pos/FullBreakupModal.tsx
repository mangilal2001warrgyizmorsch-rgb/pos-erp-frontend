import { useEffect } from "react";
import { X } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { formatCurrency } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FullBreakupModal({ open, onClose }: Props) {
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-black tracking-tight">Full Bill Breakup</h2>
          <button onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
            <span className="text-[10px] font-mono opacity-60">[Esc]</span>
          </button>
        </div>

        {/* Body */}
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

          {/* Total row */}
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
