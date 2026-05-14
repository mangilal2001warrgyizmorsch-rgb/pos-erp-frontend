"use client";

import { useState, useEffect } from "react";
import { Plus, Receipt, Search, Filter, MoreVertical, BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { chequeService } from "@/services/chequeService";
import { Cheque } from "@/types";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "received", chequeNumber: "", amount: "", date: new Date().toISOString().split('T')[0], partyName: "", bankName: ""
  });

  const fetchCheques = async () => {
    try {
      const response = await chequeService.getAll();
      if (response.success) {
        setCheques(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch cheques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.chequeNumber || !form.amount || !form.partyName) {
        toast.error("Please fill all required fields");
        return;
      }
      const response = await chequeService.create(form);
      if (response.success) {
        toast.success("Cheque entry added successfully");
        setIsAddModalOpen(false);
        setForm({ type: "received", chequeNumber: "", amount: "", date: new Date().toISOString().split('T')[0], partyName: "", bankName: "" });
        fetchCheques();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add cheque entry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cheques</h1>
          <p className="text-muted-foreground mt-1">Manage your incoming and outgoing cheques</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Cheque
          </Button>
        </div>
      </div>

      {cheques.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 min-h-[600px] border-0 shadow-sm bg-card">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">Manage All Your Cheques</h2>
            <p className="text-muted-foreground">
              Keep a record of all the cheques you receive and issue in one place.
            </p>

            <div className="py-16 flex justify-center">
              <div className="relative w-64 h-48 flex items-center justify-center">
                <Receipt className="w-32 h-32 text-muted/40" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-primary font-bold text-sm">₹</span>
                </motion.div>
              </div>
            </div>

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 shadow-md font-semibold text-base" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-5 w-5" /> Add Cheque
            </Button>
          </motion.div>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Cheque No</th>
                  <th className="p-4 text-left">Party Name</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {cheques.filter(c => 
                  c.partyName.toLowerCase().includes(search.toLowerCase()) || 
                  c.chequeNumber.includes(search)
                ).map((cheque) => (
                  <tr key={cheque._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">{new Date(cheque.date).toLocaleDateString()}</td>
                    <td className="p-4 font-mono">{cheque.chequeNumber}</td>
                    <td className="p-4 font-medium">{cheque.partyName}</td>
                    <td className="p-4">
                      <Badge variant={cheque.type === "received" ? "secondary" : "outline"} className="capitalize">
                        {cheque.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {cheque.status === "Cleared" ? (
                          <BadgeCheck className="h-4 w-4 text-emerald-500" />
                        ) : cheque.status === "Bounced" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          cheque.status === "Cleared" ? "text-emerald-500" : 
                          cheque.status === "Bounced" ? "text-red-500" : "text-amber-500"
                        )}>
                          {cheque.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-primary">
                      {formatCurrency(cheque.amount)}
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Cheque Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Add Cheque Entry
            </DialogTitle>
            <DialogDescription>
              Record an incoming or outgoing cheque for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Cheque Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received (In)</SelectItem>
                    <SelectItem value="issued">Issued (Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cdate">Cheque Date</Label>
                <Input id="cdate" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="party">Party Name</Label>
              <Input id="party" placeholder="Customer or Supplier Name" value={form.partyName} onChange={(e) => setForm({...form, partyName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cnum">Cheque Number</Label>
                <Input id="cnum" placeholder="000123" value={form.chequeNumber} onChange={(e) => setForm({...form, chequeNumber: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="camt">Amount</Label>
                <Input id="camt" type="number" placeholder="₹ 0.00" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Bank Name</Label>
              <Input id="bank" placeholder="Bank of the Cheque" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Cheque</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
