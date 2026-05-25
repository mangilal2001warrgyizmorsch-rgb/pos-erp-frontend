"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { businessService } from "@/services/businessService";
import type { BusinessProfile } from "@/types";
import { DEFAULT_PRINT_BUSINESS } from "@/lib/print/printUtils";
import { a4PageStyle } from "@/lib/print/thermalPrintUtils";
import { ReportPrintTemplate, type ReportCell, type ReportColumn } from "@/lib/print/templates/ReportPrintTemplate";

export function ReportPrintDialog({ open, onOpenChange, title, subtitle, columns, rows, totals }: { open: boolean; onOpenChange: (value: boolean) => void; title: string; subtitle?: string; columns: ReportColumn[]; rows: Record<string, ReportCell>[]; totals?: Record<string, ReportCell>; }) {
  const [business, setBusiness] = useState<BusinessProfile>(DEFAULT_PRINT_BUSINESS);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) businessService.getProfile().then(setBusiness).catch(() => setBusiness(DEFAULT_PRINT_BUSINESS)); }, [open]);
  const print = useReactToPrint({ contentRef: ref, documentTitle: title, pageStyle: a4PageStyle });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex h-[90vh] max-w-6xl flex-col overflow-hidden p-0"><DialogHeader className="border-b p-5"><DialogTitle>{title} - Print Preview</DialogTitle></DialogHeader><div className="flex-1 overflow-auto bg-muted/30 p-6"><div ref={ref} className="mx-auto bg-white shadow-xl"><ReportPrintTemplate business={business} title={title} subtitle={subtitle} columns={columns} rows={rows} totals={totals} /></div></div><footer className="flex justify-end gap-3 border-t p-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button className="gap-2" onClick={() => print()}><Printer className="h-4 w-4" />Print Report</Button></footer></DialogContent></Dialog>;
}
