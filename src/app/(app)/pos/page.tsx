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
  const { setActiveModal, getActiveBill, removeItem } = usePOSStore();
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
    onFocusCustomer: () => setActiveModal("qty"), // F2 maps to focusCustomer in shortcuts config, repurposing it for Change Quantity
    onHoldSale: () => setActiveModal("itemDisc"), // F3 maps to holdSale, repurposing for Item Discount
    onOpenPayment: () => { // F4 maps to openPayment, repurposing for Remove Item
      const bill = getActiveBill();
      if (bill && bill.selectedRowIndex >= 0 && bill.items[bill.selectedRowIndex]) {
        removeItem(bill.items[bill.selectedRowIndex].id);
        toast.success("Item removed");
      }
    },
    onOpenCart: () => setActiveModal("unit"), // F6 maps to openCart, repurposing for Change Unit
    onSelectCash: () => setActiveModal("addCharges"), // F8 maps to selectCash, repurposing for Add Charges
    onSelectCard: () => setActiveModal("billDisc"), // F9 maps to selectCard, repurposing for Bill Discount
    onSelectUPI: () => setActiveModal("loyalty"), // F10 maps to selectUPI, repurposing for Loyalty Points
    onNewSale: () => setActiveModal("remarks"), // F12 maps to newSale, repurposing for Remarks
  });

  const bill = getActiveBill();
  const totalQty = bill ? bill.items.reduce((s, i) => s + i.quantity, 0) : 0;
  const grandTotal = bill ? bill.items.reduce((s, i) => s + i.total, 0) : 0;

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
            "w-[320px] xl:w-[340px] shrink-0 border-l border-border/50 flex flex-col bg-card",
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
