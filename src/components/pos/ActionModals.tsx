import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { formatCurrency, cn } from "@/lib/utils";

type ModalType = "qty" | "itemDisc" | "unit" | "addCharges" | "billDisc" | "loyalty" | "remarks" | null;

interface Props {
  type: ModalType;
  onClose: () => void;
}

export function ActionModals({ type, onClose }: Props) {
  const { getActiveBill, updateItem, updateBillField } = usePOSStore();
  const bill = getActiveBill();
  
  const [val, setVal] = useState<string>("");
  const [val2, setVal2] = useState<string>(""); // For discount flat
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  const selectedItem = bill && bill.selectedRowIndex >= 0 ? bill.items[bill.selectedRowIndex] : null;

  useEffect(() => {
    if (!type || !bill) return;
    
    // Init values
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
      // Note: If using flat discount (val2), we would need to convert it to % or handle it in store.
      // Keeping it simple as % for now as per ModifyItemModal logic
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

  const needSelection = ["qty", "itemDisc", "unit"].includes(type) && !selectedItem;

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
