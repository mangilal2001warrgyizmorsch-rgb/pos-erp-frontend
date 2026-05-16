"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/services/supplierService";
import { toast } from "sonner";
import type { Supplier } from "@/types";

interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}

export function SupplierModal({ open, onOpenChange, supplier, onSuccess }: SupplierModalProps) {
  const [saving, setSaving] = useState(false);
  const [enableShipping, setEnableShipping] = useState(false);
  
  const [form, setForm] = useState({
    name: "", 
    phone: "", 
    gstNumber: "", 
    gstType: "Unregistered/Consumer",
    stateCode: "", 
    email: "", 
    address: "", 
    shippingAddress: "",
    openingBalance: 0, 
    openingBalanceType: "Payable" as "Payable" | "Receivable", 
    creditLimit: 0,
    bankName: "", 
    accountNumber: "", 
    ifscCode: "", 
    city: "", 
    state: "", 
    pincode: ""
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        phone: supplier.phone || "",
        gstNumber: supplier.gstNumber || "",
        gstType: supplier.gstType || "Unregistered/Consumer",
        stateCode: supplier.stateCode || "",
        email: supplier.email || "",
        address: supplier.address || "",
        shippingAddress: supplier.shippingAddress || "",
        openingBalance: supplier.openingBalance || 0,
        openingBalanceType: supplier.openingBalanceType || "Payable",
        creditLimit: supplier.creditLimit || 0,
        bankName: supplier.bankName || "",
        accountNumber: supplier.accountNumber || "",
        ifscCode: supplier.ifscCode || "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
      });
      setEnableShipping(!!supplier.shippingAddress);
    } else {
      setForm({
        name: "", 
        phone: "", 
        gstNumber: "", 
        gstType: "Unregistered/Consumer",
        stateCode: "", 
        email: "", 
        address: "", 
        shippingAddress: "",
        openingBalance: 0, 
        openingBalanceType: "Payable", 
        creditLimit: 0,
        bankName: "", 
        accountNumber: "", 
        ifscCode: "", 
        city: "", 
        state: "", 
        pincode: ""
      });
      setEnableShipping(false);
    }
  }, [supplier, open]);

  const handleSave = async (stayOpen = false) => {
    if (!form.name) {
      toast.error("Supplier Name is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        shippingAddress: enableShipping ? form.shippingAddress : "",
      };

      if (supplier) {
        await supplierService.update(supplier._id, payload as any);
        toast.success("Supplier updated successfully");
      } else {
        await supplierService.create(payload as any);
        toast.success("Supplier created successfully");
      }

      onSuccess();
      if (!stayOpen) {
        onOpenChange(false);
      } else {
        // Reset form for "Save & New"
        setForm({
          name: "", phone: "", gstNumber: "", gstType: "Unregistered/Consumer",
          stateCode: "", email: "", address: "", shippingAddress: "",
          openingBalance: 0, openingBalanceType: "Payable", creditLimit: 0,
          bankName: "", accountNumber: "", ifscCode: "", city: "", state: "", pincode: ""
        });
        setEnableShipping(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-primary">
            {supplier ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-6 space-y-6">
          {/* Top Essential Fields */}
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
                placeholder="GSTIN" 
                className="h-11 font-mono uppercase text-xs"
                value={form.gstNumber} 
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} 
              />
            </div>
            <div className="space-y-1">
              <Input 
                placeholder="Phone Number" 
                className="h-11"
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
          </div>

          <Tabs defaultValue="gst" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
              <TabsTrigger 
                value="gst" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 font-bold text-xs uppercase tracking-widest transition-all"
              >
                GST & Address
              </TabsTrigger>
              <TabsTrigger 
                value="credit" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Credit & Balance <Badge className="ml-2 bg-primary/20 text-primary text-[9px] border-none">New</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="additional" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-3 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Additional Fields
              </TabsTrigger>
            </TabsList>
            
            <div className="min-h-[250px]">
              <TabsContent value="gst" className="mt-0 pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1.5 relative mt-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">GST Type</Label>
                      <Select value={form.gstType} onValueChange={(v) => setForm({...form, gstType: v})}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unregistered/Consumer">Unregistered/Consumer</SelectItem>
                          <SelectItem value="Registered/Regular">Registered/Regular</SelectItem>
                          <SelectItem value="Composition">Composition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 relative mt-4">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">State</Label>
                      <Select value={form.stateCode} onValueChange={(v) => setForm({...form, stateCode: v})}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="27">Maharashtra</SelectItem>
                          <SelectItem value="24">Gujarat</SelectItem>
                          <SelectItem value="07">Delhi</SelectItem>
                          <SelectItem value="29">Karnataka</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Input 
                        placeholder="Email ID" 
                        type="email" 
                        value={form.email} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })} 
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billing Address</Label>
                      <Textarea 
                        placeholder="Enter full address..." 
                        className="resize-none h-20 border-muted-foreground/20" 
                        value={form.address} 
                        onChange={(e) => setForm({...form, address: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                        {!enableShipping && (
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-primary text-[10px] font-bold uppercase" 
                            onClick={() => setEnableShipping(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Enable Shipping
                          </Button>
                        )}
                      </div>
                      <AnimatePresence>
                        {enableShipping && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative"
                          >
                            <Textarea 
                              placeholder="Shipping Address" 
                              className="resize-none h-20 border-primary/30" 
                              value={form.shippingAddress} 
                              onChange={(e) => setForm({...form, shippingAddress: e.target.value})} 
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute -top-6 right-0 text-[9px] font-bold uppercase text-muted-foreground hover:text-destructive h-auto p-0" 
                              onClick={() => { setEnableShipping(false); setForm({...form, shippingAddress: ""}); }}
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="credit" className="mt-0 pt-6">
                <div className="max-w-md space-y-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-1.5 relative mt-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">Opening Balance</Label>
                      <Input 
                        type="number" 
                        value={form.openingBalance || ""} 
                        onChange={(e) => setForm({...form, openingBalance: Number(e.target.value)})} 
                        className="h-11 font-bold"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Select value={form.openingBalanceType} onValueChange={(v: any) => setForm({...form, openingBalanceType: v})}>
                        <SelectTrigger className="h-11 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Payable">To Pay</SelectItem>
                          <SelectItem value="Receivable">To Receive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 relative mt-4">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground absolute -top-2 left-2 bg-card px-1 z-10">Credit Limit</Label>
                    <Input 
                      type="number" 
                      value={form.creditLimit || ""} 
                      onChange={(e) => setForm({...form, creditLimit: Number(e.target.value)})} 
                      placeholder="₹ 0.00" 
                      className="h-11 font-bold"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="mt-0 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground border-b pb-2">Bank Details</h3>
                    <div className="space-y-3">
                      <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} className="h-10" />
                      <Input placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})} className="h-10" />
                      <Input placeholder="IFSC Code" value={form.ifscCode} onChange={(e) => setForm({...form, ifscCode: e.target.value})} className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground border-b pb-2">Regional Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="City" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="h-10" />
                      <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} className="h-10" />
                    </div>
                  </div>
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
            {!supplier && (
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
              {supplier ? "Update Party" : "Save Supplier"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
