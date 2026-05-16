import { usePOSStore } from "@/store/posStore";
import { toast } from "sonner";
import { ActionModals } from "./ActionModals";

export function POSShortcutActions() {
  const { getActiveBill, removeItem, activeModal, setActiveModal } = usePOSStore();
  const bill = getActiveBill();

  const handleRemove = () => {
    if (!bill || bill.selectedRowIndex < 0 || !bill.items[bill.selectedRowIndex]) return;
    removeItem(bill.items[bill.selectedRowIndex].id);
    toast.success("Item removed");
  };

  const row1 = [
    { label: "Change\nQuantity", key: "F2", action: () => setActiveModal("qty") },
    { label: "Item\nDiscount", key: "F3", action: () => setActiveModal("itemDisc") },
    { label: "Remove\nItem", key: "F4", action: handleRemove, danger: true },
    { label: "Change\nUnit", key: "F6", action: () => setActiveModal("unit") },
  ];
  const row2 = [
    { label: "Additional\nCharges", key: "F8", action: () => setActiveModal("addCharges") },
    { label: "Bill\nDiscount", key: "F9", action: () => setActiveModal("billDisc") },
    { label: "Loyalty\nPoints", key: "F10", action: () => setActiveModal("loyalty") },
    { label: "Remarks", key: "F12", action: () => setActiveModal("remarks") },
  ];

  const Btn = ({ btn }: { btn: typeof row1[0] }) => (
    <button
      onClick={(btn as any).action}
      className={`flex-1 h-[42px] flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.08em] border transition-colors leading-tight text-center whitespace-pre-line
        ${(btn as any).danger
          ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : "border-primary/20 bg-primary/[0.03] text-primary hover:bg-primary/10"
        }
      `}
    >
      <span>{btn.label}</span>
      <span className="opacity-50 font-mono">[{btn.key}]</span>
    </button>
  );

  return (
    <>
      <div className="shrink-0 px-3 py-2 bg-card border-t border-border/50 space-y-1.5">
        <div className="flex gap-1.5">{row1.map(b => <Btn key={b.key} btn={b} />)}</div>
        <div className="flex gap-1.5">{row2.map(b => <Btn key={b.key} btn={b} />)}</div>
      </div>
      <ActionModals type={activeModal} onClose={() => setActiveModal(null)} />
    </>
  );
}
