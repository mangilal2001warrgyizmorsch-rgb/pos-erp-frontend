"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Receipt, Printer, Mail, Phone, MapPin, User, Package
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saleService } from "@/services/saleService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";

export default function SaleDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

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
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
          .border {
            border: 1px solid #ddd !important;
          }
          .bg-muted\\/30, .bg-muted\\/10, .bg-muted\\/20 {
            background-color: transparent !important;
          }
        }
      `}</style>
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
            <Button variant="default" onClick={() => setPrintOpen(true)} className="gap-2 shadow-lg shadow-primary/20 px-6">
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
            <div className="flex flex-col items-end gap-2 text-sm">
              <div className="flex justify-between w-full max-w-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(sale.subtotal || 0)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-rose-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-muted-foreground">
                  <span>GST Tax</span>
                  <span>+{formatCurrency(sale.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-xs text-lg font-bold text-primary border-t pt-2 mt-1">
                <span>Grand Total</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-muted-foreground pt-1">
                <span>Amount Paid</span>
                <span className="font-semibold text-foreground">{formatCurrency(sale.amountPaid || 0)}</span>
              </div>
              {(sale.totalAmount - (sale.amountPaid || 0)) > 0.01 && (
                <div className="flex justify-between w-full max-w-xs text-rose-600 font-semibold pt-1 border-t border-dashed">
                  <span>Due Amount</span>
                  <span>{formatCurrency(sale.totalAmount - (sale.amountPaid || 0))}</span>
                </div>
              )}
              {sale.changeAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-emerald-600 font-semibold pt-1">
                  <span>Change Return</span>
                  <span>{formatCurrency(sale.changeAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <PrintSaleDialog 
        open={printOpen} 
        onOpenChange={setPrintOpen} 
        sale={sale} 
      />
    </div>
  );
}
