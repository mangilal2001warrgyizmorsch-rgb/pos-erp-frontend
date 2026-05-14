"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Receipt, Printer, FileDown, ShieldCheck, Mail, Phone, MapPin,
  Calendar, User, CreditCard, Package
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saleService } from "@/services/saleService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";
import { useReactToPrint } from "react-to-print";

export default function SaleDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await saleService.getById(id);
      setSale(data);
    } catch {
      toast.error("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: sale ? `Invoice_${sale.invoiceNumber}` : "Invoice",
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <Receipt className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <Button onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sales
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* 1. SCREEN VIEW (UI Page) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                Invoice #{sale.invoiceNumber}
              </h1>
              <p className="text-sm text-muted-foreground">Date: {formatDate(sale.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => handlePrint()} className="gap-2 shadow-lg shadow-primary/20 px-6">
              <Printer className="h-4 w-4" /> Generate Invoice / PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">{sale.paymentStatus.toUpperCase()}</Badge>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20" variant="outline">{sale.status.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /> Customer Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="font-semibold text-lg">{typeof sale.customer !== "string" && sale.customer ? sale.customer.name : sale.customerName}</div>
              {typeof sale.customer !== "string" && sale.customer && (
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {sale.customer.phone}</div>
                  {sale.customer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {sale.customer.email}</div>}
                  {sale.customer.address && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> {sale.customer.address}</div>}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-muted-foreground" /> Sale Info</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground mb-1">Invoice No</p><p className="font-bold">#{sale.invoiceNumber}</p></div>
                <div><p className="text-muted-foreground mb-1">Sale Date</p><p className="font-bold">{formatDate(sale.createdAt)}</p></div>
                <div><p className="text-muted-foreground mb-1">Payment Method</p><p className="font-bold uppercase">{sale.paymentMethod}</p></div>
                <div><p className="text-muted-foreground mb-1">Cashier</p><p className="font-bold">{typeof sale.cashier === "string" ? "System" : sale.cashier.name}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30"><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" /> Item Details</CardTitle></CardHeader>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left p-4 font-medium text-muted-foreground">Sr</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Rate</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground">{index + 1}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-center">{item.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 border-t bg-muted/20">
            <div className="flex flex-col items-end gap-2">
              <div className="flex justify-between w-full max-w-xs text-sm font-bold text-lg text-primary border-t pt-2"><span>Grand Total</span><span>{formatCurrency(sale.totalAmount)}</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. THE SYSTEMATIC INVOICE (Hidden from screen, used for PDF/Print) */}
      <div style={{ display: "none" }}>
        <div ref={invoiceRef} className="bg-white text-black p-0 w-full font-sans">
          {/* Header */}
          <div className="p-10 border-b-2 border-slate-200 flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-indigo-600">POS ERP</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Premium Business Solutions</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-bold space-y-1">
                <p>Akola, Maharashtra, India</p>
                <p>+91 98765 43210</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-5xl font-black text-indigo-600 uppercase tracking-tighter mb-2">TAX INVOICE</h1>
              <div className="space-y-1 text-sm font-black">
                <p>INVOICE NO: <span className="text-indigo-600">#{sale.invoiceNumber}</span></p>
                <p>DATE: {formatDate(sale.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-2 border-b-2 border-slate-200">
            <div className="p-10 border-r-2 border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b-2 pb-2 inline-block">Billed To</h3>
              <div className="space-y-4">
                <div className="text-2xl font-black text-indigo-600">
                  {typeof sale.customer !== "string" && sale.customer ? sale.customer.name : sale.customerName}
                </div>
                {typeof sale.customer !== "string" && sale.customer && (
                  <div className="space-y-2 text-sm font-bold text-slate-600">
                    <p className="flex items-center gap-2">Ph: {sale.customer.phone}</p>
                    {sale.customer.email && <p>{sale.customer.email}</p>}
                    {sale.customer.address && <p className="leading-relaxed">{sale.customer.address}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="p-10 bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b-2 pb-2 inline-block">Order Summary</h3>
              <div className="grid grid-cols-2 gap-y-6 text-sm font-black">
                <div><p className="text-[9px] uppercase text-slate-400 mb-1">Payment Status</p><p className="text-emerald-600 uppercase">{sale.paymentStatus}</p></div>
                <div><p className="text-[9px] uppercase text-slate-400 mb-1">Method</p><p className="uppercase">{sale.paymentMethod}</p></div>
                <div><p className="text-[9px] uppercase text-slate-400 mb-1">Cashier</p><p className="uppercase">{typeof sale.cashier === "string" ? "System" : sale.cashier.name}</p></div>
                <div><p className="text-[9px] uppercase text-slate-400 mb-1">Jurisdiction</p><p className="uppercase text-[10px]">Local Authority</p></div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left p-5 uppercase font-black tracking-widest text-[10px] w-16">#</th>
                  <th className="text-left p-5 uppercase font-black tracking-widest text-[10px]">Item Description</th>
                  <th className="text-center p-5 uppercase font-black tracking-widest text-[10px]">Qty</th>
                  <th className="text-right p-5 uppercase font-black tracking-widest text-[10px]">Rate</th>
                  <th className="text-right p-5 uppercase font-black tracking-widest text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="border-b-2 border-slate-100">
                    <td className="p-5 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-5 font-black text-lg">{item.name}<div className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest">SKU: {item.sku}</div></td>
                    <td className="p-5 text-center font-black text-lg">{item.quantity}</td>
                    <td className="p-5 text-right font-bold text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-5 text-right font-black text-xl text-indigo-600">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-10 flex justify-between gap-20">
            <div className="flex-1">
              <div className="border-4 border-double border-slate-200 p-6 rounded-3xl bg-slate-50">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">Terms & Conditions</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                  1. Goods once sold will not be taken back.<br/>
                  2. All disputes are subject to local jurisdiction.<br/>
                  3. This is a computer generated invoice.
                </p>
              </div>
            </div>
            <div className="w-80 space-y-4">
              <div className="flex justify-between text-xs font-black uppercase border-b-2 border-slate-100 pb-2"><span>Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
              {sale.taxAmount > 0 && <div className="flex justify-between text-xs font-black uppercase border-b-2 border-slate-100 pb-2"><span>Total Tax</span><span>{formatCurrency(sale.taxAmount)}</span></div>}
              {sale.discountAmount > 0 && <div className="flex justify-between text-xs font-black uppercase text-emerald-600 bg-emerald-50 p-2 rounded-lg border-2 border-emerald-100"><span>Discount</span><span>-{formatCurrency(sale.discountAmount)}</span></div>}
              
              <div className="pt-2">
                <div className="flex justify-between items-center p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-200">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Payable Amount</span>
                  <span className="text-3xl font-black">{formatCurrency(sale.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-16 flex justify-between gap-10">
                <div className="flex-1 text-center"><div className="border-b-2 border-slate-200 mb-2 h-8"></div><p className="text-[10px] font-black uppercase text-slate-400">Customer</p></div>
                <div className="flex-1 text-center"><div className="border-b-2 border-slate-200 mb-2 h-8"></div><p className="text-[10px] font-black uppercase text-slate-400">Authorized</p></div>
              </div>
            </div>
          </div>
          <div className="p-10 text-center border-t-2 border-slate-100 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
            THANK YOU FOR SHOPPING WITH US
          </div>
        </div>
      </div>
    </div>
  );
}
