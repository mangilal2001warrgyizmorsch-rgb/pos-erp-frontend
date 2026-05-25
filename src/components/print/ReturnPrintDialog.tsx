"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { businessService } from "@/services/businessService";
import type { BusinessProfile, PurchaseReturnModel, SaleReturn } from "@/types";
import { DEFAULT_PRINT_BUSINESS } from "@/lib/print/printUtils";
import { a4PageStyle } from "@/lib/print/thermalPrintUtils";
import { downloadPurchaseReturnPdf, downloadSaleReturnPdf } from "@/lib/print/pdfUtils";
import { PurchaseReturnTemplate } from "@/lib/print/templates/PurchaseReturnTemplate";
import { SaleReturnTemplate } from "@/lib/print/templates/SaleReturnTemplate";

type Props = { open: boolean; onOpenChange: (value: boolean) => void; type: "sale"; note: SaleReturn | null } | { open: boolean; onOpenChange: (value: boolean) => void; type: "purchase"; note: PurchaseReturnModel | null };

export function ReturnPrintDialog(props: Props) {
  const [business, setBusiness] = useState<BusinessProfile>(DEFAULT_PRINT_BUSINESS);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (props.open) businessService.getProfile().then(setBusiness).catch(() => setBusiness(DEFAULT_PRINT_BUSINESS)); }, [props.open]);
  const number = props.note ? (props.type === "sale" ? props.note.creditNoteNo : props.note.debitNoteNo) : "Note";
  const print = useReactToPrint({ contentRef: printRef, documentTitle: `${props.type === "sale" ? "Credit" : "Debit"}-Note-${number}`, pageStyle: a4PageStyle });
  if (!props.note) return null;
  const downloadPdf = async () => {
    setDownloading(true);
    try {
      if (props.type === "sale" && props.note) await downloadSaleReturnPdf(props.note, business);
      if (props.type === "purchase" && props.note) await downloadPurchaseReturnPdf(props.note, business);
    } finally { setDownloading(false); }
  };
  const title = props.type === "sale" ? "Credit Note Preview" : "Debit Note Preview";
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="flex h-[92vh] max-w-6xl flex-col overflow-hidden p-0"><DialogHeader className="border-b p-5"><DialogTitle>{title} <span className="text-sm font-normal text-muted-foreground">#{number}</span></DialogTitle></DialogHeader><div className="flex-1 overflow-auto bg-muted/30 p-6"><div ref={printRef} className="mx-auto w-fit bg-white shadow-xl">{props.type === "sale" ? <SaleReturnTemplate note={props.note} business={business} /> : <PurchaseReturnTemplate note={props.note} business={business} />}</div></div><footer className="flex justify-end gap-3 border-t p-4"><Button variant="outline" onClick={() => props.onOpenChange(false)}>Close</Button><Button variant="outline" className="gap-2" disabled={downloading} onClick={downloadPdf}><FileDown className="h-4 w-4" />{downloading ? "Preparing..." : "Download PDF"}</Button><Button className="gap-2" onClick={() => print()}><Printer className="h-4 w-4" />Print A4</Button></footer></DialogContent>
  </Dialog>;
}
