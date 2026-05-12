"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Receipt, Printer, FileDown, Clock, Package,
  FileText, IndianRupee, Truck, ShieldCheck, Mail, Phone, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { purchaseService } from "@/services/purchaseService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase, PurchaseStatus, PurchasePaymentStatus } from "@/types";

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

  const handlePrint = () => {
    window.print();
  };

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
        <div>
          <h2 className="text-xl font-bold">Purchase Not Found</h2>
          <p className="text-muted-foreground mt-1">The requested purchase bill does not exist or was deleted.</p>
        </div>
        <Button onClick={() => router.push("/purchases")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0 print:bg-white print:text-black">
      {/* Non-Printable Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              {purchase.purchaseNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created on {formatDate(purchase.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="print:shadow-none print:border-none print:w-full space-y-6">
        {/* Status Badges (Hidden in Print) */}
        <div className="flex gap-3 print:hidden">
          <Badge className={statusColors[purchase.status]} variant="outline">
            {purchase.status.toUpperCase()}
          </Badge>
          <Badge className={paymentColors[purchase.paymentStatus]} variant="outline">
            {purchase.paymentStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Invoice Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="font-semibold text-lg">{purchase.supplierName}</div>
              {typeof purchase.supplier !== "string" && (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {purchase.supplier.phone}
                  </div>
                  {purchase.supplier.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {purchase.supplier.email}
                    </div>
                  )}
                  {purchase.supplier.gstNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      GST: {purchase.supplier.gstNumber}
                    </div>
                  )}
                  {(purchase.supplier.address || purchase.supplier.city) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {[purchase.supplier.address, purchase.supplier.city, purchase.supplier.state, purchase.supplier.pincode]
                          .filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Purchase Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">Purchase No</p>
                  <p className="font-medium">{purchase.purchaseNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Purchase Date</p>
                  <p className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString("en-IN")}</p>
                </div>
                {purchase.invoiceNumber && (
                  <div>
                    <p className="text-muted-foreground mb-1">Supplier Invoice</p>
                    <p className="font-medium">{purchase.invoiceNumber}</p>
                  </div>
                )}
                {purchase.transporterName && (
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Transporter
                    </p>
                    <p className="font-medium">{purchase.transporterName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card className="overflow-hidden print:shadow-none print:border-gray-200">
          <CardHeader className="bg-muted/30 print:bg-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Item Details
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/10 print:bg-gray-50">
                  <th className="text-left p-4 font-medium text-muted-foreground print:text-gray-600">Sr</th>
                  <th className="text-left p-4 font-medium text-muted-foreground print:text-gray-600">Product</th>
                  <th className="text-center p-4 font-medium text-muted-foreground print:text-gray-600">Qty</th>
                  <th className="text-right p-4 font-medium text-muted-foreground print:text-gray-600">Rate</th>
                  <th className="text-right p-4 font-medium text-muted-foreground print:text-gray-600 hidden sm:table-cell">Disc</th>
                  <th className="text-right p-4 font-medium text-muted-foreground print:text-gray-600 hidden sm:table-cell">Tax</th>
                  <th className="text-right p-4 font-medium text-muted-foreground print:text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={index} className="border-b border-border/50 print:border-gray-200 last:border-0">
                    <td className="p-4 text-muted-foreground print:text-gray-500">{index + 1}</td>
                    <td className="p-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-500">SKU: {item.sku}</p>
                    </td>
                    <td className="p-4 text-center">{item.quantity}</td>
                    <td className="p-4 text-right">{formatCurrency(item.purchaseRate)}</td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      {item.discount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{item.discount}%</span>
                          <span className="text-xs text-muted-foreground">-{formatCurrency(item.discountAmount)}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      {item.taxRate > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{item.taxRate}%</span>
                          <span className="text-xs text-muted-foreground">+{formatCurrency(item.taxAmount)}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
          <div className="space-y-4">
            {purchase.notes && (
              <Card className="bg-muted/10 print:shadow-none print:border-gray-200 print:bg-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notes & Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchase.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card className="print:shadow-none print:border-gray-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground print:text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(purchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground print:text-gray-600">Total Discount</span>
                <span className="text-emerald-500 font-medium print:text-gray-800">-{formatCurrency(purchase.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground print:text-gray-600">Total Tax</span>
                <span className="font-medium">{formatCurrency(purchase.taxAmount)}</span>
              </div>
              {purchase.shippingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground print:text-gray-600">Shipping / Freight</span>
                  <span className="font-medium">{formatCurrency(purchase.shippingCharges)}</span>
                </div>
              )}
              <Separator className="print:bg-gray-300" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-primary print:text-black">{formatCurrency(purchase.totalAmount)}</span>
              </div>
              
              <div className="pt-4 space-y-3 border-t print:border-gray-300 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> Amount Paid
                  </span>
                  <span className="font-medium">{formatCurrency(purchase.amountPaid)}</span>
                </div>
                {purchase.dueAmount > 0 && (
                  <div className="flex justify-between text-sm text-destructive print:text-gray-800">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Balance Due
                    </span>
                    <span className="font-bold">{formatCurrency(purchase.dueAmount)}</span>
                  </div>
                )}
                {purchase.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground print:text-gray-600">Payment Mode</span>
                    <span className="font-medium uppercase">{purchase.paymentMethod.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
          .print\\:bg-gray-50 { background-color: #f9fafb !important; }
          .print\\:text-gray-600 { color: #4b5563 !important; }
          .print\\:text-gray-500 { color: #6b7280 !important; }
          .print\\:text-gray-800 { color: #1f2937 !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:break-inside-avoid { break-inside: avoid !important; }
        }
      `}} />
    </div>
  );
}
