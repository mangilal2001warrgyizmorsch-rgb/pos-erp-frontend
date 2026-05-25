import type { BusinessProfile } from "@/types";
import { printDateTime } from "../printUtils";
import { PrintAuthorizedSignature, PrintBusinessIdentity } from "./PrintBranding";

export type ReportCell = string | number;
export interface ReportColumn { key: string; label: string; }

export function ReportPrintTemplate({ business, title, subtitle, columns, rows, totals }: { business: BusinessProfile; title: string; subtitle?: string; columns: ReportColumn[]; rows: Record<string, ReportCell>[]; totals?: Record<string, ReportCell>; }) {
  return <article className="print-area print-report print-a4 bg-white p-6 text-slate-900" style={{ backgroundColor: "#ffffff", color: "#0f172a", colorScheme: "light" }}>
    <header className="mb-5 flex justify-between border-b-2 border-indigo-600 pb-4"><div><PrintBusinessIdentity business={business} /><p className="mt-2 text-xs font-semibold text-slate-600">{title}</p>{subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}</div><p className="text-[10px] text-slate-500">Generated: {printDateTime(new Date())}</p></header>
    <table className="w-full border-collapse text-[10px]"><thead><tr className="bg-indigo-600 text-white">{columns.map((column) => <th key={column.key} className="border border-indigo-500 p-2 text-left">{column.label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="even:bg-slate-50">{columns.map((column) => <td key={column.key} className="border border-slate-200 p-2">{row[column.key] ?? ""}</td>)}</tr>)}{totals && <tr className="font-bold bg-slate-100">{columns.map((column) => <td key={column.key} className="border border-slate-300 p-2">{totals[column.key] ?? ""}</td>)}</tr>}</tbody></table>
    <footer className="avoid-break mt-10 flex justify-end pt-4 text-xs"><PrintAuthorizedSignature business={business} /></footer>
  </article>;
}
