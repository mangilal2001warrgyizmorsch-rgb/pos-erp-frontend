"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Loader2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { customerService } from "@/services/customerService";
import { toast } from "sonner";
import type { Customer } from "@/types";

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: (customer?: Customer) => void;
}

export function CustomerModal({ open, onOpenChange, customer, onSuccess }: CustomerModalProps) {
  const [saving, setSaving] = useState(false);
  const [hasCustomLimit, setHasCustomLimit] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    stateCode: "",
    openingBalance: 0,
    openingBalanceType: "Receivable" as "Receivable" | "Payable",
    openingBalanceDate: new Date().toISOString().split('T')[0],
    creditLimit: 0,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        gstNumber: customer.gstNumber || "",
        address: customer.address || "",
        stateCode: customer.stateCode || "",
        openingBalance: customer.openingBalance || 0,
        openingBalanceType: customer.openingBalanceType || "Receivable",
        openingBalanceDate: customer.openingBalanceDate ? new Date(customer.openingBalanceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        creditLimit: customer.creditLimit || 0,
      });
      setHasCustomLimit(!!customer.creditLimit && customer.creditLimit > 0);
    } else {
      setForm({
        name: "",
        phone: "",
        email: "",
        gstNumber: "",
        address: "",
        stateCode: "",
        openingBalance: 0,
        openingBalanceType: "Receivable",
        openingBalanceDate: new Date().toISOString().split('T')[0],
        creditLimit: 0,
      });
      setHasCustomLimit(false);
    }
  }, [customer, open]);

  const handleSave = async (stayOpen = false) => {
    if (!form.name || !form.phone) {
      toast.error("Please fill required fields (Name & Phone)");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        creditLimit: hasCustomLimit ? form.creditLimit : 0,
      };

      let savedCustomer;
      if (customer) {
        savedCustomer = await customerService.update(customer._id, payload);
        toast.success("Customer updated successfully");
      } else {
        savedCustomer = await customerService.create(payload);
        toast.success("Customer created successfully");
      }

      onSuccess(savedCustomer);
      if (!stayOpen) {
        onOpenChange(false);
      } else {
        // Reset form for "Save & New"
        setForm({
          name: "",
          phone: "",
          email: "",
          gstNumber: "",
          address: "",
          stateCode: "",
          openingBalance: 0,
          openingBalanceType: "Receivable",
          openingBalanceDate: new Date().toISOString().split('T')[0],
          creditLimit: 0,
        });
        setHasCustomLimit(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold text-primary">
            {customer ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-6 space-y-6">
          {/* Essential Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 relative">
              <Label className="text-[10px] font-bold uppercase text-primary absolute -top-2 left-2 bg-card px-1 z-10 tracking-tight">Party Name *</Label>
              <Input 
                className="border-primary/50 focus-visible:ring-primary pt-2 h-11 font-medium"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Enter party name"
              />
            </div>
            <div className="space-y-1">
              <Input 
                placeholder="GSTIN (Optional)" 
                className="h-11 font-mono uppercase text-xs"
                value={form.gstNumber} 
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} 
              />
            </div>
            <div className="space-y-1">
              <Input 
                placeholder="Phone Number *" 
                className="h-11"
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
              <TabsTrigger 
                value="general" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 font-bold text-xs uppercase tracking-widest transition-all"
              >
                GST & Address
              </TabsTrigger>
              <TabsTrigger 
                value="credit" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Credit & Balance
              </TabsTrigger>
            </TabsList>
            
            <div className="min-h-[280px]">
              <TabsContent value="general" className="mt-0 pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="customer@example.com"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State Code</Label>
                      <Input
                        value={form.stateCode}
                        onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                        placeholder="E.g. 27"
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billing Address</Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Enter full address..."
                      className="min-h-[120px] resize-none border-muted-foreground/20"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="credit" className="mt-0 pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-1.5 relative">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">Opening Balance</Label>
                    <Input
                      type="number"
                      value={form.openingBalance || ""}
                      onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                      placeholder="0.00"
                      className="h-11 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select 
                      value={form.openingBalanceType} 
                      onValueChange={(val: "Payable" | "Receivable") => setForm({ ...form, openingBalanceType: val })}
                    >
                      <SelectTrigger className="h-11 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receivable">To Receive (Udhar)</SelectItem>
                        <SelectItem value="Payable">To Pay (Advance)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 relative">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">As Of Date</Label>
                    <Input
                      type="date"
                      value={form.openingBalanceDate}
                      onChange={(e) => setForm({ ...form, openingBalanceDate: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold uppercase tracking-tight">Credit Limit</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Set maximum allowed credit for this customer
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[10px] font-bold uppercase", !hasCustomLimit ? "text-primary" : "text-muted-foreground")}>No Limit</span>
                      <Switch checked={hasCustomLimit} onCheckedChange={setHasCustomLimit} />
                      <span className={cn("text-[10px] font-bold uppercase", hasCustomLimit ? "text-primary" : "text-muted-foreground")}>Custom</span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {hasCustomLimit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block">Limit Amount (₹)</Label>
                          <Input
                            type="number"
                            value={form.creditLimit}
                            onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
                            className="h-11 border-primary/30 focus-visible:ring-primary font-bold text-lg"
                            placeholder="Enter maximum credit limit"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex flex-row items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {!customer && (
              <Button 
                variant="outline" 
                className="border-primary/30 text-primary hover:bg-primary/5 font-bold text-xs uppercase tracking-widest px-6"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                Save & New
              </Button>
            )}
            <Button 
              className="bg-primary hover:bg-primary/90 min-w-[140px] shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-widest"
              onClick={() => handleSave(false)} 
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {customer ? "Update Party" : "Save Customer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
