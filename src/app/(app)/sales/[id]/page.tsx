"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  FileText,
  MapPin,
  Package,
  Phone,
  Printer,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintSaleDialog } from "@/components/sales/PrintSaleDialog";
import { saleService } from "@/services/saleService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";

const statusColors: Record<Sale["status"], string> = {
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const paymentColors: Record<Sale["paymentStatus"], string> = {
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  partial: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function SaleDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    let active = true;
    saleService.getById(id)
      .then((data) => { if (active) setSale(data); })
      .catch(() => { if (active) toast.error("Failed to load sale invoice details"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading sale invoice details...</p>
      </div>
    </div>;
  }

  if (!sale) {
    return <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <Receipt className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-xl font-bold">Sale Invoice Not Found</h2>
      <Button onClick={() => router.push("/sales")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
      </Button>
    </div>;
  }

  const customer = typeof sale.customer === "object" ? sale.customer : undefined;
  const balanceDue = Math.max(0, sale.totalAmount - sale.amountPaid);

  return <div className="mx-auto max-w-5xl space-y-6 pb-10">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-title">{sale.invoiceNumber}</h1>
          <p className="page-description mt-0.5">Created on {formatDate(sale.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/pos?editSale=${sale._id}`)} className="gap-2">
          <Edit className="h-4 w-4" /> Edit Invoice
        </Button>
        <Button onClick={() => setPrintOpen(true)} className="gap-2 px-6 shadow-lg shadow-primary/20">
          <Printer className="h-4 w-4" /> Generate Invoice / PDF
        </Button>
      </div>
    </div>

    <div className="flex gap-3">
      <Badge className={statusColors[sale.status]} variant="outline">{sale.status.toUpperCase()}</Badge>
      <Badge className={paymentColors[sale.paymentStatus]} variant="outline">{sale.paymentStatus.toUpperCase()}</Badge>
    </div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-muted-foreground" /> Customer Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-lg font-semibold">{sale.customerName || "Walk-in Customer"}</div>
          {customer && <div className="space-y-2 text-muted-foreground">
            {customer.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {customer.phone}</div>}
            {customer.gstNumber && <div className="flex items-center gap-2 font-bold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> GST: {customer.gstNumber}</div>}
            {customer.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /> {customer.address}</div>}
          </div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg"><Receipt className="h-5 w-5 text-muted-foreground" /> Invoice Info</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="mb-1 text-muted-foreground">Invoice No</p><p className="font-bold">{sale.invoiceNumber}</p></div>
            <div><p className="mb-1 text-muted-foreground">Invoice Date</p><p className="font-bold">{formatDate(sale.createdAt)}</p></div>
            <div><p className="mb-1 text-muted-foreground">Payment Mode</p><p className="font-bold uppercase">{sale.paymentMethod}</p></div>
            <div><p className="mb-1 text-muted-foreground">Payment Status</p><p className="font-bold uppercase">{sale.paymentStatus}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-muted-foreground" /> Item Details</CardTitle></CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/10">
            <th className="p-4 text-left font-medium text-muted-foreground">Sr</th>
            <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
            <th className="p-4 text-center font-medium text-muted-foreground">Qty</th>
            <th className="p-4 text-right font-medium text-muted-foreground">Rate</th>
            <th className="p-4 text-right font-medium text-muted-foreground">Tax</th>
            <th className="p-4 text-right font-medium text-muted-foreground">Total</th>
          </tr></thead>
          <tbody>{sale.items.map((item, index) => <tr key={`${item.sku}-${index}`} className="border-b last:border-0 hover:bg-muted/50">
            <td className="p-4 text-muted-foreground">{index + 1}</td>
            <td className="p-4"><p className="font-medium">{item.name}</p>{item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}</td>
            <td className="p-4 text-center">{item.quantity}</td>
            <td className="p-4 text-right">{formatCurrency(item.unitPrice)}</td>
            <td className="p-4 text-right">{item.taxRate || 0}%</td>
            <td className="p-4 text-right font-bold">{formatCurrency(item.total)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="border-t bg-muted/20 p-6">
        <div className="ml-auto flex w-full max-w-xs flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(sale.subtotal || 0)}</span></div>
          {sale.discountAmount > 0 && <div className="flex justify-between text-rose-500"><span>Discount</span><span>-{formatCurrency(sale.discountAmount)}</span></div>}
          {sale.taxAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>GST Tax</span><span>+{formatCurrency(sale.taxAmount)}</span></div>}
          <div className="mt-1 flex justify-between border-t pt-2 text-lg font-bold text-primary"><span>Grand Total</span><span>{formatCurrency(sale.totalAmount)}</span></div>
          <div className="flex justify-between pt-1 text-muted-foreground"><span>Amount Paid</span><span className="font-semibold text-foreground">{formatCurrency(sale.amountPaid || 0)}</span></div>
          {sale.changeAmount > 0 && <div className="flex justify-between font-semibold text-emerald-600"><span>Change Returned</span><span>{formatCurrency(sale.changeAmount)}</span></div>}
          {balanceDue > 0.01 && <div className="flex justify-between border-t border-dashed pt-1 font-semibold text-rose-600"><span>Balance Due</span><span>{formatCurrency(balanceDue)}</span></div>}
        </div>
      </div>
    </Card>

    {sale.notes && <Card><CardHeader className="pb-3"><CardTitle className="text-base">Notes</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{sale.notes}</CardContent></Card>}

    <PrintSaleDialog open={printOpen} onOpenChange={setPrintOpen} sale={sale} />
  </div>;
}
