"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supplierService } from "@/services/supplierService";
import { bankService } from "@/services/bankService";
import { purchaseService } from "@/services/purchaseService";
import { paymentOutService } from "@/services/paymentOutService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Supplier, BankAccount, Purchase } from "@/types";
import { Loader2, Calendar as CalendarIcon, Wallet, Plus, Receipt } from "lucide-react";

const formSchema = z.object({
  partyId: z.string().min(1, "Supplier is required"),
  amountPaid: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  cashBankAccountId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  linkedPurchaseId: z.string().optional(),
  description: z.string().optional(),
  referenceNo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


interface AddPaymentOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPaymentOutModal({ open, onOpenChange, onSuccess }: AddPaymentOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<Purchase[]>([]);
  const [fetchingBills, setFetchingBills] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,



    defaultValues: {
      partyId: "",
      amountPaid: 0,
      paymentMode: "Cash",
      date: new Date().toISOString().split("T")[0],
      description: "",
      referenceNo: "",
    },
  });

  const selectedPartyId = form.watch("partyId");
  const selectedPaymentMode = form.watch("paymentMode");

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (selectedPartyId) {
      fetchUnpaidBills(selectedPartyId);
    } else {
      setUnpaidBills([]);
    }
  }, [selectedPartyId]);

  const loadInitialData = async () => {
    try {
      const [suppRes, bankRes] = await Promise.all([
        supplierService.getAll({ limit: 100 }),
        bankService.getAll()
      ]);
      setSuppliers(suppRes.data);
      setBankAccounts(bankRes.data);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const fetchUnpaidBills = async (supplierId: string) => {
    setFetchingBills(true);
    try {
      const res = await purchaseService.getUnpaid(supplierId);
      setUnpaidBills(res.data);
    } catch (error) {
      console.error("Failed to fetch bills", error);
    } finally {
      setFetchingBills(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await paymentOutService.create(values);
      toast.success("Payment-Out recorded successfully");
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Wallet className="h-5 w-5 text-primary" />
            Add Payment-Out
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="partyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier / Vendor *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select Supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(s => (
                            <SelectItem key={s._id} value={s._id}>{s.name} ({s.phone})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Payment notes..." 
                          className="min-h-[100px] rounded-xl resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unpaid Bills List */}
                {selectedPartyId && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5" />
                      Unpaid Purchase Bills
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {fetchingBills ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : unpaidBills.length > 0 ? (
                        unpaidBills.map(bill => (
                          <Card 
                            key={bill._id}
                            className={cn(
                              "p-3 cursor-pointer transition-all border-dashed",
                              form.watch("linkedPurchaseId") === bill._id 
                                ? "border-primary bg-primary/5 shadow-sm" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => {
                              const current = form.getValues("linkedPurchaseId");
                              form.setValue("linkedPurchaseId", current === bill._id ? "" : bill._id);
                              if (current !== bill._id) {
                                form.setValue("amountPaid", bill.totalAmount - bill.amountPaid);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold">{bill.purchaseNumber}</p>
                                <p className="text-[10px] text-muted-foreground">{formatDate(bill.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-red-500">{formatCurrency(bill.totalAmount - bill.amountPaid)}</p>
                                <p className="text-[10px] text-muted-foreground">Due</p>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center p-4 bg-muted/30 rounded-xl">
                          <p className="text-xs text-muted-foreground">No unpaid bills found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="date" className="h-11 pl-10 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt No</FormLabel>
                    <Input disabled value="Auto-generated" className="h-11 rounded-xl bg-muted/50" />
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Paid *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            className="h-14 pl-8 text-xl font-bold rounded-2xl bg-muted/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Mode *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedPaymentMode !== "Cash" && (
                    <FormField
                      control={form.control}
                      name="cashBankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank Account *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="Select Account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bankAccounts.map(a => (
                                <SelectItem key={a._id} value={a._id}>{a.accountName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="referenceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference / Transaction ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ref No." className="h-11 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 min-w-[140px] bg-primary hover:bg-primary/95 text-primary-foreground border-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for conditional styles
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
