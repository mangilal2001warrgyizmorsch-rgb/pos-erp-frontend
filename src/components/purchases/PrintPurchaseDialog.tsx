"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, Printer, ReceiptText } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { businessService } from "@/services/businessService";
import type { BusinessProfile, Purchase } from "@/types";
import { PurchaseBillTemplate } from "@/lib/print/templates/PurchaseBillTemplate";
import { downloadPurchasePdf } from "@/lib/print/pdfUtils";
import { DEFAULT_PRINT_BUSINESS } from "@/lib/print/printUtils";
import { a4PageStyle } from "@/lib/print/thermalPrintUtils";

export function PrintPurchaseDialog({ open, onOpenChange, purchase }: { open: boolean; onOpenChange: (open: boolean) => void; purchase: Purchase | null }) {
  const [business, setBusiness] = useState<BusinessProfile>(DEFAULT_PRINT_BUSINESS);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) businessService.getProfile().then(setBusiness).catch(() => setBusiness(DEFAULT_PRINT_BUSINESS)); }, [open]);
  const print = useReactToPrint({ contentRef: printRef, documentTitle: purchase ? `Purchase-Bill-${purchase.purchaseNumber}` : "Purchase-Bill", pageStyle: a4PageStyle });
  if (!purchase) return null;
  const downloadPdf = async () => { setDownloading(true); try { await downloadPurchasePdf(purchase, business); } finally { setDownloading(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[92vh] max-w-6xl flex-col overflow-hidden p-0">
      <DialogHeader className="border-b p-5"><DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Purchase Bill Preview <span className="text-sm font-normal text-muted-foreground">#{purchase.purchaseNumber}</span></DialogTitle></DialogHeader>
      <div className="flex-1 overflow-auto bg-muted/30 p-6"><div className="mx-auto w-fit bg-white shadow-xl" ref={printRef}><PurchaseBillTemplate purchase={purchase} business={business} /></div></div>
      <footer className="flex justify-end gap-3 border-t p-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button variant="outline" className="gap-2" disabled={downloading} onClick={downloadPdf}><FileDown className="h-4 w-4" />{downloading ? "Preparing..." : "Download PDF"}</Button><Button className="gap-2" onClick={() => print()}><Printer className="h-4 w-4" />Print A4 Bill</Button></footer>
    </DialogContent>
  </Dialog>;
}
