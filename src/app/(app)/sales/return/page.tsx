"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, Plus, Search, Receipt, Calendar, ArrowLeft, Trash2,
  Loader2, Eye, Printer, X, Wallet, Building, ArrowUpRight, Ban, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Services
import { saleReturnService } from "@/services/saleReturnService";
import { customerService } from "@/services/customerService";
import { bankService } from "@/services/bankService";
import { saleService } from "@/services/saleService";

// Utils & Types
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Customer, Sale, SaleReturn, SaleReturnItem, BankAccount } from "@/types";
import { getSocket } from "@/lib/socket";

interface FormItem {
  id: string;
  product: string;
  barcode: string;
  itemName: string;
  soldQty: number;
  alreadyReturnedQty: number;
  returnQty: number;
  unit: string;
  pricePerUnit: number;
  discountAmount: number; // original discount per unit
  taxPercent: number;
  reason: "Damaged" | "Wrong item" | "Expired" | "Customer cancelled" | "Exchange" | "Other";
  stockAction: "restore_stock" | "damaged_stock" | "no_stock";
}

export default function SaleReturnPage() {
  const router = useRouter();

  // Page mode state: "list" | "create"
  const [mode, setMode] = useState<"list" | "create">("list");

  // Masters
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Create Credit Note form states
  const [customerId, setCustomerId] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState<Sale[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [stateOfSupply, setStateOfSupply] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [refundType, setRefundType] = useState<"refund_now" | "keep_as_credit" | "adjust_future_invoice">("refund_now");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank" | "Card" | "Wallet">("Cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [roundOff, setRoundOff] = useState(false);
  const [saving, setSaving] = useState(false);

  // List View states
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refundFilter, setRefundFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail View states
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Keyboard Shortcuts Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N -> Add Credit Note
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && mode === "list") {
        e.preventDefault();
        setMode("create");
      }
      // Ctrl/Cmd + S -> Save Credit Note
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && mode === "create") {
        e.preventDefault();
        saveReturn();
      }
      // Esc -> Back to list or close dialog
      if (e.key === "Escape") {
        if (detailOpen) {
          setDetailOpen(false);
        } else if (mode === "create") {
          setMode("list");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, detailOpen, customerId, selectedInvoiceId, items, refundType, paymentMode, cashBankAccountId, referenceNo, notes, roundOff]);

  // Load masters & initial lists
  useEffect(() => {
    customerService.getAll({ limit: 500 }).then(r => setCustomers(r.data)).catch(() => {});
    bankService.getAll().then(r => {
      setBankAccounts(r.data);
      if (r.data.length > 0) setCashBankAccountId(r.data[0]._id);
    }).catch(() => {});
  }, []);

  const loadReturns = useCallback(async () => {
    try {
      setLoadingList(true);
      const params: Record<string, any> = { page, limit: 15, search };
      if (statusFilter !== "all") params.status = statusFilter;
      if (refundFilter !== "all") params.refundType = refundFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await saleReturnService.getAll(params);
      setReturns(res.data);
      setTotalPages(res.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load Credit Notes");
    } finally {
      setLoadingList(false);
    }
  }, [page, search, statusFilter, refundFilter, startDate, endDate]);

  useEffect(() => {
    if (mode === "list") {
      loadReturns();
    }
  }, [mode, loadReturns]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleLiveUpdate = () => {
      if (mode === "list") {
        loadReturns();
      }
    };

    socket.on("salesReturn:created", handleLiveUpdate);
    
    return () => {
      socket.off("salesReturn:created", handleLiveUpdate);
    };
  }, [mode, loadReturns]);

  // Customer selected -> fetch unreturned sales invoices
  const handleCustomerChange = async (cid: string) => {
    setCustomerId(cid);
    setSelectedInvoiceId("");
    setItems([]);
    setCustomerInvoices([]);
    if (!cid) return;

    try {
      const invoices = await saleReturnService.getUnreturnedSalesForCustomer(cid);
      setCustomerInvoices(invoices);
      if (invoices.length === 0) {
        toast.info("No invoices found with returnable items for this customer.");
      }
    } catch {
      toast.error("Failed to fetch customer invoices");
    }
  };

  // Invoice selected -> fetch returnable items & prefill
  const handleInvoiceChange = async (invId: string) => {
    setSelectedInvoiceId(invId);
    setItems([]);
    if (!invId) return;

    try {
      const res = await saleReturnService.getReturnableItemsFromInvoice(invId);
      setStateOfSupply(res.sale.stateOfSupply || "");
      
      const formItems: FormItem[] = res.items.map((i: any) => ({
        id: crypto.randomUUID(),
        product: i.product,
        barcode: i.barcode || "",
        itemName: i.itemName,
        soldQty: i.soldQty,
        alreadyReturnedQty: i.alreadyReturnedQty,
        returnQty: i.returnableQty, // Default to all remaining quantity
        unit: i.unit || "piece",
        pricePerUnit: i.pricePerUnit,
        discountAmount: i.discountAmount / i.soldQty, // Original unit discount
        taxPercent: i.taxPercent,
        reason: "Other",
        stockAction: "restore_stock"
      }));

      setItems(formItems);
    } catch {
      toast.error("Failed to load invoice items");
    }
  };

  // Calculations for current return
  const itemSummary = items.map((item) => {
    const qty = Number(item.returnQty) || 0;
    const base = qty * item.pricePerUnit;
    const proportionalDiscount = item.discountAmount * qty;
    const taxable = base - proportionalDiscount;
    const tax = (taxable * item.taxPercent) / 100;
    const total = taxable + tax;
    return {
      ...item,
      base,
      discount: proportionalDiscount,
      taxable,
      tax,
      total
    };
  });

  const subtotal = itemSummary.reduce((s, x) => s + x.base, 0);
  const totalDiscount = itemSummary.reduce((s, x) => s + x.discount, 0);
  const totalTax = itemSummary.reduce((s, x) => s + x.tax, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;
  
  const finalTotal = roundOff ? Math.round(grandTotal) : grandTotal;
  const roundOffValue = finalTotal - grandTotal;

  const refundedAmount = refundType === "refund_now" ? finalTotal : 0;
  const creditBalance = refundType !== "refund_now" ? finalTotal : 0;

  // Save return to backend
  const saveReturn = async () => {
    if (!customerId) {
      toast.error("Please select a Customer");
      return;
    }
    if (!selectedInvoiceId) {
      toast.error("Please select an Original Invoice");
      return;
    }

    const activeItems = items.filter(x => x.returnQty > 0);
    if (activeItems.length === 0) {
      toast.error("Please specify return quantity for at least one item");
      return;
    }
    if (refundType === "refund_now" && paymentMode !== "Cash" && !cashBankAccountId) {
      toast.error("Please select an account for non-cash refund");
      return;
    }

    // Verify quantities do not exceed returnable
    for (const item of activeItems) {
      const maxReturn = item.soldQty - item.alreadyReturnedQty;
      if (item.returnQty > maxReturn) {
        toast.error(`Return quantity for ${item.itemName} cannot exceed ${maxReturn}`);
        return;
      }
      if (item.returnQty < 0) {
        toast.error(`Return quantity for ${item.itemName} cannot be negative`);
        return;
      }
    }

    const originalInvoice = customerInvoices.find(x => x._id === selectedInvoiceId);

    try {
      setSaving(true);
      const payload = {
        customerId,
        customerName: customers.find(x => x._id === customerId)?.name || "Customer",
        customerPhone: customers.find(x => x._id === customerId)?.phone || "",
        customerGstNo: customers.find(x => x._id === customerId)?.gstNumber || "",
        billingAddress: customers.find(x => x._id === customerId)?.address || "",
        originalInvoiceId: selectedInvoiceId,
        originalInvoiceNo: originalInvoice?.invoiceNumber || "",
        invoiceDate: originalInvoice?.createdAt,
        returnDate,
        stateOfSupply,
        items: activeItems.map(x => ({
          product: x.product,
          barcode: x.barcode,
          itemName: x.itemName,
          soldQty: x.soldQty,
          alreadyReturnedQty: x.alreadyReturnedQty,
          returnQty: x.returnQty,
          unit: x.unit,
          pricePerUnit: x.pricePerUnit,
          discountAmount: x.discountAmount * x.returnQty,
          taxPercent: x.taxPercent,
          reason: x.reason,
          stockAction: x.stockAction
        })),
        subtotal,
        totalDiscount,
        totalTax,
        roundOff: roundOffValue,
        grandTotal: finalTotal,
        refundType,
        paymentMode: refundType === "refund_now" ? paymentMode : "Credit",
        cashBankAccountId: refundType === "refund_now" ? cashBankAccountId : undefined,
        referenceNo,
        notes
      };

      await saleReturnService.create(payload);
      toast.success("Sale Return & Credit Note issued successfully!");
      setMode("list");
      
      // Reset form
      setCustomerId("");
      setSelectedInvoiceId("");
      setItems([]);
      setNotes("");
      setReferenceNo("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create Sale Return");
    } finally {
      setSaving(false);
    }
  };

  // View return details
  const viewReturnDetails = async (id: string) => {
    try {
      const data = await saleReturnService.getById(id);
      setSelectedReturn(data);
      setDetailOpen(true);
    } catch {
      toast.error("Failed to load return details");
    }
  };

  // Cancel completed return
  const cancelReturn = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this Credit Note? This will reverse stock and ledger entry!")) return;
    try {
      await saleReturnService.cancel(id);
      toast.success("Credit Note cancelled successfully!");
      loadReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel return");
    }
  };

  // Summary Metrics calculations for List View
  const listTotalReturns = returns.reduce((s, x) => x.status !== "cancelled" ? s + x.grandTotal : s, 0);
  const listTotalRefunded = returns.reduce((s, x) => x.status !== "cancelled" ? s + x.refundedAmount : s, 0);
  const listTotalCredit = returns.reduce((s, x) => x.status !== "cancelled" ? s + x.creditBalance : s, 0);

  return (
    <div className="space-y-6 pb-10">
      {mode === "list" ? (
        <>
          {/* Header */}
          <PageHeader title="Sale Return / Credit Note" description="View and manage sales returns history" icon={ArrowLeftRight}>
            <Button className="gap-2 rounded-full px-5" onClick={() => setMode("create")}>
              <Plus className="h-4 w-4" /> Add Credit Note
            </Button>
          </PageHeader>

          {/* Filters Panel */}
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search Credit Note or original invoice..."
              className="flex-1 max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="adjusted">Adjusted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={refundFilter} onValueChange={(v) => { setRefundFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] bg-card border-border"><SelectValue placeholder="Refund Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="refund_now">Refund Now</SelectItem>
                <SelectItem value="keep_as_credit">Store Credit</SelectItem>
                <SelectItem value="adjust_future_invoice">Future Adjust</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center bg-card border rounded-md px-3 py-1 text-sm">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[130px] border-0 bg-transparent h-8 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground">to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[130px] border-0 bg-transparent h-8 p-0 focus-visible:ring-0" />
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 relative overflow-hidden bg-card border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Returned</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">This Period</Badge>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(listTotalReturns)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Excludes cancelled transactions</p>
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            </Card>

            <Card className="p-4 relative overflow-hidden bg-card border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Refunded</span>
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-0">Outflow</Badge>
              </div>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(listTotalRefunded)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Returned via Cash, UPI, or Bank</p>
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            </Card>

            <Card className="p-4 relative overflow-hidden bg-card border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Credit Balance Issued</span>
                <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-0 font-medium">Customer Credit</Badge>
              </div>
              <div className="text-2xl font-bold text-amber-500">{formatCurrency(listTotalCredit)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Available for future purchases</p>
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            </Card>
          </div>

          {/* List Table */}
          {loadingList ? (
            <TableSkeleton rows={8} />
          ) : returns.length === 0 ? (
            <EmptyState
              title="No Credit Notes Available"
              description="Record a sale return and issue store credit or cash back."
              icon={ArrowLeftRight}
              action={{
                label: "Add Credit Note",
                onClick: () => setMode("create")
              }}
            />
          ) : (
            <Card className="overflow-hidden border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground">
                      <th className="text-left p-4 font-semibold w-10">Sr No</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-left p-4 font-semibold">Credit Note No</th>
                      <th className="text-left p-4 font-semibold">Original Invoice</th>
                      <th className="text-left p-4 font-semibold">Customer</th>
                      <th className="text-left p-4 font-semibold">Return Type</th>
                      <th className="text-right p-4 font-semibold">Total Returned</th>
                      <th className="text-right p-4 font-semibold">Refunded</th>
                      <th className="text-right p-4 font-semibold">Credit Bal.</th>
                      <th className="text-center p-4 font-semibold">Status</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret, idx) => (
                      <tr key={ret._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground">{idx + 1 + (page - 1) * 15}</td>
                        <td className="p-4 whitespace-nowrap">{formatDate(ret.returnDate)}</td>
                        <td className="p-4 font-mono font-medium">{ret.creditNoteNo}</td>
                        <td className="p-4 font-mono text-muted-foreground">{ret.invoiceNumber}</td>
                        <td className="p-4 font-medium">{ret.customerName}</td>
                        <td className="p-4 capitalize">
                          {ret.refundType === "refund_now" ? "Refund Now" : ret.refundType === "keep_as_credit" ? "Store Credit" : "Invoice Adjust"}
                        </td>
                        <td className="p-4 text-right font-bold">{formatCurrency(ret.grandTotal)}</td>
                        <td className="p-4 text-right text-emerald-500">{formatCurrency(ret.refundedAmount)}</td>
                        <td className="p-4 text-right text-amber-500">{formatCurrency(ret.creditBalance)}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <Badge
                            className={cn(
                              "whitespace-nowrap",
                              ret.status === "refunded" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0",
                              ret.status === "issued" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0",
                              ret.status === "adjusted" && "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-0",
                              ret.status === "cancelled" && "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0"
                            )}
                          >
                            {ret.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="icon-sm" onClick={() => viewReturnDetails(ret._id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ret.status !== "cancelled" && (
                              <Button variant="ghost" size="icon-sm" className="text-red-500" onClick={() => cancelReturn(ret._id)}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      ) : (
        /* Create Credit Note Page */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setMode("list")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="h-6 w-6 text-primary animate-pulse" />
                Issue Credit Note
              </h1>
              <p className="text-sm text-muted-foreground">Process sold goods return and adjust balances</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Main Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Invoice Selection */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Party & Bill Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Select Customer *</Label>
                    <Select value={customerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder="Search Customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name} ({c.phone}) - Bal: ₹{(c.walletBalance || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Original Invoice *</Label>
                    <Select value={selectedInvoiceId} onValueChange={handleInvoiceChange} disabled={!customerId}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder={customerId ? "Select Invoice to Return..." : "Select Customer First"} />
                      </SelectTrigger>
                      <SelectContent>
                        {customerInvoices.map((inv) => (
                          <SelectItem key={inv._id} value={inv._id}>
                            {inv.invoiceNumber} - Total: ₹{inv.totalAmount.toFixed(2)} ({formatDate(inv.createdAt)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Return Date</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="bg-muted/10 border-border"
                      />
                      <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">State of Supply</Label>
                    <Input
                      value={stateOfSupply}
                      onChange={(e) => setStateOfSupply(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="bg-muted/10 border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Returned Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {items.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      No items loaded. Select a valid original invoice to list sold items.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30 text-muted-foreground">
                            <th className="text-left p-3 w-8">#</th>
                            <th className="text-left p-3">Item Name</th>
                            <th className="text-center p-3 w-20">Sold Qty</th>
                            <th className="text-center p-3 w-24">Prev. Ret.</th>
                            <th className="text-center p-3 w-24">Ret Qty</th>
                            <th className="text-right p-3 w-24">Rate (₹)</th>
                            <th className="text-right p-3 w-20">Tax %</th>
                            <th className="text-right p-3 w-28">Return Tot.</th>
                            <th className="text-center p-3 w-32">Reason</th>
                            <th className="text-center p-3 w-32">Stock Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            const maxReturn = item.soldQty - item.alreadyReturnedQty;
                            return (
                              <tr key={item.id} className="border-b border-border/30">
                                <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                <td className="p-3">
                                  <p className="font-medium">{item.itemName}</p>
                                  <span className="text-[10px] text-muted-foreground font-mono">{item.barcode}</span>
                                </td>
                                <td className="p-3 text-center">{item.soldQty}</td>
                                <td className="p-3 text-center text-muted-foreground">{item.alreadyReturnedQty}</td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={maxReturn}
                                    value={item.returnQty}
                                    onChange={(e) => {
                                      const val = Math.min(maxReturn, Math.max(0, Number(e.target.value) || 0));
                                      setItems(prev => prev.map(o => o.id === item.id ? { ...o, returnQty: val } : o));
                                    }}
                                    className="h-8 text-center bg-muted/10 border-border focus-visible:ring-primary w-20 mx-auto"
                                  />
                                </td>
                                <td className="p-3 text-right">₹{item.pricePerUnit.toFixed(2)}</td>
                                <td className="p-3 text-right">{item.taxPercent}%</td>
                                <td className="p-3 text-right font-semibold">
                                  {formatCurrency(
                                    (Number(item.returnQty) || 0) * item.pricePerUnit -
                                    (item.discountAmount * (Number(item.returnQty) || 0)) +
                                    (((Number(item.returnQty) || 0) * item.pricePerUnit - (item.discountAmount * (Number(item.returnQty) || 0))) * item.taxPercent) / 100
                                  )}
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={item.reason}
                                    onValueChange={(val: any) => {
                                      setItems(prev => prev.map(o => o.id === item.id ? { ...o, reason: val } : o));
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Damaged">Damaged</SelectItem>
                                      <SelectItem value="Wrong item">Wrong item</SelectItem>
                                      <SelectItem value="Expired">Expired</SelectItem>
                                      <SelectItem value="Customer cancelled">Cancelled</SelectItem>
                                      <SelectItem value="Exchange">Exchange</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={item.stockAction}
                                    onValueChange={(val: any) => {
                                      setItems(prev => prev.map(o => o.id === item.id ? { ...o, stockAction: val } : o));
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="restore_stock">Resellable</SelectItem>
                                      <SelectItem value="damaged_stock">Damaged Stock</SelectItem>
                                      <SelectItem value="no_stock">No Stock Return</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settlement Section */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Settlement & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Refund Settlement Type</Label>
                      <Select value={refundType} onValueChange={(val: any) => setRefundType(val)}>
                        <SelectTrigger className="bg-muted/10 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refund_now">Refund cash/bank now</SelectItem>
                          <SelectItem value="keep_as_credit">Keep as Customer Store Credit</SelectItem>
                          <SelectItem value="adjust_future_invoice">Adjust against next invoice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {refundType === "refund_now" && (
                      <>
                        <div className="space-y-2">
                          <Label className="font-semibold">Payment Mode</Label>
                          <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                            <SelectTrigger className="bg-muted/10 border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Bank">Bank Account</SelectItem>
                              <SelectItem value="Card">Card</SelectItem>
                              <SelectItem value="Wallet">Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">Cash/Bank Account</Label>
                          <Select value={cashBankAccountId} onValueChange={setCashBankAccountId}>
                            <SelectTrigger className="bg-muted/10 border-border">
                              <SelectValue placeholder="Select Account..." />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts.map((b) => (
                                <SelectItem key={b._id} value={b._id}>
                                  {b.accountName} - (Bal: ₹{b.currentBalance.toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label className="font-semibold">Reference Transaction No</Label>
                      <Input
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="e.g. UPI Ref ID, Cheque No"
                        className="bg-muted/10 border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Internal Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add return reasons, customer notes or comments..."
                      rows={2}
                      className="bg-muted/10 border-border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calculations & Totals Panel */}
            <div className="space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Return Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Return Base</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>Proportional Discount Reversed</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Amount Reversed</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>

                    <Separator className="bg-border/50" />

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="form-round-off"
                          checked={roundOff}
                          onCheckedChange={(v) => setRoundOff(!!v)}
                          className="h-4 w-4 border-border"
                        />
                        <Label htmlFor="form-round-off" className="text-muted-foreground font-medium cursor-pointer">Round Off</Label>
                      </div>
                      <span className="font-mono text-muted-foreground">{roundOffValue.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t font-bold text-base">
                      <span>Grand Return Amount</span>
                      <span className="text-primary text-lg">₹{finalTotal.toFixed(2)}</span>
                    </div>

                    <Separator className="bg-border/50" />

                    <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Refund Now Outflow:</span>
                        <span className="font-bold text-emerald-500">₹{refundedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Store Credit Addition:</span>
                        <span className="font-bold text-amber-500">₹{creditBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={saveReturn}
                      disabled={saving}
                      className="w-full h-11 text-sm font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl active:scale-95 transition-all"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Credit Note (Ctrl+S)"}
                    </Button>
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => setMode("list")} disabled={saving}>
                      Cancel & Return
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Detail View Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-primary" />
              Credit Note Detail
            </DialogTitle>
            <DialogDescription>Credit Note transaction logs and returns billing info</DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-3.5 rounded-xl border border-border/40">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Credit Note No</Label>
                  <p className="font-mono font-bold text-primary">{selectedReturn.creditNoteNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Original Invoice</Label>
                  <p className="font-mono">{selectedReturn.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Return Date</Label>
                  <p className="font-medium">{formatDate(selectedReturn.returnDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Status</Label>
                  <div>
                    <Badge
                      className={cn(
                        selectedReturn.status === "refunded" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0",
                        selectedReturn.status === "issued" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0",
                        selectedReturn.status === "cancelled" && "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0"
                      )}
                    >
                      {selectedReturn.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Customer details</h4>
                  <p className="font-bold">{selectedReturn.customerName}</p>
                  {selectedReturn.customerPhone && <p className="text-muted-foreground text-xs">Phone: {selectedReturn.customerPhone}</p>}
                  {selectedReturn.customerGstNo && <p className="text-muted-foreground text-xs">GSTIN: {selectedReturn.customerGstNo}</p>}
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Settlement Info</h4>
                  <p className="font-medium capitalize">
                    {selectedReturn.refundType === "refund_now" ? `Refunded via ${selectedReturn.paymentMode}` : "Store Credit Issued"}
                  </p>
                  {selectedReturn.referenceNo && <p className="text-muted-foreground text-xs">Ref No: {selectedReturn.referenceNo}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-muted-foreground">
                      <th className="text-left p-3 font-semibold">Item Details</th>
                      <th className="text-center p-3 w-16">Returned Qty</th>
                      <th className="text-right p-3 w-24">Price</th>
                      <th className="text-right p-3 w-20">Tax %</th>
                      <th className="text-right p-3 w-24 font-bold">Total</th>
                      <th className="text-center p-3 w-28">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-border/30">
                        <td className="p-3">
                          <p className="font-medium">{item.itemName}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.barcode}</span>
                        </td>
                        <td className="p-3 text-center font-semibold">{item.returnQty}</td>
                        <td className="p-3 text-right">₹{item.pricePerUnit.toFixed(2)}</td>
                        <td className="p-3 text-right">{item.taxPercent}%</td>
                        <td className="p-3 text-right font-bold">₹{item.returnAmount.toFixed(2)}</td>
                        <td className="p-3 text-center text-muted-foreground text-[10px]">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations panel */}
              <div className="flex justify-between items-start pt-2">
                <div className="max-w-[300px] text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border">
                  <span className="font-semibold block mb-1">Notes:</span>
                  {selectedReturn.notes || "No extra transaction notes recorded."}
                </div>
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{selectedReturn.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedReturn.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>Proportional Discount</span>
                      <span>-₹{selectedReturn.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedReturn.totalTax > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax reversed</span>
                      <span>₹{selectedReturn.totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedReturn.roundOff !== 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Round Off</span>
                      <span>₹{selectedReturn.roundOff?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t text-primary">
                    <span>Total Amount</span>
                    <span>₹{selectedReturn.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            <Button className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print Credit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
