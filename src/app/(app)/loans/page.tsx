"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Calculator, LayoutDashboard, SlidersHorizontal, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { loanService } from "@/services/loanService";
import { Loan } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function LoanAccountsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    loanName: "", lenderName: "", totalAmount: "", interestRate: ""
  });

  const fetchLoans = async () => {
    try {
      const response = await loanService.getAll();
      if (response.success) {
        setLoans(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleEditClick = (loan: Loan) => {
    setEditLoan(loan);
    setForm({
      loanName: loan.loanName,
      lenderName: loan.lenderName,
      totalAmount: loan.totalAmount.toString(),
      interestRate: loan.interestRate.toString()
    });
  };

  const handleSave = async () => {
    try {
      if (!form.loanName || !form.lenderName || !form.totalAmount) {
        toast.error("Please fill all required fields");
        return;
      }
      const totalAmount = Number(form.totalAmount);
      const interestRate = Number(form.interestRate || 0);
      if (!totalAmount || totalAmount <= 0) {
        toast.error("Loan amount must be greater than 0");
        return;
      }
      if (Number.isNaN(interestRate) || interestRate < 0) {
        toast.error("Interest rate cannot be negative");
        return;
      }
      
      let response;
      if (editLoan) {
        response = await loanService.update(editLoan._id, form);
      } else {
        response = await loanService.create(form);
      }

      if (response.success) {
        toast.success(editLoan ? "Loan account updated successfully" : "Loan account added successfully");
        setIsAddModalOpen(false);
        setEditLoan(null);
        setForm({ loanName: "", lenderName: "", totalAmount: "", interestRate: "" });
        fetchLoans();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${editLoan ? "update" : "add"} loan account`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan account?")) return;
    try {
      const response = await loanService.delete(id);
      if (response.success) {
        toast.success("Loan account deleted successfully");
        fetchLoans();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete loan account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="page-icon-tile">
            <Building2 />
          </div>
          <h1 className="page-title">Loan Accounts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={() => { setEditLoan(null); setForm({ loanName: "", lenderName: "", totalAmount: "", interestRate: "" }); setIsAddModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Loan Account
          </Button>
        </div>
      </div>

      {loans.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 min-h-[600px] border-0 shadow-sm bg-card">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">Manage Your Loan Accounts</h2>
            <p className="text-muted-foreground">
              Add your loan accounts and check all loan transactions at one place
            </p>

            <div className="py-16 flex justify-center">
              <div className="relative w-64 h-48 flex items-center justify-center">
                <Building2 className="w-32 h-32 text-muted/40" />
                <motion.div 
                  animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-0 right-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-primary font-bold text-lg">₹</span>
                </motion.div>
                <motion.div 
                  animate={{ y: [0, 10, 0], x: [0, -5, 0], rotate: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-primary font-bold text-base">₹</span>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pb-8">
              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">All Loans, One Dashboard</h3>
                <p className="text-sm text-muted-foreground">Easily track business loans kept separate from the daily transactions</p>
              </Card>
              
              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Auto EMI Calculation with Every Entry</h3>
                <p className="text-sm text-muted-foreground">Add loan details and the system instantly breaks it down into EMIs</p>
              </Card>

              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Manual Flexibility</h3>
                <p className="text-sm text-muted-foreground">Add notes, interest details etc. Keeps it flexible for varied use cases</p>
              </Card>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 shadow-md font-semibold text-base" onClick={() => { setEditLoan(null); setForm({ loanName: "", lenderName: "", totalAmount: "", interestRate: "" }); setIsAddModalOpen(true); }}>
              <Plus className="mr-2 h-5 w-5" /> Add Loan Account
            </Button>
          </motion.div>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                  <th className="p-4 text-left">Loan Account Name</th>
                  <th className="p-4 text-left">Lender Name</th>
                  <th className="p-4 text-center">Interest (%)</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{loan.loanName}</td>
                    <td className="p-4">{loan.lenderName}</td>
                    <td className="p-4 text-center font-mono">{loan.interestRate}%</td>
                    <td className="p-4 text-right font-bold text-primary">
                      {formatCurrency(loan.currentBalance)}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            className="font-semibold cursor-pointer rounded-lg text-foreground focus:bg-muted"
                            onClick={() => { handleEditClick(loan); setIsAddModalOpen(true); }}
                          >
                            <Pencil className="mr-2 h-4 w-4 shrink-0" /> Edit Loan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 font-semibold cursor-pointer rounded-lg focus:text-red-500 focus:bg-red-500/5"
                            onClick={() => handleDelete(loan._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4 shrink-0" /> Delete Loan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Loan Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> {editLoan ? "Edit Loan Account" : "Add Loan Account"}
            </DialogTitle>
            <DialogDescription>
              Enter the details of your business loan to track EMIs and balances.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="loanName">Loan Account Name</Label>
              <Input id="loanName" placeholder="eg. HDFC Business Loan" value={form.loanName} onChange={(e) => setForm({...form, loanName: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lender">Lender Name</Label>
              <Input id="lender" placeholder="Bank or Person Name" value={form.lenderName} onChange={(e) => setForm({...form, lenderName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amt">Total Loan Amount</Label>
                <Input id="amt" type="number" placeholder="₹ 0.00" value={form.totalAmount} onChange={(e) => setForm({...form, totalAmount: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Interest Rate (%)</Label>
                <Input id="rate" type="number" placeholder="eg. 12%" value={form.interestRate} onChange={(e) => setForm({...form, interestRate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editLoan ? "Update Loan Account" : "Save Loan Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
