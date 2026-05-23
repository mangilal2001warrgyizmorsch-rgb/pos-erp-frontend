"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Receipt, Printer, ShieldCheck, Phone, MapPin, Package, FileText
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { purchaseService } from "@/services/purchaseService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase, PurchaseStatus, PurchasePaymentStatus } from "@/types";
import { PrintPurchaseDialog } from "@/components/purchases/PrintPurchaseDialog";

const statusColors: Record<PurchaseStatus, string> = {
  draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  received: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  returned: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const paymentColors: Record<PurchasePaymentStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  partial: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function PurchaseDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getById(id);
      setPurchase(data);
    } catch {
      toast.error("Failed to load purchase details");
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
          <p className="text-sm text-muted-foreground">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <Receipt className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Purchase Not Found</h2>
        <Button onClick={() => router.push("/purchases")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchases
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
                {purchase.purchaseNumber}
              </h1>
              <p className="text-sm text-muted-foreground">Created on {formatDate(purchase.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => setPrintOpen(true)} className="gap-2 shadow-lg shadow-primary/20 px-6">
              <Printer className="h-4 w-4" /> Generate Invoice / PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Badge className={statusColors[purchase.status]} variant="outline">{purchase.status.toUpperCase()}</Badge>
          <Badge className={paymentColors[purchase.paymentStatus]} variant="outline">{purchase.paymentStatus.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" /> Supplier Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="font-semibold text-lg">
                {typeof purchase.supplier !== "string" && purchase.supplier ? purchase.supplier.name : purchase.supplierName}
              </div>
              {typeof purchase.supplier !== "string" && purchase.supplier && (
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {purchase.supplier.phone}</div>
                  {purchase.supplier.gstNumber && <div className="flex items-center gap-2 font-bold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> GST: {purchase.supplier.gstNumber}</div>}
                  {purchase.supplier.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5" /> {purchase.supplier.address}</div>}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-muted-foreground" /> Purchase Info</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground mb-1">Purchase No</p><p className="font-bold">{purchase.purchaseNumber}</p></div>
                <div><p className="text-muted-foreground mb-1">Purchase Date</p><p className="font-bold">{formatDate(purchase.purchaseDate)}</p></div>
                {purchase.invoiceNumber && <div className="col-span-2"><p className="text-muted-foreground mb-1">Supplier Ref</p><p className="font-bold">{purchase.invoiceNumber}</p></div>}
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
              {purchase.items.map((item, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground">{index + 1}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-center">{item.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 border-t bg-muted/20">
            <div className="flex flex-col items-end gap-2 text-sm">
              <div className="flex justify-between w-full max-w-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(purchase.subtotal || 0)}</span>
              </div>
              {purchase.discountAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-rose-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(purchase.discountAmount)}</span>
                </div>
              )}
              {purchase.shippingCharges > 0 && (
                <div className="flex justify-between w-full max-w-xs text-muted-foreground">
                  <span>Shipping Charges</span>
                  <span>+{formatCurrency(purchase.shippingCharges)}</span>
                </div>
              )}
              {purchase.taxAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs text-muted-foreground">
                  <span>GST Tax</span>
                  <span>+{formatCurrency(purchase.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-xs text-lg font-bold text-primary border-t pt-2 mt-1">
                <span>Grand Total</span>
                <span>{formatCurrency(purchase.totalAmount)}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-muted-foreground pt-1">
                <span>Amount Paid</span>
                <span className="font-semibold text-foreground">{formatCurrency(purchase.amountPaid || 0)}</span>
              </div>
              {purchase.dueAmount > 0.01 && (
                <div className="flex justify-between w-full max-w-xs text-rose-600 font-semibold pt-1 border-t border-dashed">
                  <span>Due Amount</span>
                  <span>{formatCurrency(purchase.dueAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <PrintPurchaseDialog 
        open={printOpen} 
        onOpenChange={setPrintOpen} 
        purchase={purchase} 
      />
    </div>
  );
}
