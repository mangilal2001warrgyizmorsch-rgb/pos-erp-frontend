"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Play, StopCircle, IndianRupee, AlertCircle, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";

interface Shift {
  _id: string;
  status: "open" | "closed";
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

export default function ShiftsPage() {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCurrentShift = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/shifts/current");
      setCurrentShift(res.data.data);
    } catch {
      toast.error("Failed to load shift info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentShift();
  }, [loadCurrentShift]);

  const handleOpenShift = async () => {
    try {
      setSubmitting(true);
      await axios.post("/api/shifts/open", { openingCash: Number(openingCash), notes });
      toast.success("Shift opened successfully");
      setOpenDialogOpen(false);
      loadCurrentShift();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to open shift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!closingCash) {
      toast.error("Please enter actual closing cash");
      return;
    }
    try {
      setSubmitting(true);
      await axios.put("/api/shifts/close", { closingCash: Number(closingCash), notes });
      toast.success("Shift closed successfully");
      setCloseDialogOpen(false);
      loadCurrentShift();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to close shift");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shift Status Card */}
          <Card className="md:col-span-2 p-8 border-t-4 border-t-emerald-500 shadow-xl shadow-emerald-500/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h2 className="text-2xl font-bold">Shift is Active</h2>
                </div>
                <p className="text-muted-foreground">Opened at: {new Date(currentShift.openingTime).toLocaleString()}</p>
              </div>
              <Button size="lg" variant="destructive" onClick={() => setCloseDialogOpen(true)} className="h-14 px-8 text-lg font-bold">
                <StopCircle className="mr-2 h-6 w-6" /> End Shift
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Opening Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(currentShift.openingCash)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sales (Cash)</p>
                <p className="text-2xl font-bold text-emerald-500">+{formatCurrency(currentShift.totalSalesCash || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Other Sales</p>
                <p className="text-xl font-semibold">{formatCurrency((currentShift.totalSalesCard || 0) + (currentShift.totalSalesUpi || 0))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expected In Drawer</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(currentShift.expectedCash || 0)}</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="p-6 bg-primary/5 border-primary/10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Payment Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Sales</span>
                  <span className="font-medium">{formatCurrency(currentShift.totalSalesCash || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card Sales</span>
                  <span className="font-medium">{formatCurrency(currentShift.totalSalesCard || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UPI Sales</span>
                  <span className="font-medium">{formatCurrency(currentShift.totalSalesUpi || 0)}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
              <History className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs font-medium">Session history and reports are available in the Reports section</p>
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
              <Label>Opening Cash (₹) *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <Input type="number" className="h-14 pl-8 text-xl font-bold" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Counter No, Cashier Name etc." />
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

            {closingCash && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 border ${Number(closingCash) === currentShift?.expectedCash ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"}`}>
                {Number(closingCash) === currentShift?.expectedCash ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {Number(closingCash) === currentShift?.expectedCash ? "Drawer Balanced" : `Difference: ${formatCurrency(Number(closingCash) - (currentShift?.expectedCash || 0))}`}
                  </p>
                  <p className="text-[10px] opacity-80">Final reconcile for today's session</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label>Closing Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional closing notes..." />
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
