import { format } from "date-fns";
import { pdfCurrency, printDateTime } from "./printUtils";
import type { BusinessProfile } from "@/types";
import { loadPdfImage, pdfImageFormat } from "./pdfUtils";

export type ExportValue = string | number | boolean | null | undefined;
export type ExportRow = Record<string, ExportValue>;
export interface ExportContext { title: string; filename: string; dateRange?: string; filters?: string; business?: BusinessProfile; totals?: ExportRow; }

function columnsFor(rows: ExportRow[]) { return rows.length ? Object.keys(rows[0]) : []; }
function label(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).trim(); }
function clean(value: ExportValue) { return value === null || value === undefined ? "" : String(value); }
function csvValue(value: ExportValue) { return `"${clean(value).replace(/"/g, '""')}"`; }
function download(content: BlobPart, filename: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }

export function exportReportCsv(rows: ExportRow[], context: ExportContext) {
  const columns = columnsFor(rows);
  const meta = [[context.title], [context.dateRange || ""], [context.filters || ""], []].map((line) => line.map(csvValue).join(","));
  const body = [columns.map((key) => csvValue(label(key))).join(","), ...rows.map((row) => columns.map((key) => csvValue(row[key])).join(","))];
  if (context.totals) body.push(columns.map((key) => csvValue(context.totals?.[key])).join(","));
  download(`\uFEFF${[...meta, ...body].join("\r\n")}`, `${context.filename}.csv`, "text/csv;charset=utf-8");
}

export async function exportReportExcel(rows: ExportRow[], context: ExportContext) {
  const XLSX = await import("xlsx");
  const columns = columnsFor(rows);
  const content: Array<Array<ExportValue>> = [[context.business?.businessName || "POS ERP"], [context.title], [context.dateRange || ""], [context.filters || ""], [], columns.map(label), ...rows.map((row) => columns.map((key) => row[key] ?? ""))];
  if (context.totals) content.push(columns.map((key) => context.totals?.[key] ?? ""));
  const sheet = XLSX.utils.aoa_to_sheet(content);
  sheet["!cols"] = columns.map((key) => ({ wch: Math.min(32, Math.max(14, label(key).length + 3, ...rows.map((row) => clean(row[key]).length + 2))) }));
  sheet["!autofilter"] = { ref: `A6:${XLSX.utils.encode_col(Math.max(0, columns.length - 1))}${6 + rows.length}` };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, context.title.slice(0, 31));
  XLSX.writeFile(book, `${context.filename}.xlsx`);
}

export async function exportReportPdf(rows: ExportRow[], context: ExportContext) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF({ orientation: rows.length && columnsFor(rows).length > 6 ? "landscape" : "portrait" });
  const columns = columnsFor(rows);
  const logo = await loadPdfImage(context.business?.logo);
  const headerX = logo ? 36 : 14;
  if (logo) pdf.addImage(logo, pdfImageFormat(logo), 14, 8, 18, 18);
  pdf.setTextColor(55, 48, 163);
  pdf.setFontSize(16); pdf.setFont("helvetica", "bold"); pdf.text(context.business?.businessName || "POS ERP", headerX, 14);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(12); pdf.text(context.title, headerX, 21);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`${context.dateRange || ""} ${context.filters || ""}`.trim(), headerX, 27); pdf.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, headerX, 33);
  const tableRows = rows.map((row) => columns.map((key) => clean(row[key])));
  if (context.totals) tableRows.push(columns.map((key) => clean(context.totals?.[key])));
  autoTable(pdf, { head: [columns.map(label)], body: tableRows, startY: 39, theme: "grid", styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [79, 70, 229], textColor: 255 }, didDrawPage: (data) => { pdf.setFontSize(8); pdf.text(`Page ${data.pageNumber}`, pdf.internal.pageSize.getWidth() - 14, pdf.internal.pageSize.getHeight() - 7, { align: "right" }); } });
  const tableEnd = (pdf as typeof pdf & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 45;
  let signatureY = tableEnd + 9;
  if (signatureY > pdf.internal.pageSize.getHeight() - 27) { pdf.addPage(); signatureY = 22; }
  const signature = await loadPdfImage(context.business?.signature);
  const pageWidth = pdf.internal.pageSize.getWidth();
  if (signature) pdf.addImage(signature, pdfImageFormat(signature), pageWidth - 56, signatureY, 34, 13);
  const lineY = signature ? signatureY + 16 : signatureY + 4;
  pdf.line(pageWidth - 64, lineY, pageWidth - 14, lineY);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.text("Authorized Signatory", pageWidth - 39, lineY + 5, { align: "center" });
  pdf.save(`${context.filename}.pdf`);
}

export function formatReportValue(key: string, value: unknown): ExportValue {
  if (value === null || value === undefined) return "";
  if (/date|createdAt/i.test(key) && typeof value === "string") return printDateTime(value);
  if (/amount|total|tax|price|revenue|profit|cost|value|payment/i.test(key) && typeof value === "number") return pdfCurrency(value);
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
