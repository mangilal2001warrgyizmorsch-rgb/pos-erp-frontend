import { X, Plus } from "lucide-react";
import { usePOSStore } from "@/store/posStore";
import { cn } from "@/lib/utils";

export function POSBillTabs() {
  const { bills, activeBillId, setActiveBill, createNewBill, closeBill } = usePOSStore();

  return (
    <div className="flex items-center bg-muted/40 border-b border-border px-1 h-11 shrink-0">
      {/* Bill tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
        {bills.map((bill) => {
          const isActive = activeBillId === bill.id;
          return (
            <button
              key={bill.id}
              onClick={() => setActiveBill(bill.id)}
              className={cn(
                "group relative flex items-center gap-2 px-4 h-10 text-sm font-semibold transition-all rounded-t-lg",
                isActive
                  ? "bg-background text-foreground border-t-2 border-t-primary border-x border-x-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <span className="font-bold">#{bill.billNo}</span>
              {isActive && (
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest">Ctrl+W</span>
              )}
              {bills.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }}
                  className={cn(
                    "rounded-full p-0.5 transition-all hover:bg-destructive/10 hover:text-destructive",
                    isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60"
                  )}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              {/* Active bottom mask */}
              {isActive && <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-background" />}
            </button>
          );
        })}
      </div>

      {/* New bill button */}
      <button
        onClick={createNewBill}
        className="flex items-center gap-1.5 ml-1 px-3 h-8 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New Bill</span>
        <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[9px] text-muted-foreground">Ctrl+T</kbd>
      </button>
    </div>
  );
}
