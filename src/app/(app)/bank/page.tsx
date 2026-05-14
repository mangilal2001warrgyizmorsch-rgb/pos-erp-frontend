"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, QrCode, ReceiptText, MoreVertical, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { bankService } from "@/services/bankService";
import { BankAccount } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function BankAccountsPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    accountName: "", accountNumber: "", ifscCode: "", openingBalance: ""
  });

  const fetchBanks = async () => {
    try {
      const response = await bankService.getAll();
      if (response.success) {
        setBanks(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.accountName || !form.accountNumber || !form.ifscCode) {
        toast.error("Please fill all required fields");
        return;
      }
      const response = await bankService.create(form);
      if (response.success) {
        toast.success("Bank account added successfully");
        setIsAddModalOpen(false);
        setForm({ accountName: "", accountNumber: "", ifscCode: "", openingBalance: "" });
        fetchBanks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add bank account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Bank Account
          </Button>
        </div>
      </div>

      {banks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 min-h-[600px] border-0 shadow-sm bg-card">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">Manage Multiple Bank Accounts</h2>
            <p className="text-muted-foreground">
              With our ERP you can manage multiple banks and payment types like UPI, Net Banking and Credit Card
            </p>

            <div className="py-16 flex justify-center">
              <div className="relative w-64 h-48 flex items-center justify-center">
                <Building2 className="w-32 h-32 text-muted/40" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-4 right-8 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-primary font-bold text-sm">₹</span>
                </motion.div>
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-8 left-8 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-primary font-bold text-xs">₹</span>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pb-8">
              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ReceiptText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Print Bank Details on Invoices</h3>
                <p className="text-sm text-muted-foreground">Print account details on invoices and get payments via NEFT/RTGS/IMPS.</p>
              </Card>
              
              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Unlimited Payment Types</h3>
                <p className="text-sm text-muted-foreground">Record transactions by methods like Banks, UPI, Net Banking and Cards.</p>
              </Card>

              <Card className="p-6 bg-muted/30 border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Print UPI QR Code on Invoices</h3>
                <p className="text-sm text-muted-foreground">Print QR code on your invoices or send payment links to your customers.</p>
              </Card>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 shadow-md font-semibold text-base" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-5 w-5" /> Add Bank Account
            </Button>
          </motion.div>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                  <th className="p-4 text-left">Bank Name</th>
                  <th className="p-4 text-left">Account Number</th>
                  <th className="p-4 text-left">IFSC Code</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{bank.accountName}</td>
                    <td className="p-4 font-mono">{bank.accountNumber}</td>
                    <td className="p-4 uppercase">{bank.ifscCode}</td>
                    <td className="p-4 text-right font-bold text-primary">
                      {formatCurrency(bank.currentBalance)}
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

      {/* Add Bank Account Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Add Bank Account
            </DialogTitle>
            <DialogDescription>
              Enter the bank details to track transactions and print on invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Bank Name (eg. SBI, HDFC)</Label>
              <Input id="name" placeholder="Bank Name" value={form.accountName} onChange={(e) => setForm({...form, accountName: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc">Account Number</Label>
              <Input id="acc" placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input id="ifsc" placeholder="IFSC Code" value={form.ifscCode} onChange={(e) => setForm({...form, ifscCode: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bal">Opening Balance</Label>
              <Input id="bal" type="number" placeholder="₹ 0.00" value={form.openingBalance} onChange={(e) => setForm({...form, openingBalance: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Bank Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
