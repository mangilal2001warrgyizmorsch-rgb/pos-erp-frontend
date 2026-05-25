/* eslint-disable @next/next/no-img-element -- Stored business signatures/logos must render inside isolated print frames. */
import type { BusinessProfile, Customer, Sale } from "@/types";
import { asNumber, printCurrency, printDate, printGSTIN, printQty, showValue } from "../printUtils";
import { PrintAuthorizedSignature } from "./PrintBranding";

export function A4InvoiceTemplate({ sale, business }: { sale: Sale; business: BusinessProfile }) {
  const customer = typeof sale.customer === "object" ? sale.customer as Customer : undefined;
  const due = Math.max(0, asNumber(sale.totalAmount) - asNumber(sale.amountPaid));
  return (
    <article className="print-area print-a4 bg-white p-8 text-slate-900" style={{ width: "186mm", minHeight: "270mm", backgroundColor: "#ffffff", color: "#0f172a", colorScheme: "light" }}>
      <header className="flex justify-between border-b-2 border-indigo-600 pb-5">
        <div className="flex gap-4">
          {business.logo && <img src={business.logo} alt="" className="h-16 w-16 object-contain" />}
          <div><h1 className="print-business-name text-2xl font-bold uppercase" style={{ color: "#3730a3" }}>{showValue(business.businessName)}</h1><p className="max-w-[85mm] text-xs text-slate-500">{business.address}</p><p className="text-xs text-slate-500">{business.phone} {business.gstin && ` | GSTIN: ${printGSTIN(business.gstin)}`}</p></div>
        </div>
        <div className="text-right"><div className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white">TAX INVOICE</div><p className="mt-3 text-sm font-bold">#{sale.invoiceNumber}</p><p className="text-xs text-slate-500">{printDate(sale.createdAt)}</p></div>
      </header>
      <section className="my-6 grid grid-cols-2 gap-6 rounded-lg bg-slate-50 p-4 text-sm">
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill To</p><p className="mt-1 font-bold">{sale.customerName || "Walk-in Customer"}</p>{customer?.phone && <p>{customer.phone}</p>}{customer?.address && <p>{customer.address}</p>}{customer?.gstNumber && <p>GSTIN: {printGSTIN(customer.gstNumber)}</p>}</div>
        <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Details</p><p>Payment Mode: <strong className="uppercase">{sale.paymentMethod}</strong></p><p>Status: <strong className="uppercase">{sale.paymentStatus}</strong></p><p>Amount Paid: <strong>{printCurrency(sale.amountPaid)}</strong></p>{due > 0 && <p>Balance Due: <strong>{printCurrency(due)}</strong></p>}</div>
      </section>
      <table className="w-full border-collapse text-xs">
        <thead><tr className="bg-indigo-600 text-white"><th className="p-2 text-left">#</th><th className="p-2 text-left">Item / SKU</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Tax</th><th className="p-2 text-right">Amount</th></tr></thead>
        <tbody>{sale.items.map((item, i) => <tr key={`${item.sku}-${i}`} className="border-b border-slate-200"><td className="p-2">{i + 1}</td><td className="p-2"><p className="font-semibold">{item.name}</p><p className="text-slate-500">{item.sku || "-"}</p></td><td className="p-2 text-right">{printQty(item.quantity)}</td><td className="p-2 text-right">{printCurrency(item.unitPrice)}</td><td className="p-2 text-right">{item.taxRate || 0}%</td><td className="p-2 text-right font-semibold">{printCurrency(item.total)}</td></tr>)}</tbody>
      </table>
      <section className="avoid-break mt-6 ml-auto w-[76mm] space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{printCurrency(sale.subtotal)}</span></div>{asNumber(sale.discountAmount) > 0 && <div className="flex justify-between text-rose-600"><span>Discount</span><span>-{printCurrency(sale.discountAmount)}</span></div>}<div className="flex justify-between"><span>Tax</span><span>{printCurrency(sale.taxAmount)}</span></div><div className="flex justify-between rounded bg-indigo-600 p-3 text-base font-bold text-white"><span>Grand Total</span><span>{printCurrency(sale.totalAmount)}</span></div></section>
      <footer className="avoid-break mt-12 flex justify-between border-t pt-5 text-xs"><div className="max-w-[90mm]"><p className="font-bold uppercase">Terms & Conditions</p><p className="mt-2 text-slate-500">{sale.notes || "Goods sold are subject to applicable terms and taxes. Thank you for your business."}</p></div><PrintAuthorizedSignature business={business} /></footer>
    </article>
  );
}
