"use client";

import { useState, useEffect } from "react";
import { usePOSStore } from "@/store/posStore";
import { useThemeStore } from "@/store/themeStore";
import { POSItemTable } from "@/components/pos/POSItemTable";
import { POSRightPanel } from "@/components/pos/POSRightPanel";
import { usePOSShortcuts } from "@/hooks/usePOSShortcuts";
import { toast } from "sonner";
import { ShoppingCart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FastPOSPage() {
  const { sidebarCollapsed } = useThemeStore();
  const { setActiveModal, getActiveBill, removeItem, addItem } = usePOSStore();
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

  useEffect(() => {
    const preventNumberWheelChange = (event: WheelEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement &&
        activeElement.type === "number"
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", preventNumberWheelChange, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", preventNumberWheelChange, {
        capture: true,
      });
    };
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

  return (
    <div
      className="fixed bottom-0 right-0 z-20 flex flex-col bg-background overflow-hidden"
      style={{
        top: 64,
        left: isMobile ? 0 : (sidebarCollapsed ? 72 : 256),
        transition: "left 0.3s ease-in-out",
      }}
    >
      {/* ═══ Main Body ═══ */}
      <div className="flex flex-1 overflow-hidden bg-background">
        {/* Left — Table + Shortcuts */}
        <div 
          className={cn(
            "flex flex-col flex-1 min-w-0 bg-background",
            isMobile && activeTab !== "cart" && "hidden"
          )}
        >
          <POSItemTable />
        </div>

        {/* Right — Billing Panel */}
        <div 
          className={cn(
            "w-[300px] xl:w-[320px] shrink-0 flex flex-col bg-card shadow-2xl",
            "border-l border-border/40 dark:border-border/60",
            isMobile && (activeTab !== "pay" ? "hidden" : "w-full border-l-0 shadow-lg")
          )}
        >
          <POSRightPanel />
        </div>
      </div>

      {/* Mobile Bottom Navigation (only visible below lg breakpoint) */}
      <div className={cn(
        "lg:hidden shrink-0 h-16 border-t border-border/40",
        "bg-card dark:bg-card flex items-center justify-around px-4 z-30",
        "shadow-lg"
      )}>
        <button
          onClick={() => setActiveTab("cart")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative",
            "rounded-lg hover:bg-secondary/50",
            activeTab === "cart" 
              ? "text-primary font-bold" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
          {activeTab === "cart" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-primary" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("pay")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative",
            "rounded-lg hover:bg-secondary/50",
            activeTab === "pay" 
              ? "text-primary font-bold" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pay</span>
          {activeTab === "pay" && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
