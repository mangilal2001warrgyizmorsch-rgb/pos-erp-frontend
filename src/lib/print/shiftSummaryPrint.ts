import type { BusinessProfile } from "@/types";
import { DEFAULT_PRINT_BUSINESS, printCurrency, printDateTime, printGSTIN, showValue } from "./printUtils";

export interface ShiftSummaryData {
  _id: string;
  cashierName?: string;
  openingCash: number;
  openingTime: string;
  closingTime?: string;
  expectedCash?: number;
  actualCash?: number;
  totalSales?: number;
  totalSalesCash?: number;
  totalSalesCard?: number;
  totalSalesUpi?: number;
  difference?: number;
  notes?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printShiftSummary(shift: ShiftSummaryData, businessProfile?: BusinessProfile | null, cashierName?: string | null): boolean {
  const business = businessProfile || DEFAULT_PRINT_BUSINESS;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const logo = business.logo ? `<img class="logo" src="${escapeHtml(business.logo)}" alt="Business logo" />` : "";
  const printedCashierName = showValue(shift.cashierName || cashierName || "Cashier");
  const shiftNumber = `SHIFT-${shift._id.slice(-8).toUpperCase()}`;
  const closedAt = shift.closingTime || new Date().toISOString();
  const difference = shift.difference || 0;
  const differenceClass = difference === 0 ? "balanced" : "variance";

  const html = `<!doctype html>
    <html>
      <head>
        <title>Shift-Summary-${escapeHtml(shiftNumber)}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #fff; color: #0f172a; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { min-height: 270mm; display: flex; flex-direction: column; }
          .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 18px; }
          .brand { display: flex; align-items: flex-start; gap: 14px; }
          .logo { width: 64px; height: 64px; object-fit: contain; }
          .brand-name { margin: 3px 0 7px; color: #3730a3; font-size: 24px; font-weight: 800; text-transform: uppercase; }
          .muted { color: #64748b; font-size: 12px; line-height: 1.6; }
          .heading { text-align: right; }
          .badge { display: inline-block; background: #4f46e5; border-radius: 7px; padding: 10px 18px; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: .06em; }
          .number { margin: 13px 0 5px; font-size: 16px; font-weight: 700; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin: 24px 0; padding: 18px 20px; border-radius: 14px; background: #f8fafc; }
          .caption { margin: 0 0 10px; color: #94a3b8; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
          .detail { margin: 5px 0; font-size: 13px; }
          .detail strong { float: right; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { padding: 12px; background: #4f46e5; color: white; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: .05em; }
          thead th:last-child, td:last-child { text-align: right; }
          td { padding: 13px 12px; border-bottom: 1px solid #e2e8f0; }
          td:last-child { font-weight: 600; }
          .total-row td { background: #f8fafc; font-weight: 700; }
          .summary { width: 310px; margin: 26px 0 0 auto; font-size: 13px; }
          .sum-row { display: flex; justify-content: space-between; padding: 7px 0; }
          .grand { margin-top: 6px; border-radius: 8px; background: #4f46e5; padding: 13px; color: #fff; font-size: 15px; font-weight: 700; }
          .variance { color: #dc2626; font-weight: 700; }
          .balanced { color: #059669; font-weight: 700; }
          .notes { margin-top: 28px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #475569; }
          .footer { margin-top: auto; padding-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; }
          .footer-copy { max-width: 350px; color: #64748b; font-size: 11px; line-height: 1.6; }
          .cashier { width: 190px; text-align: center; font-size: 12px; }
          .cashier-label { margin-bottom: 24px; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
          .cashier-name { border-top: 1px solid #334155; padding-top: 9px; color: #0f172a; font-size: 13px; font-weight: 700; }
          @media print { body { background: #fff; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="header">
            <div class="brand">
              ${logo}
              <div>
                <h1 class="brand-name">${escapeHtml(showValue(business.businessName))}</h1>
                <div class="muted">${escapeHtml(showValue(business.address))}</div>
                <div class="muted">${escapeHtml(showValue(business.phone))}${business.gstin ? ` | GSTIN: ${escapeHtml(printGSTIN(business.gstin))}` : ""}</div>
              </div>
            </div>
            <div class="heading">
              <div class="badge">SHIFT SUMMARY</div>
              <div class="number">#${escapeHtml(shiftNumber)}</div>
              <div class="muted">${escapeHtml(printDateTime(closedAt))}</div>
            </div>
          </header>

          <section class="meta">
            <div>
              <p class="caption">Session Details</p>
              <p class="detail">Opened At <strong>${escapeHtml(printDateTime(shift.openingTime))}</strong></p>
              <p class="detail">Closed At <strong>${escapeHtml(printDateTime(closedAt))}</strong></p>
            </div>
            <div>
              <p class="caption">Reconciliation Status</p>
              <p class="detail">Status <strong>CLOSED</strong></p>
              <p class="detail">Difference <strong class="${differenceClass}">${escapeHtml(printCurrency(difference))}</strong></p>
            </div>
          </section>

          <table>
            <thead><tr><th>Payment Collection</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Opening Cash</td><td>${escapeHtml(printCurrency(shift.openingCash))}</td></tr>
              <tr><td>Cash Sales</td><td>${escapeHtml(printCurrency(shift.totalSalesCash || 0))}</td></tr>
              <tr><td>Card Sales</td><td>${escapeHtml(printCurrency(shift.totalSalesCard || 0))}</td></tr>
              <tr><td>UPI Sales</td><td>${escapeHtml(printCurrency(shift.totalSalesUpi || 0))}</td></tr>
              <tr class="total-row"><td>Total Sales</td><td>${escapeHtml(printCurrency(shift.totalSales || 0))}</td></tr>
            </tbody>
          </table>

          <section class="summary">
            <div class="sum-row"><span>Actual Cash</span><strong>${escapeHtml(printCurrency(shift.actualCash || 0))}</strong></div>
            <div class="sum-row"><span>Difference</span><strong class="${differenceClass}">${escapeHtml(printCurrency(difference))}</strong></div>
            <div class="sum-row grand"><span>Expected Cash</span><span>${escapeHtml(printCurrency(shift.expectedCash || 0))}</span></div>
          </section>

          ${shift.notes ? `<section class="notes"><strong>Notes:</strong> ${escapeHtml(shift.notes)}</section>` : ""}

          <footer class="footer">
            <p class="footer-copy">This shift summary records cash drawer reconciliation and collected sales by payment mode for the completed cashier session.</p>
            <div class="cashier">
              <div class="cashier-label">Cashier</div>
              <div class="cashier-name">${escapeHtml(printedCashierName)}</div>
            </div>
          </footer>
        </main>
        <script>window.onload = function () { window.print(); window.close(); };</script>
      </body>
    </html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
