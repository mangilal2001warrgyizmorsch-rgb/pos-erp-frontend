"use client";

import { useState, useEffect } from "react";
import { usePOSStore } from "@/store/posStore";
import { useThemeStore } from "@/store/themeStore";
import { POSTopBar } from "@/components/pos/POSTopBar";
import { POSItemTable } from "@/components/pos/POSItemTable";
import { POSShortcutActions } from "@/components/pos/POSShortcutActions";
import { POSRightPanel } from "@/components/pos/POSRightPanel";
import { usePOSShortcuts } from "@/hooks/usePOSShortcuts";
import { toast } from "sonner";
import { ShoppingCart, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export default function FastPOSPage() {
  const { sidebarCollapsed } = useThemeStore();
  const { setActiveModal, getActiveBill, removeItem, addItem, selectRow } = usePOSStore();
  const [activeTab, setActiveTab] = useState<"cart" | "pay">("cart");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  usePOSShortcuts({
    onFocusSearch: () => { // F1 → Remove Item
      const bill = getActiveBill();
      if (bill && bill.items.length > 0) {
        const lastItem = bill.items[bill.items.length - 1];
        removeItem(lastItem.id);
        toast.success("Row removed");
      }
    },
    onFocusCustomer: () => { // F2 → Add New Row
      const bill = getActiveBill();
      if (bill) {
        addItem({ itemName: "", customItem: true, unit: "Pcs" });
        toast.success("New row added");
      }
    },
    onHoldSale: () => setActiveModal("qty"), // F3 → Change Quantity
    // F4 → No function
    onCompleteSale: () => setActiveModal("itemDisc"), // F5 → Add Discount
    onOpenCart: () => setActiveModal("unit"), // F6 → Change Unit
    // F7 → No function
    onSelectCash: () => setActiveModal("addCharges"), // F8 → Additional Charges
    onSelectCard: () => setActiveModal("billDisc"), // F9 → Bill Discount
    onSelectUPI: () => setActiveModal("loyalty"), // F10 → Loyalty Points
    onNewSale: () => setActiveModal("remarks"), // F12 → Remarks
  });

  const bill = getActiveBill();
  const realItems = bill ? bill.items.filter(i => i.itemName !== "") : [];
  const totalQty = realItems.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = realItems.reduce((s, i) => s + i.total, 0);

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col bg-background overflow-hidden"
      style={{
        left: isMobile ? 0 : (sidebarCollapsed ? 72 : 256),
        transition: "left 0.3s ease-in-out",
      }}
    >
      {/* ═══ Top Bar: Tabs + Search + Icons ═══ */}
      <POSTopBar />

      {/* ═══ Main Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Table + Shortcuts */}
        <div 
          className={cn(
            "flex flex-col flex-1 min-w-0",
            isMobile && activeTab !== "cart" && "hidden"
          )}
        >
          <POSItemTable />
          <POSShortcutActions />
        </div>

        {/* Right — Billing Panel */}
        <div 
          className={cn(
            "w-[280px] xl:w-[300px] shrink-0 border-l border-border/50 flex flex-col bg-card",
            isMobile && (activeTab !== "pay" ? "hidden" : "w-full border-l-0")
          )}
        >
          <POSRightPanel />
        </div>
      </div>

      {/* Mobile Bottom Navigation (only visible below lg breakpoint) */}
      <div className="lg:hidden shrink-0 h-16 border-t border-border/50 bg-card flex items-center justify-around px-4 z-30">
        <button
          onClick={() => setActiveTab("cart")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
            activeTab === "cart" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cart ({totalQty})</span>
          {activeTab === "cart" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b bg-primary" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("pay")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
            activeTab === "pay" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pay ({formatCurrency(grandTotal)})</span>
          {activeTab === "pay" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
