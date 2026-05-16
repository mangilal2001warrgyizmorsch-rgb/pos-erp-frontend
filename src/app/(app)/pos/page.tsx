"use client";

import { usePOSStore } from "@/store/posStore";
import { useThemeStore } from "@/store/themeStore";
import { POSTopBar } from "@/components/pos/POSTopBar";
import { POSItemTable } from "@/components/pos/POSItemTable";
import { POSShortcutActions } from "@/components/pos/POSShortcutActions";
import { POSRightPanel } from "@/components/pos/POSRightPanel";
import { usePOSShortcuts } from "@/hooks/usePOSShortcuts";
import { toast } from "sonner";

export default function FastPOSPage() {
  const { sidebarCollapsed } = useThemeStore();
  const { setActiveModal, getActiveBill, removeItem } = usePOSStore();

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

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col bg-background overflow-hidden"
      style={{
        left: sidebarCollapsed ? 72 : 256,
        transition: "left 0.3s ease-in-out",
      }}
    >
      {/* ═══ Top Bar: Tabs + Search + Icons ═══ */}
      <POSTopBar />

      {/* ═══ Main Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Table + Shortcuts */}
        <div className="flex flex-col flex-1 min-w-0">
          <POSItemTable />
          <POSShortcutActions />
        </div>

        {/* Right — Billing Panel */}
        <div className="w-[320px] xl:w-[340px] shrink-0 border-l border-border/50 flex flex-col">
          <POSRightPanel />
        </div>
      </div>
    </div>
  );
}
