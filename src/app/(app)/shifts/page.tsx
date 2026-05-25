"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Play, StopCircle, IndianRupee, AlertCircle, CheckCircle2, History, Monitor, Wallet, CreditCard, Smartphone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { printShiftSummary } from "@/lib/print/shiftSummaryPrint";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import { useRouter } from "next/navigation";

interface Shift {
  _id: string;
  status: "open" | "closed";
  cashierName?: string;
  openingCash: number;
  openingTime: string;
  closingTime?: string;
  expectedCash?: number;
  actualCash?: number;
  totalSales?: number;
  totalSalesCash?: number;
  totalSalesCard?: number;
  totalSalesUpi?: number;
  difference?: number;
  notes?: string;
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

export default function ShiftsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useBusinessStore();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [openNotes, setOpenNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCurrentShift = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/shifts/current");
      setCurrentShift(res.data.data);
    } catch {
      toast.error("Failed to load shift info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The initial server fetch resolves asynchronously and then hydrates shift state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCurrentShift();
  }, [loadCurrentShift]);

  const handleOpenShift = async () => {
    const amount = Number(openingCash);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Opening cash cannot be negative");
      return;
    }
    if (!cashierName.trim()) {
      toast.error("Cashier name is required");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/shifts/open", { openingCash: amount, cashierName, notes: openNotes });
      toast.success("Shift opened successfully");
      setOpenDialogOpen(false);
      setCashierName("");
      setOpenNotes("");
      await loadCurrentShift();
      router.push("/pos");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to open shift"));
    } finally {
      setSubmitting(false);
    }
  };

  const printReport = (shift: Shift) => {
    if (!printShiftSummary(shift, profile, shift.cashierName || user?.name)) {
      toast.error("Popup blocker blocked printing the shift summary");
    }
  };

  const handleCloseShift = async () => {
    if (!closingCash) {
      toast.error("Please enter actual closing cash");
      return;
    }
    const amount = Number(closingCash);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Closing cash cannot be negative");
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.put("/shifts/close", { closingCash: amount, notes: closeNotes });
      toast.success("Shift closed successfully");
      setCloseDialogOpen(false);
      setCloseNotes("");
      if (res.data && res.data.data) {
        printReport(res.data.data);
      }
      loadCurrentShift();
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Failed to close shift"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Cashier Sessions"
        description="Manage your drawer opening and closing"
        icon={Clock}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : currentShift ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <div className="flex flex-col gap-5 border-b border-border/60 bg-gradient-to-r from-emerald-500/[0.07] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <h2 className="text-xl font-bold">Active Shift</h2>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Open</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(currentShift.openingTime).toLocaleString("en-IN")}
                </p>
                {currentShift.cashierName && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Cashier: {currentShift.cashierName}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => router.push("/pos")} className="h-11 gap-2 bg-emerald-600 px-5 text-white hover:bg-emerald-700">
                  <Monitor className="h-4 w-4" /> Open POS
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCloseDialogOpen(true)} className="h-11 gap-2 border-rose-200 px-5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30">
                  <StopCircle className="h-4 w-4" /> End Shift
                </Button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Drawer Summary</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Opening Cash</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">{formatCurrency(currentShift.openingCash)}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                  <p className="text-xs font-medium text-muted-foreground">Cash Sales</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(currentShift.totalSalesCash || 0)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Other Sales</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">{formatCurrency((currentShift.totalSalesCard || 0) + (currentShift.totalSalesUpi || 0))}</p>
                </div>
                <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] p-4">
                  <p className="text-xs font-medium text-muted-foreground">Expected Drawer</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-primary">{formatCurrency(currentShift.expectedCash || 0)}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-2xl border-border/60 p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><IndianRupee className="h-4 w-4" /></div>
                  <h3 className="font-semibold">Payment Breakdown</h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/25 p-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /> Cash</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(currentShift.totalSalesCash || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/25 p-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-4 w-4" /> Card</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(currentShift.totalSalesCard || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/25 p-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Smartphone className="h-4 w-4" /> UPI</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(currentShift.totalSalesUpi || 0)}</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-dashed border-border/80 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-muted p-2.5 text-muted-foreground"><History className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold">Session Reports</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">View closed session history and shift summaries from Reports.</p>
                  <Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => router.push("/reports")}>View reports <ArrowRight className="ml-1 h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card className="p-12 text-center space-y-6 border-dashed border-2 shadow-none bg-muted/30">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Play className="h-10 w-10 text-primary translate-x-0.5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Active Shift</h2>
              <p className="text-muted-foreground">You must open a shift before you can start making sales at the POS.</p>
            </div>
            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20" onClick={() => setOpenDialogOpen(true)}>
              Start New Shift
            </Button>
          </Card>
        </div>
      )}

      {/* Open Shift Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open New Shift</DialogTitle>
            <DialogDescription>Enter the starting cash amount in your drawer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cashier Name *</Label>
              <Input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="e.g. Imam"
                className="h-14 text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Cash (₹) *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <Input type="number" className="h-14 pl-8 text-xl font-bold" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} placeholder="Counter No, remarks etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleOpenShift} disabled={submitting}>
              {submitting ? "Opening..." : "Open Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Cashier Shift</DialogTitle>
            <DialogDescription>Reconcile your cash drawer before closing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Cash:</span>
                <span className="font-bold">{formatCurrency(currentShift?.expectedCash || 0)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Calculated as: Opening + Cash Sales + Cash In - Cash Out</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Actual Cash in Drawer (₹) *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <Input type="number" className="h-14 pl-8 text-xl font-bold" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} placeholder="0.00" autoFocus />
              </div>
            </div>

            {closingCash && (() => {
              const actual = Number(closingCash);
              const expected = currentShift?.expectedCash || 0;
              const isBalanced = Math.abs(actual - expected) < 0.01;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 border ${isBalanced ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"}`}>
                  {isBalanced ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {isBalanced ? "Drawer Balanced" : `Difference: ${formatCurrency(actual - expected)}`}
                    </p>
                    <p className="text-[10px] opacity-80">Final reconcile for today&apos;s session</p>
                  </div>
                </motion.div>
              );
            })()}

            <div className="space-y-2">
              <Label>Closing Notes</Label>
              <Input value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Optional closing notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCloseShift} disabled={submitting}>
              {submitting ? "Closing..." : "Close Shift & Print Summary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
