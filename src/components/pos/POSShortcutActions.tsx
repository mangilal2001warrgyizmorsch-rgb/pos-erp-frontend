import { usePOSStore, createPlaceholderItem } from "@/store/posStore";
import { toast } from "sonner";
import { ActionModals } from "./ActionModals";

export function POSShortcutActions() {
  const { getActiveBill, removeItem, addItem, activeModal, setActiveModal, selectRow } = usePOSStore();
  const bill = getActiveBill();

  const handleRemove = () => {
    if (!bill || bill.items.length === 0) return;
    const lastItem = bill.items[bill.items.length - 1];
    removeItem(lastItem.id);
    toast.success("Row removed");
  };

  const handleAddRow = () => {
    if (bill) {
      addItem({ itemName: "", customItem: true, unit: "Pcs" });
      toast.success("New row added");
    }
  };

  const buttons = [
    { label: "Remove Item", key: "F1", action: handleRemove, danger: true },
    { label: "Add New Row", key: "F2", action: handleAddRow },
    { label: "Change Qty", key: "F3", action: () => setActiveModal("qty") },
    { label: "Add Discount", key: "F5", action: () => setActiveModal("itemDisc") },
    { label: "Change Unit", key: "F6", action: () => setActiveModal("unit") },
    { label: "Add Charges", key: "F8", action: () => setActiveModal("addCharges") },
    { label: "Bill Discount", key: "F9", action: () => setActiveModal("billDisc") },
    { label: "Loyalty Points", key: "F10", action: () => setActiveModal("loyalty") },
    { label: "Remarks", key: "F12", action: () => setActiveModal("remarks") },
  ];

  const Btn = ({ btn }: { btn: typeof buttons[0] }) => (
    <button
      onClick={btn.action}
      className={`h-[42px] px-2 flex items-center justify-center gap-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-[0.08em] border transition-colors leading-tight text-center
        ${btn.danger
          ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : "border-primary/20 bg-primary/[0.03] text-primary hover:bg-primary/10"
        }
      `}
    >
      <span className="truncate">{btn.label}</span>
      <span className="opacity-50 font-mono hidden sm:inline">[{btn.key}]</span>
    </button>
  );

  return (
    <>
      <div className="shrink-0 px-3 py-2 bg-card border-t border-border/50">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {buttons.map(b => <Btn key={b.key} btn={b} />)}
        </div>
      </div>
      <ActionModals type={activeModal} onClose={() => setActiveModal(null)} />
    </>
  );
}
