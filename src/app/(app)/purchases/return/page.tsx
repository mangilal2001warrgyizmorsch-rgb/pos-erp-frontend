"use client";

import { useState } from "react";
import { Plus, Receipt, Search, Filter, MoreVertical, FileDown, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export default function PurchaseReturnPage() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("this-month");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    partyName: "", refNo: "", date: new Date().toISOString().split('T')[0], amount: ""
  });

  const handleSave = () => {
    console.log("Saving Purchase Return:", form);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Return/ Dr. Note</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Purchase Return
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap mb-4">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Date Range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-quarter">This Quarter</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 items-center bg-card border border-border rounded-md px-3 py-1 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">01/05/2026 To 31/05/2026</span>
        </div>
        <Select defaultValue="all-firms">
          <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Firms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-firms">All Firms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-4 flex flex-col justify-between bg-card border-0 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Return Amount</span>
          </div>
          <div className="text-2xl font-bold mb-4">₹ 0.00</div>
          <div className="flex items-center gap-4 text-xs font-medium bg-muted/30 p-2 rounded-md">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Received:</span>
              <span className="text-emerald-500">₹ 0.00</span>
            </div>
            <div className="w-px h-3 bg-border"></div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Balance:</span>
              <span className="text-red-500">₹ 0.00</span>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-md"></div>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-card overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="font-semibold text-sm text-muted-foreground">Transactions</div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="w-64 pr-10 bg-muted/30 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">Date <Filter className="h-3 w-3" /></div>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">Ref no <Filter className="h-3 w-3" /></div>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">Party Name <Filter className="h-3 w-3" /></div>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">Payment Type <Filter className="h-3 w-3" /></div>
                </th>
                <th className="text-right p-4 font-medium text-muted-foreground">
                  <div className="flex items-center justify-end gap-1"><Filter className="h-3 w-3" /> Amount</div>
                </th>
                <th className="text-right p-4 font-medium text-muted-foreground">
                  <div className="flex items-center justify-end gap-1"><Filter className="h-3 w-3" /> Balance</div>
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Receipt className="h-12 w-12 mb-4 opacity-20" />
                      <p>No transactions found for the selected period.</p>
                      <Button variant="outline" className="mt-4 bg-transparent border-primary/20 text-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Purchase Return
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                returns.map((ret, i) => (
                  <motion.tr 
                    key={i} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Rows would go here */}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Purchase Return Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" /> Record Purchase Return
            </DialogTitle>
            <DialogDescription>
              Create a Debit Note to record goods returned to the supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="party">Supplier Name</Label>
              <Input id="party" placeholder="Select or type supplier name" value={form.partyName} onChange={(e) => setForm({...form, partyName: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ref">Original Invoice Ref No</Label>
              <Input id="ref" placeholder="eg. INV-12345" value={form.refNo} onChange={(e) => setForm({...form, refNo: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rdate">Return Date</Label>
                <Input id="rdate" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ramt">Return Amount</Label>
                <Input id="ramt" type="number" placeholder="₹ 0.00" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Purchase Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
