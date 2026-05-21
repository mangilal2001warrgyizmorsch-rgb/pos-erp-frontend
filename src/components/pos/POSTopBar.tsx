import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, X, Plus, Search, ChevronDown, Calendar, User } from "lucide-react";
import { usePOSStore, WALK_IN_CUSTOMER } from "@/store/posStore";
import { customerService } from "@/services/customerService";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";
import { CustomerModal } from "@/components/shared/CustomerModal";

export function POSTopBar() {
  const { bills, activeBillId, setActiveBill, createNewBill, closeBill, getActiveBill, setCustomer } = usePOSStore();
  const bill = getActiveBill();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showDD, setShowDD] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Ctrl+T to new bill, Ctrl+W to close active bill
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "t") { e.preventDefault(); createNewBill(); }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        if (activeBillId) closeBill(activeBillId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [activeBillId, createNewBill, closeBill]);

  // Load customers
  useEffect(() => {
    customerService.getAll({ limit: 200 }).then(r => {
      setCustomers(r.data);
    }).catch(() => {});
  }, []);

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDD(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone && c.phone.includes(custSearch)))
    : customers;

  const isWalkIn = !bill?.customer || bill.customer._id === "walk-in";
  const customerDisplayName = isWalkIn ? "" : (bill?.customer?.name || "");

  return (
    <div className="shrink-0 bg-card border-b border-border flex flex-col relative">
      {/* Row 1: Tabs + Customer + Date */}
      <div className="flex items-center py-2 lg:py-0 px-3 gap-2 h-14">
        {/* Bill Tabs */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Exit POS / Go to Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-black border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 mr-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit POS</span>
          </Link>
          {bills.map((b) => {
            const active = b.id === activeBillId;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBill(b.id)}
                className={cn(
                  "group flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>#{b.billNo}</span>
                {active && <span className="text-[9px] opacity-70 font-mono hidden sm:inline">CTRL+W</span>}
                {bills.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); closeBill(b.id); }}
                    className={cn(
                      "rounded-full p-0.5 transition-all",
                      active ? "hover:bg-white/20" : "opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={createNewBill}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New Bill
            <span className="text-[9px] opacity-70 font-mono ml-0.5 hidden sm:inline">Ctrl+T</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Customer Section */}
        <div className="relative shrink-0 hidden md:block" ref={wrapperRef}>
          <div className="relative flex items-center">
            <User className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
            <input
              value={isWalkIn ? custSearch : customerDisplayName}
              onChange={(e) => { setCustSearch(e.target.value); setShowDD(true); if (!isWalkIn) setCustomer(WALK_IN_CUSTOMER); }}
              onFocus={() => setShowDD(true)}
              placeholder="Walk-in Customer"
              className="w-[200px] xl:w-[220px] h-8 pl-8 pr-8 text-xs font-semibold bg-muted/30 border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
            {!isWalkIn ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setCustomer(WALK_IN_CUSTOMER); setCustSearch(""); setShowDD(true); }}
                className="absolute right-2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            )}
          </div>

          {/* Customer dropdown */}
          {showDD && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 flex flex-col min-w-[240px]">
              <button 
                onClick={() => { setShowCustomerModal(true); setShowDD(false); setCustSearch(""); }} 
                className="px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 border-b border-border/50 sticky top-0 bg-card z-10 flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Customer
              </button>
              {/* Walk-in option always at top */}
              <button
                onClick={() => { setCustomer(WALK_IN_CUSTOMER); setShowDD(false); setCustSearch(""); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between border-b border-border/20",
                  isWalkIn && "bg-primary/5"
                )}
              >
                <span className="font-medium text-muted-foreground">Walk-in Customer</span>
                <span className="text-[10px] text-muted-foreground/50">Default</span>
              </button>
              {filtered.slice(0, 6).map(c => (
                <button key={c._id} onClick={() => { setCustomer(c); setShowDD(false); setCustSearch(""); }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors flex justify-between">
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                </button>
              ))}
              {filtered.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">No customer found</div>}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="relative shrink-0 hidden md:block">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input 
            type="date" 
            defaultValue={new Date().toISOString().split("T")[0]}
            className="h-8 pl-8 pr-2 text-xs font-semibold bg-muted/30 border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all w-[140px]" 
          />
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <CustomerModal 
          open={showCustomerModal} 
          onOpenChange={setShowCustomerModal} 
          onSuccess={(customer) => {
            if (customer) {
              setCustomers(prev => [...prev, customer]);
              setCustomer(customer);
            }
            setShowCustomerModal(false);
          }} 
        />
      )}
    </div>
  );
}
