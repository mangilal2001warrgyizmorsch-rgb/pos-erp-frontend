"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, Printer, ReceiptText } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessService } from "@/services/businessService";
import type { BusinessProfile, Sale } from "@/types";
import { A4InvoiceTemplate } from "@/lib/print/templates/A4InvoiceTemplate";
import { ThermalReceiptTemplate } from "@/lib/print/templates/ThermalReceiptTemplate";
import { downloadSalePdf } from "@/lib/print/pdfUtils";
import { DEFAULT_PRINT_BUSINESS, type ThermalWidth } from "@/lib/print/printUtils";
import { a4PageStyle, thermalPageStyle } from "@/lib/print/thermalPrintUtils";

export function PrintSaleDialog({ open, onOpenChange, sale }: { open: boolean; onOpenChange: (open: boolean) => void; sale: Sale | null }) {
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const [width, setWidth] = useState<ThermalWidth>(80);
  const [business, setBusiness] = useState<BusinessProfile>(DEFAULT_PRINT_BUSINESS);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    businessService.getProfile().then(setBusiness).catch(() => setBusiness(DEFAULT_PRINT_BUSINESS));
  }, [open]);

  const print = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Sale-Invoice-${sale.invoiceNumber}` : "Sale-Invoice",
    pageStyle: format === "thermal" ? thermalPageStyle(width) : a4PageStyle,
  });

  if (!sale) return null;

  const downloadPdf = async () => {
    setDownloading(true);
    try { await downloadSalePdf(sale, business); } finally { setDownloading(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[92vh] max-w-6xl flex-col overflow-hidden p-0">
      <DialogHeader className="border-b p-5"><DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Print Sale Invoice <span className="text-sm font-normal text-muted-foreground">#{sale.invoiceNumber}</span></DialogTitle></DialogHeader>
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 space-y-5 border-r bg-muted/10 p-5">
          <div className="space-y-2"><p className="text-xs font-bold uppercase text-muted-foreground">Format</p><div className="grid gap-2"><Button variant={format === "thermal" ? "default" : "outline"} onClick={() => setFormat("thermal")}>Thermal Receipt</Button><Button variant={format === "a4" ? "default" : "outline"} onClick={() => setFormat("a4")}>A4 Invoice</Button></div></div>
          {format === "thermal" && <div className="space-y-2"><p className="text-xs font-bold uppercase text-muted-foreground">Paper Width</p><Select value={String(width)} onValueChange={(value) => setWidth(Number(value) as ThermalWidth)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="58">58mm Thermal</SelectItem><SelectItem value="80">80mm Thermal</SelectItem></SelectContent></Select></div>}
          <p className="text-xs leading-relaxed text-muted-foreground">Thermal output uses the exact paper width with minimal safe padding to prevent clipping. A4 and PDF use the tax invoice layout.</p>
        </aside>
        <main className="flex-1 overflow-auto bg-muted/30 p-6"><div className="flex justify-center"><div ref={printRef} className="bg-white shadow-xl">{format === "thermal" ? <ThermalReceiptTemplate sale={sale} business={business} width={width} /> : <A4InvoiceTemplate sale={sale} business={business} />}</div></div></main>
      </div>
      <footer className="flex justify-end gap-3 border-t p-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button variant="outline" className="gap-2" onClick={downloadPdf} disabled={downloading}><FileDown className="h-4 w-4" />{downloading ? "Preparing..." : "Download PDF"}</Button><Button className="gap-2" onClick={() => print()}><Printer className="h-4 w-4" />Print {format === "thermal" ? "Receipt" : "Invoice"}</Button></footer>
    </DialogContent>
  </Dialog>;
}
