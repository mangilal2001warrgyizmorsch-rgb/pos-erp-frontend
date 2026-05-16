import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePOSStore, type POSItem } from "@/store/posStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  item: POSItem | null;
  onClose: () => void;
}

export function ModifyItemModal({ item, onClose }: Props) {
  const { updateItem } = usePOSStore();

  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("Pcs");
  const [discPercent, setDiscPercent] = useState(0);
  const [discRupee, setDiscRupee] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [freeQty, setFreeQty] = useState(0);
  const [updatePermanently, setUpdatePermanently] = useState(false);

  const qtyRef = useRef<HTMLInputElement>(null);

  // Sync state when item changes
  useEffect(() => {
    if (!item) return;
    setQty(item.quantity);
    setUnit(item.unit);
    setDiscPercent(item.discount || 0);
    setDiscRupee(0);
    setNewPrice(item.pricePerUnit);
    setFreeQty(0);
  }, [item]);

  // Auto-focus qty on open
  useEffect(() => {
    if (item) setTimeout(() => qtyRef.current?.select(), 100);
  }, [item]);

  // Esc to close
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Item info */}
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

          {/* Quantity + Unit */}
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

          {/* Discount % / ₹ */}
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

          {/* New Price + Free Qty */}
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

          {/* Update permanently checkbox */}
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

        {/* Footer */}
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
