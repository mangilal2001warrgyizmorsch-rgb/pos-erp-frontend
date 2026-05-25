import type { BusinessProfile, Purchase, PurchaseReturnModel, Sale, SaleReturn } from "@/types";
import { pdfCurrency, printDate, printGSTIN, showValue } from "./printUtils";

export async function loadPdfImage(source?: string): Promise<string | undefined> {
  if (!source) return undefined;
  if (source.startsWith("data:image/")) return source;
  try {
    const response = await fetch(source);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export function pdfImageFormat(data: string): string {
  if (data.startsWith("data:image/png")) return "PNG";
  if (data.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

async function basePdf(title: string, number: string, business: BusinessProfile) {
  const jsPDF = (await import("jspdf")).default;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadPdfImage(business.logo);
  const businessX = logo ? 36 : 14;
  if (logo) pdf.addImage(logo, pdfImageFormat(logo), 14, 8, 18, 18);
  pdf.setTextColor(55, 48, 163);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(showValue(business.businessName), businessX, 16);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text([showValue(business.address), `Phone: ${showValue(business.phone)}  GSTIN: ${printGSTIN(business.gstin)}`], businessX, 22);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(title, 196, 16, { align: "right" });
  pdf.setFontSize(10);
  pdf.text(`#${number}`, 196, 23, { align: "right" });
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.7);
  pdf.line(14, 31, 196, 31);
  return pdf;
}

type PDFDocument = Awaited<ReturnType<typeof basePdf>>;

async function table(pdf: PDFDocument, head: string[], rows: string[][], startY: number) {
  const autoTable = (await import("jspdf-autotable")).default;
  autoTable(pdf, {
    head: [head], body: rows, startY, theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.4, overflow: "linebreak" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

function totalBlock(pdf: PDFDocument, lines: Array<[string, string]>): number {
  pdf.setTextColor(15, 23, 42);
  const last = (pdf as PDFDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 85;
  let y = last + 8;
  lines.forEach(([label, value], index) => {
    if (index === lines.length - 1) { pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.line(128, y - 3, 196, y - 3); }
    else { pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); }
    pdf.text(label, 146, y, { align: "right" });
    pdf.text(value, 196, y, { align: "right" });
    y += 6;
  });
  return y;
}

async function authorizedSignature(pdf: PDFDocument, business: BusinessProfile, requestedY: number) {
  let y = requestedY;
  if (y > 267) {
    pdf.addPage();
    y = 25;
  }
  const signature = await loadPdfImage(business.signature);
  if (signature) pdf.addImage(signature, pdfImageFormat(signature), 154, y, 34, 13);
  const lineY = signature ? y + 16 : y + 4;
  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.2);
  pdf.line(148, lineY, 196, lineY);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("Authorized Signatory", 172, lineY + 5, { align: "center" });
}

export async function downloadSalePdf(sale: Sale, business: BusinessProfile) {
  const pdf = await basePdf("TAX INVOICE", sale.invoiceNumber, business);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Customer: ${sale.customerName || "Walk-in Customer"}`, 14, 40);
  pdf.text(`Date: ${printDate(sale.createdAt)}    Payment: ${sale.paymentMethod.toUpperCase()} (${sale.paymentStatus.toUpperCase()})`, 14, 46);
  await table(pdf, ["#", "Item / SKU", "Qty", "Rate", "Tax", "Amount"], sale.items.map((item, i) => [String(i + 1), `${item.name}\n${item.sku || ""}`, String(item.quantity), pdfCurrency(item.unitPrice), `${item.taxRate || 0}%`, pdfCurrency(item.total)]), 54);
  const totalY = totalBlock(pdf, [["Subtotal", pdfCurrency(sale.subtotal)], ["Discount", `- ${pdfCurrency(sale.discountAmount)}`], ["Tax", pdfCurrency(sale.taxAmount)], ["Grand Total", pdfCurrency(sale.totalAmount)]]);
  await authorizedSignature(pdf, business, totalY + 8);
  pdf.save(`Sale-Invoice-${sale.invoiceNumber}.pdf`);
}

export async function downloadPurchasePdf(purchase: Purchase, business: BusinessProfile) {
  const pdf = await basePdf("PURCHASE BILL", purchase.purchaseNumber, business);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Supplier: ${purchase.supplierName}`, 14, 40);
  pdf.text(`Date: ${printDate(purchase.purchaseDate)}    Supplier Ref: ${purchase.invoiceNumber || "-"}`, 14, 46);
  await table(pdf, ["#", "Item / SKU", "Qty", "Cost", "Tax", "Amount"], purchase.items.map((item, i) => [String(i + 1), `${item.name}\n${item.sku || ""}`, String(item.quantity), pdfCurrency(item.purchasePrice), `${item.taxRate || 0}%`, pdfCurrency(item.total)]), 54);
  const totalY = totalBlock(pdf, [["Subtotal", pdfCurrency(purchase.subtotal)], ["Discount", `- ${pdfCurrency(purchase.discountAmount)}`], ["Tax", pdfCurrency(purchase.taxAmount)], ["Shipping", pdfCurrency(purchase.shippingCharges)], ["Grand Total", pdfCurrency(purchase.totalAmount)]]);
  await authorizedSignature(pdf, business, totalY + 8);
  pdf.save(`Purchase-Bill-${purchase.purchaseNumber}.pdf`);
}

export async function downloadSaleReturnPdf(note: SaleReturn, business: BusinessProfile) {
  const pdf = await basePdf("CREDIT NOTE", note.creditNoteNo, business);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Customer: ${note.customerName}    Original Invoice: ${note.invoiceNumber}`, 14, 40);
  pdf.text(`Return Date: ${printDate(note.returnDate)}    Status: ${note.status.toUpperCase()}`, 14, 46);
  await table(pdf, ["#", "Returned Item", "Qty", "Rate", "Tax", "Credit"], note.items.map((item, i) => [String(i + 1), item.itemName, String(item.returnQty), pdfCurrency(item.pricePerUnit), `${item.taxPercent}%`, pdfCurrency(item.returnAmount)]), 54);
  const totalY = totalBlock(pdf, [["Subtotal", pdfCurrency(note.subtotal)], ["Discount Reversed", `- ${pdfCurrency(note.totalDiscount)}`], ["Tax Reversed", pdfCurrency(note.totalTax)], ["Total Credit", pdfCurrency(note.grandTotal)]]);
  await authorizedSignature(pdf, business, totalY + 8);
  pdf.save(`Credit-Note-${note.creditNoteNo}.pdf`);
}

export async function downloadPurchaseReturnPdf(note: PurchaseReturnModel, business: BusinessProfile) {
  const pdf = await basePdf("DEBIT NOTE", note.debitNoteNo, business);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Supplier: ${note.supplierName}    Original Bill: ${note.purchaseNumber}`, 14, 40);
  pdf.text(`Return Date: ${printDate(note.returnDate)}    Status: ${note.status.toUpperCase()}`, 14, 46);
  await table(pdf, ["#", "Returned Item", "Qty", "Cost", "Tax", "Debit"], note.items.map((item, i) => [String(i + 1), item.itemName, String(item.returnQty), pdfCurrency(item.purchasePrice), `${item.taxPercent}%`, pdfCurrency(item.returnAmount)]), 54);
  const totalY = totalBlock(pdf, [["Subtotal", pdfCurrency(note.subtotal)], ["Discount Reversed", `- ${pdfCurrency(note.totalDiscount)}`], ["Tax Reversed", pdfCurrency(note.totalTax)], ["Total Debit", pdfCurrency(note.grandTotal)]]);
  await authorizedSignature(pdf, business, totalY + 8);
  pdf.save(`Debit-Note-${note.debitNoteNo}.pdf`);
}
