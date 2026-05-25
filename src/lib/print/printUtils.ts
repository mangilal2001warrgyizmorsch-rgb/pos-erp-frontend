import type { BusinessProfile } from "@/types";

export type ThermalWidth = 58 | 80;

export const DEFAULT_PRINT_BUSINESS: BusinessProfile = {
  businessName: "POS ERP",
  tagline: "Modern Point of Sale",
  address: "",
  phone: "",
  email: "",
  gstin: "",
};

export function asNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export function printCurrency(value: unknown): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber(value));
}

export function pdfCurrency(value: unknown): string {
  return `INR ${asNumber(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function printDate(value?: string | Date): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

export function printDateTime(value?: string | Date): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function printQty(value: unknown): string {
  return asNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

export function showValue(value?: string | null): string {
  return value?.trim() || "-";
}

export function printGSTIN(value?: string | null): string {
  return value?.trim().toUpperCase() || "-";
}

export function partyName<T extends { name?: string }>(party: string | T | undefined, fallback?: string): string {
  return typeof party === "object" && party?.name ? party.name : fallback || "Walk-in Customer";
}
