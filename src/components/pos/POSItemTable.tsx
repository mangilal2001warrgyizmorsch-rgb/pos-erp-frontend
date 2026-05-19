import { useState } from "react";
import { usePOSStore, type POSItem } from "@/store/posStore";
import { formatCurrency, cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ModifyItemModal } from "./ModifyItemModal";

export function POSItemTable() {
  const { getActiveBill, updateItem, removeItem, selectRow } = usePOSStore();
  const bill = getActiveBill();
  const [editItem, setEditItem] = useState<POSItem | null>(null);

  if (!bill) return null;

  const EMPTY_ROWS = Math.max(0, 14 - bill.items.length);

  const handleRowClick = (item: POSItem, idx: number) => {
    selectRow(idx);
    setEditItem(item);
  };

  return (
    <>
      {/* Mobile Card-based Cart List */}
      <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3">
        {bill.items.map((item, idx) => {
          const sel = bill.selectedRowIndex === idx;
          return (
            <div
              key={item.id}
              onClick={() => handleRowClick(item, idx)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative",
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
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/10 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Qty</span>
                  <span className="font-bold text-sm text-foreground">{item.quantity} {item.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Price/Unit</span>
                  <span className="font-semibold text-sm text-foreground">{formatCurrency(item.pricePerUnit)}</span>
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
        {bill.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60 space-y-2">
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs text-center px-4 text-muted-foreground/45">Scan products or use search bar above to add items</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/50 backdrop-blur-md border-b-2 border-border/60">
              <th className="w-12 px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">#</th>
              <th className="w-[15%] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">Item Code</th>
              <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">Item Name</th>
              <th className="w-[7%] px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">Qty</th>
              <th className="w-[8%] px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">Unit</th>
              <th className="w-[14%] px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">
                Price/Unit(₹)
                <div className="text-[8px] font-semibold opacity-50 normal-case tracking-normal mt-0.5">With Tax</div>
              </th>
              <th className="w-[12%] px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground border-r border-border/30">
                Tax Applied(₹)
              </th>
              <th className="w-[13%] px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                Total(₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => {
              const sel = bill.selectedRowIndex === idx;
              return (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item, idx)}
                  className={cn(
                    "border-b border-border/20 transition-all cursor-pointer group",
                    sel ? "bg-primary/[0.06]" : "hover:bg-muted/20"
                  )}
                >
                  {/* # */}
                  <td className="px-2 py-2 text-center border-r border-border/20">
                    <span className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors",
                      sel ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Item Code */}
                  <td className="px-3 py-2 border-r border-border/20">
                    <span className="text-sm font-mono font-semibold">{item.barcode || item.itemCode || "—"}</span>
                  </td>

                  {/* Item Name */}
                  <td className="px-3 py-2 border-r border-border/20">
                    <span className="text-sm font-medium">{item.itemName || "—"}</span>
                  </td>

                  {/* Qty */}
                  <td className="px-2 py-2 text-center border-r border-border/20 text-sm font-bold tabular-nums">
                    {item.quantity.toFixed(2)}
                  </td>

                  {/* Unit */}
                  <td className="px-2 py-2 text-center border-r border-border/20 text-sm text-muted-foreground">
                    {item.unit}
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2 text-right border-r border-border/20 text-sm font-semibold tabular-nums">
                    {formatCurrency(item.pricePerUnit)}
                  </td>

                  {/* Tax */}
                  <td className="px-3 py-2 text-right border-r border-border/20">
                    <span className="text-sm tabular-nums">{formatCurrency(item.taxAmount)}</span>
                    {item.taxPercent > 0 && (
                      <span className="block text-[10px] text-muted-foreground">{item.taxPercent}% GST</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-black tabular-nums tracking-tight">{formatCurrency(item.total)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty filler rows */}
            {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
              <tr key={`e-${i}`} className="border-b border-border/10 h-[44px]">
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
                <td className="border-r border-border/10" />
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
    </>
  );
}
