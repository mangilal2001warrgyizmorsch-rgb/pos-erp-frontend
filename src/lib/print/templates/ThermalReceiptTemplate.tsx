/* eslint-disable @next/next/no-img-element -- Stored business logos must render inside isolated print frames. */
import type { BusinessProfile, Sale } from "@/types";
import { asNumber, printCurrency, printDateTime, printGSTIN, printQty, showValue, type ThermalWidth } from "../printUtils";

interface Props { sale: Sale; business: BusinessProfile; width: ThermalWidth; }

export function ThermalReceiptTemplate({ sale, business, width }: Props) {
  const padding = width === 58 ? "2.5mm" : "4mm";
  const balance = Math.max(0, asNumber(sale.totalAmount) - asNumber(sale.amountPaid));
  const change = Math.max(asNumber(sale.changeAmount), asNumber(sale.amountPaid) - asNumber(sale.totalAmount), 0);
  return (
    <section className={`print-area print-thermal print-thermal-${width} bg-white text-black font-mono`} style={{ width: `${width}mm`, padding, fontSize: width === 58 ? "9.5px" : "11px", lineHeight: 1.35, backgroundColor: "#ffffff", color: "#000000", colorScheme: "light" }}>
      <header className="text-center break-words">
        {business.logo && <img src={business.logo} alt="" className="mx-auto mb-2 max-h-10 object-contain" />}
        <h1 className="print-thermal-business-name font-bold uppercase" style={{ color: "#000000", fontSize: width === 58 ? "13px" : "15px" }}>{showValue(business.businessName)}</h1>
        {business.address && <p>{business.address}</p>}
        {business.phone && <p>Ph: {business.phone}</p>}
        {business.gstin && <p>GSTIN: {printGSTIN(business.gstin)}</p>}
      </header>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="space-y-0.5">
        <div className="flex justify-between gap-2"><span>Invoice</span><strong className="text-right break-all">{sale.invoiceNumber}</strong></div>
        <div className="flex justify-between gap-2"><span>Date</span><span className="text-right">{printDateTime(sale.createdAt)}</span></div>
        <div className="flex justify-between gap-2"><span>Customer</span><span className="max-w-[62%] text-right break-words">{sale.customerName || "Walk-in Customer"}</span></div>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <table className="w-full table-fixed">
        <thead><tr className="border-b border-dashed border-black"><th className="pb-1 text-left">Item</th><th className="w-[30%] pb-1 text-right">Amount</th></tr></thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={`${item.sku}-${index}`} className="align-top">
              <td className="py-1 pr-1 break-words">
                <div>{item.name}</div>
                <div className="opacity-75">{printQty(item.quantity)} x {printCurrency(item.unitPrice)}</div>
              </td>
              <td className="py-1 text-right whitespace-nowrap">{printCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span>{printCurrency(sale.subtotal)}</span></div>
        {asNumber(sale.discountAmount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{printCurrency(sale.discountAmount)}</span></div>}
        {asNumber(sale.taxAmount) > 0 && <div className="flex justify-between"><span>Tax</span><span>{printCurrency(sale.taxAmount)}</span></div>}
        <div className="mt-1 flex justify-between border-y border-black py-1 font-bold" style={{ fontSize: width === 58 ? "11px" : "13px" }}><span>TOTAL</span><span>{printCurrency(sale.totalAmount)}</span></div>
        <div className="flex justify-between pt-1"><span>Payment Mode</span><span className="uppercase">{sale.paymentMethod}</span></div>
        <div className="flex justify-between"><span>Received</span><span>{printCurrency(sale.amountPaid)}</span></div>
        {balance > 0 && <div className="flex justify-between font-bold"><span>Balance Due</span><span>{printCurrency(balance)}</span></div>}
        {change > 0 && <div className="flex justify-between font-bold"><span>Change</span><span>{printCurrency(change)}</span></div>}
      </div>
      <footer className="mt-4 border-t border-dashed border-black pt-3 text-center">
        <p className="font-bold">THANK YOU, VISIT AGAIN</p>
        {sale.notes && <p className="mt-1 break-words">{sale.notes}</p>}
      </footer>
    </section>
  );
}
