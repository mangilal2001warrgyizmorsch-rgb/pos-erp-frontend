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
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { customerService } from "@/services/customerService";
import { bankService } from "@/services/bankService";
import { saleService } from "@/services/saleService";
import { paymentInService } from "@/services/paymentInService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, BankAccount, Sale } from "@/types";
import { Loader2, Calendar as CalendarIcon, Wallet, Plus, Receipt } from "lucide-react";

const formSchema = z.object({
  partyId: z.string().min(1, "Customer is required"),
  amountReceived: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  cashBankAccountId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  linkedInvoiceId: z.string().optional(),
  description: z.string().optional(),
  referenceNo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


interface AddPaymentInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  paymentId?: string | null;
}

export function AddPaymentInModal({ open, onOpenChange, onSuccess, paymentId }: AddPaymentInModalProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Sale[]>([]);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,



    defaultValues: {
      partyId: "",
      amountReceived: 0,
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
      if (paymentId) {
        loadPaymentData(paymentId);
      } else {
        setIsEditing(false);
        setReceiptNo("");
        form.reset({
          partyId: "",
          amountReceived: 0,
          paymentMode: "Cash",
          cashBankAccountId: "",
          date: new Date().toISOString().split("T")[0],
          linkedInvoiceId: "",
          description: "",
          referenceNo: "",
        });
      }
    }
  }, [open, paymentId]);

  const loadPaymentData = async (id: string) => {
    try {
      const payment = await paymentInService.getById(id);
      const partyId = typeof payment.partyId === "string" ? payment.partyId : payment.partyId?._id;
      const linkedInvoiceId = typeof payment.linkedInvoiceId === "string" ? payment.linkedInvoiceId : payment.linkedInvoiceId?._id;
      setIsEditing(true);
      setReceiptNo(payment.receiptNo || "");
      form.reset({
        partyId,
        amountReceived: payment.amountReceived,
        paymentMode: payment.paymentMode,
        cashBankAccountId: payment.cashBankAccountId,
        date: payment.date?.split("T")[0] || new Date().toISOString().split("T")[0],
        linkedInvoiceId,
        description: payment.description,
        referenceNo: payment.referenceNo,
      });
      if (partyId) {
        fetchUnpaidInvoices(partyId);
      }
    } catch (error) {
      console.error("Failed to load payment", error);
      toast.error("Failed to load payment details");
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      fetchUnpaidInvoices(selectedPartyId);
    } else {
      setUnpaidInvoices([]);
    }
  }, [selectedPartyId]);

  const loadInitialData = async () => {
    try {
      const [custRes, bankRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        bankService.getAll()
      ]);
      setCustomers(custRes.data);
      setBankAccounts(bankRes.data);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const fetchUnpaidInvoices = async (customerId: string) => {
    setFetchingInvoices(true);
    try {
      const res = await saleService.getUnpaid(customerId);
      setUnpaidInvoices(res.data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setFetchingInvoices(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (isEditing && paymentId) {
        await paymentInService.update(paymentId, values);
        toast.success("Payment-In updated successfully");
      } else {
        await paymentInService.create(values);
        toast.success("Payment-In recorded successfully");
      }
      onSuccess?.();
      onOpenChange(false);
      form.reset();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Wallet className="h-5 w-5 text-emerald-500" />
            {isEditing ? "Edit Payment-In" : "Add Payment-In"}
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
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Party / Customer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select Customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.name} ({c.phone})</SelectItem>
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

                {/* Unpaid Invoices List */}
                {selectedPartyId && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5" />
                      Unpaid Invoices
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {fetchingInvoices ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : unpaidInvoices.length > 0 ? (
                        unpaidInvoices.map(invoice => (
                          <Card 
                            key={invoice._id}
                            className={cn(
                              "p-3 cursor-pointer transition-all border-dashed",
                              form.watch("linkedInvoiceId") === invoice._id 
                                ? "border-primary bg-primary/5 shadow-sm" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => {
                              const current = form.getValues("linkedInvoiceId");
                              form.setValue("linkedInvoiceId", current === invoice._id ? "" : invoice._id);
                              if (current !== invoice._id) {
                                form.setValue("amountReceived", invoice.totalAmount - invoice.amountPaid);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold">{invoice.invoiceNumber}</p>
                                <p className="text-[10px] text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-red-500">{formatCurrency(invoice.totalAmount - invoice.amountPaid)}</p>
                                <p className="text-[10px] text-muted-foreground">Balance</p>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center p-4 bg-muted/30 rounded-xl">
                          <p className="text-xs text-muted-foreground">No unpaid invoices found</p>
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
                    <Input disabled value={isEditing ? receiptNo : "Auto-generated"} className="h-11 rounded-xl bg-muted/50" />
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="amountReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Received *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            className="h-14 pl-8 text-xl font-bold rounded-2xl bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500" 
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
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
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
              <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 min-w-[140px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Update Payment" : "Save Payment"}
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
