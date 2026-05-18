"use client";

import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { 
  Printer, X, FileText, Check, Settings, 
  Layout, Smartphone, Monitor, ChevronRight 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { Sale, BusinessProfile } from "@/types";
import { businessService } from "@/services/businessService";

// ---------- Default Business Details ----------
const DEFAULT_BUSINESS = {
  businessName: "POS ERP System",
  tagline: "Quality & Value",
  address: "Akola, Chittorgarh, Rajasthan",
  phone: "+91-XXXXXXXXXX",
  email: "support@poserp.com",
  gstin: "08ABCDE1234F1Z1",
  logoText: "PE",
};

interface PrintSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function PrintSaleDialog({ open, onOpenChange, sale }: PrintSaleDialogProps) {
  const [printType, setPrintType] = useState<"regular" | "thermal">("thermal");
  const [pageSize, setPageSize] = useState("3inch");
  const [themeId, setThemeId] = useState(1);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await businessService.getProfile();
      setProfile(data);
    } catch {
      console.error("Failed to load business profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 border-b flex flex-row items-center justify-between pr-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Print Invoice</DialogTitle>
              <p className="text-xs text-muted-foreground">Invoice #{sale.invoiceNumber}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-80 border-r bg-muted/10 p-6 space-y-8 overflow-y-auto">
            <Tabs value={printType} onValueChange={(v) => setPrintType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="regular" className="text-xs">Regular</TabsTrigger>
                <TabsTrigger value="thermal" className="text-xs">Thermal</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Layout Selection</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      onClick={() => setThemeId(i)}
                      className={`aspect-[3/4] rounded-lg border-2 flex flex-col gap-1 p-2 cursor-pointer transition-all ${themeId === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className={`h-1 w-full rounded ${themeId === i ? 'bg-primary/40' : 'bg-muted-foreground/20'}`} />
                      <div className="h-4 w-full bg-muted-foreground/10 rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-1 w-3/4 bg-muted-foreground/10 rounded" />
                        <div className="h-1 w-full bg-muted-foreground/10 rounded" />
                      </div>
                      <p className="text-[10px] text-center font-bold">
                        {i === 1 ? 'Classic' : i === 2 ? 'Modern' : 'GST Pro'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Print Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox id="default-printer" />
                    <Label htmlFor="default-printer" className="text-xs cursor-pointer">Make this printer default</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="auto-cut" defaultChecked />
                    <Label htmlFor="auto-cut" className="text-xs cursor-pointer">Auto cut after printing</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="cash-drawer" />
                    <Label htmlFor="cash-drawer" className="text-xs cursor-pointer">Open cash drawer</Label>
                  </div>
                </div>
              </div>

              {printType === "thermal" && (
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Page Size</Label>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2inch">2 Inch (58mm)</SelectItem>
                      <SelectItem value="3inch">3 Inch (80mm)</SelectItem>
                      <SelectItem value="4inch">4 Inch (100mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-muted/30 p-8 overflow-y-auto flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-[0.3em]">Syncing Branding...</p>
              </div>
            ) : (
              <div 
                ref={componentRef}
                className={`bg-white text-black shadow-2xl origin-top transition-all duration-300 ${
                  printType === "thermal" 
                    ? (pageSize === "2inch" ? "w-[220px]" : pageSize === "3inch" ? "w-[300px]" : "w-[380px]")
                    : "w-[794px]"
                }`}
              >
                {printType === "thermal" ? (
                  <ThermalInvoiceLayout sale={sale} themeId={themeId} business={profile || (DEFAULT_BUSINESS as any)} />
                ) : (
                  <RegularInvoiceLayout sale={sale} themeId={themeId} business={profile || (DEFAULT_BUSINESS as any)} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-background flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => handlePrint()} className="gap-2 px-8">
            <Printer className="h-4 w-4" />
            Print Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThermalInvoiceLayout({ sale, themeId, business }: { sale: Sale; themeId: number; business: BusinessProfile }) {
  if (themeId === 2) return <ThermalThemeModern sale={sale} business={business} />;
  if (themeId === 3) return <ThermalThemeGST sale={sale} business={business} />;

  return (
    <div className="p-4 font-mono text-[11px] leading-tight bg-white text-black w-[80mm]">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        <div className="flex justify-center mb-2">
          {business.logo ? (
            <img src={business.logo} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xl">
              {business.businessName?.charAt(0) || "B"}
            </div>
          )}
        </div>
        <h1 className="text-sm font-black uppercase tracking-tighter">{business.businessName}</h1>
        <p className="text-[9px]">{business.address}</p>
        <p>Phone: {business.phone}</p>
        <p className="text-[9px] break-all">{business.email}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />
      
      {/* Info */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span className="font-bold">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="font-bold">{sale.customerName}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-gray-300">
          {sale.items?.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">
                <div className="font-bold">{item.name}</div>
                <div className="text-[9px]">{formatCurrency(item.unitPrice)}</div>
              </td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black my-2" />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({sale.taxRate}%):</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
        )}
        {sale.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black pt-1">
          <span>GRAND TOTAL:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
        <div className="border-t border-dotted border-black my-1" />
        <div className="flex justify-between">
          <span>Received:</span>
          <span>{formatCurrency(sale.amountPaid)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Balance:</span>
          <span>{formatCurrency(sale.totalAmount - sale.amountPaid)}</span>
        </div>
      </div>

      <div className="text-center mt-6 space-y-1">
        <p className="font-bold">THANK YOU!</p>
        <p className="text-[9px]">Visit Again</p>
      </div>
    </div>
  );
}

function RegularInvoiceLayout({ sale, themeId, business }: { sale: Sale; themeId: number; business: BusinessProfile }) {
  if (themeId === 2) return <RegularThemeModern sale={sale} business={business} />;
  if (themeId === 3) return <RegularThemeGST sale={sale} business={business} />;

  return (
    <div className="p-12 min-h-[1050px] w-[210mm] bg-white text-black font-sans">
      <div className="flex justify-between items-start border-b-2 border-black pb-8">
        <div className="flex gap-6">
          <div className="h-24 w-24 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center text-black font-black text-4xl overflow-hidden p-2 shadow-sm">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              business.businessName?.charAt(0) || "B"
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{business.businessName}</h1>
            <p className="text-sm font-bold text-gray-600 italic mt-1">{business.tagline}</p>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-2 font-medium">{business.address}</p>
              {business.gstin && <p className="font-bold text-black">GSTIN: {business.gstin}</p>}
              <p>Phone: {business.phone} | Email: {business.email}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest inline-block mb-4">
            Tax Invoice
          </div>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4"><span className="text-gray-500">Invoice No:</span> <span className="font-bold">#{sale.invoiceNumber}</span></p>
            <p className="flex justify-between gap-4"><span className="text-gray-500">Date:</span> <span className="font-bold">{new Date(sale.createdAt).toLocaleDateString()}</span></p>
            <p className="flex justify-between gap-4"><span className="text-gray-500">Time:</span> <span className="font-bold">{new Date(sale.createdAt).toLocaleTimeString()}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 py-8">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Billed To</h3>
          <div className="text-sm">
            <p className="text-lg font-black">{sale.customerName}</p>
            <p className="text-gray-500 mt-1">Cash/Retail Customer</p>
            <p className="text-gray-500">Akola, Rajasthan</p>
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ship To</h3>
          <div className="text-sm">
            <p className="text-lg font-black">{sale.customerName}</p>
            <p className="text-gray-500 mt-1">Direct Delivery</p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-y-2 border-black">
            <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-wider">#</th>
            <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-wider">Item Name</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-wider">Quantity</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-wider">Price/Unit</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-wider">Tax (%)</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y border-b-2 border-black">
          {sale.items?.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="py-6 px-4 text-sm font-bold text-gray-400">{i + 1}</td>
              <td className="py-6 px-4">
                <p className="font-black text-sm uppercase">{item.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">SKU: {item.sku}</p>
              </td>
              <td className="py-6 px-4 text-right font-black text-sm">{item.quantity}</td>
              <td className="py-6 px-4 text-right font-black text-sm">{formatCurrency(item.unitPrice)}</td>
              <td className="py-6 px-4 text-right font-bold text-sm text-gray-500">{item.taxRate || 0}%</td>
              <td className="py-6 px-4 text-right font-black text-sm">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-12 gap-24">
        <div className="flex-1">
          <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Invoice Notes</h4>
            <p className="text-xs leading-relaxed text-gray-600">
              {sale.notes || "Thanks for your business! Please come again. Goods once sold will not be taken back."}
            </p>
          </div>
          <div className="mt-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Payment Info</h4>
            <div className="space-y-2 text-xs">
              <p><span className="font-bold">Method:</span> <span className="uppercase">{sale.paymentMethod}</span></p>
              <p><span className="font-bold">Status:</span> <span className="uppercase text-emerald-600">{sale.paymentStatus}</span></p>
            </div>
          </div>
        </div>
        <div className="w-80 space-y-4">
          <div className="space-y-2 pb-6 border-b border-gray-100">
            <p className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Subtotal</span> <span className="font-black">{formatCurrency(sale.subtotal)}</span></p>
            <p className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Tax Total</span> <span className="font-black">{formatCurrency(sale.taxAmount)}</span></p>
            {sale.discountAmount > 0 && <p className="flex justify-between text-sm text-red-600"><span className="font-medium">Discount</span> <span className="font-black">-{formatCurrency(sale.discountAmount)}</span></p>}
          </div>
          <div className="flex justify-between items-center bg-black text-white p-4 rounded-xl">
            <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Amount</span>
            <span className="text-xl font-black">{formatCurrency(sale.totalAmount)}</span>
          </div>
          
          <div className="pt-12 text-center space-y-4">
            <div className="h-20 w-48 mx-auto border-b border-gray-200 relative flex items-center justify-center">
              {business.signature ? (
                <img src={business.signature} alt="Signature" className="h-full w-auto object-contain" />
              ) : (
                <span className="text-[10px] text-gray-300 font-medium italic">Signature Placeholder</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter">Authorized Signatory</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase italic">For {business.businessName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ADDITIONAL THEMES
// ==========================================

function ThermalThemeModern({ sale, business }: { sale: Sale; business: BusinessProfile }) {
  return (
    <div className="p-4 font-sans text-[10px] bg-white text-black w-[80mm] leading-tight">
      <div className="bg-slate-900 text-white p-6 rounded-2xl text-center mb-6 shadow-sm">
        {business.logo ? (
          <img src={business.logo} alt="Logo" className="h-12 mx-auto brightness-0 invert mb-3 object-contain" />
        ) : (
          <div className="h-10 w-10 bg-white/10 rounded-full mx-auto flex items-center justify-center mb-2 font-black text-lg">
            {business.businessName?.charAt(0)}
          </div>
        )}
        <h1 className="text-xs font-black uppercase tracking-[0.2em]">{business.businessName}</h1>
        <p className="text-[7px] opacity-60 mt-1 uppercase tracking-widest">{business.tagline}</p>
      </div>

      <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-3 mb-4 text-slate-500 font-bold px-1">
        <span className="tracking-tighter">#{sale.invoiceNumber}</span>
        <span className="text-[9px]">{new Date(sale.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="space-y-4 mb-6 px-1">
        {sale.items?.map((item, i) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="font-black uppercase text-[9px] leading-none">{item.name}</p>
              <p className="text-[7px] text-slate-400 mt-1">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
            </div>
            <p className="font-black text-slate-900">{formatCurrency(item.total)}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6 border border-slate-100">
        <div className="flex justify-between text-slate-500 font-bold">
          <span className="text-[8px] uppercase">Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500 font-bold">
          <span className="text-[8px] uppercase">Tax:</span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-xs font-black text-indigo-600 pt-1 border-t border-slate-200/50">
          <span className="uppercase">Net Total:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      <div className="text-center space-y-4 pt-4 border-t border-dashed border-slate-200">
        <div className="h-12 w-32 mx-auto border-b border-slate-300 flex items-center justify-center opacity-50">
          {business.signature ? (
            <img src={business.signature} alt="Sign" className="h-full w-auto object-contain grayscale" />
          ) : (
            <span className="text-[8px] italic font-bold text-slate-300">Authorized Sign</span>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-black text-[9px] uppercase tracking-tighter">Authorized Signatory</p>
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest italic">Visit Again | {business.businessName}</p>
        </div>
      </div>
    </div>
  );
}

function ThermalThemeGST({ sale, business }: { sale: Sale; business: BusinessProfile }) {
  return (
    <div className="p-4 font-mono text-[9px] bg-white text-black border-[3px] border-black m-2 w-[80mm] leading-tight">
      <div className="text-center border-b-[3px] border-black pb-3 mb-4 bg-black text-white p-2">
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em]">GST Invoice</h1>
      </div>
      
      <div className="text-center space-y-1 mb-4">
        <p className="font-black text-[10px] uppercase tracking-tighter">{business.businessName}</p>
        <p className="text-[7px] uppercase leading-relaxed px-4">{business.address}</p>
        {business.gstin && (
          <div className="mt-2 inline-block border border-black px-3 py-0.5 font-black text-[8px]">
            GSTIN: {business.gstin}
          </div>
        )}
      </div>

      <div className="border-y-2 border-black my-4 py-2 flex justify-between font-black text-[8px] uppercase tracking-tighter">
        <span>Inv: #{sale.invoiceNumber}</span>
        <span>Date: {new Date(sale.createdAt).toLocaleDateString()}</span>
      </div>

      <table className="w-full mb-4">
        <thead className="border-b-2 border-black">
          <tr className="text-[7px] font-black uppercase">
            <th className="text-left pb-1">Particulars</th>
            <th className="text-center pb-1">Tax</th>
            <th className="text-right pb-1">Amount</th>
          </tr>
        </thead>
        <tbody className="font-bold">
          {sale.items?.map((item, i) => (
            <tr key={i} className="border-b border-black/10">
              <td className="py-2 pr-2">
                <p className="uppercase text-[8px] leading-none">{item.name}</p>
                <p className="text-[6px] opacity-60 mt-1">{item.quantity} Nos x {formatCurrency(item.unitPrice)}</p>
              </td>
              <td className="text-center text-[7px]">{item.taxRate}%</td>
              <td className="text-right text-[8px] font-black">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-[3px] border-black pt-2 space-y-1">
        <div className="flex justify-between text-[8px] font-bold">
          <span>TAXABLE VALUE:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[8px] font-bold">
          <span>TOTAL TAX:</span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-[11px] font-black border-t-2 border-black pt-1 mt-1">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-8 text-center border-t border-black pt-4 space-y-4">
        <div className="h-10 w-32 mx-auto border-b border-black flex items-center justify-center grayscale opacity-40">
           {business.signature ? (
            <img src={business.signature} alt="Sign" className="h-full w-auto object-contain" />
          ) : (
            <span className="text-[7px] italic font-black uppercase">Authorized</span>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-black text-[8px] uppercase tracking-widest">Authorized Signatory</p>
          <p className="text-[7px] font-bold opacity-40 uppercase italic">*** Visit Again ***</p>
        </div>
      </div>
    </div>
  );
}

function RegularThemeModern({ sale, business }: { sale: Sale; business: BusinessProfile }) {
  return (
    <div className="p-12 w-[210mm] bg-white text-slate-800 font-sans min-h-[1050px] shadow-sm">
      <div className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-8">
          <div className="h-24 w-24 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black overflow-hidden shadow-2xl shadow-indigo-200 p-4 border-4 border-white">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="h-full w-full object-contain brightness-0 invert" />
            ) : (
              business.businessName?.charAt(0) || "B"
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{business.businessName}</h1>
            <p className="text-sm font-bold text-indigo-500 italic mt-2 tracking-widest uppercase">{business.tagline}</p>
            <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{business.phone}</span>
              <span className="h-1 w-1 rounded-full bg-slate-200"></span>
              <span>{business.email}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] text-right shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Tax Invoice</p>
          <p className="text-3xl font-black tracking-tighter">#{sale.invoiceNumber}</p>
          <p className="text-[10px] font-bold opacity-60 mt-2 uppercase">{new Date(sale.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-16">
        <div className="col-span-2 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Customer Details</h3>
          <p className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">{sale.customerName}</p>
          <div className="flex gap-6 mt-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Client Type: <span className="text-slate-600">Retail Partner</span></p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Place: <span className="text-slate-600">Rajasthan</span></p>
          </div>
        </div>
        <div className="bg-indigo-600 text-white p-10 rounded-[3rem] flex flex-col justify-center shadow-2xl shadow-indigo-100">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Payable</h3>
          <p className="text-5xl font-black tracking-tighter">{formatCurrency(sale.totalAmount)}</p>
          <p className="text-[10px] font-bold mt-4 opacity-60 uppercase tracking-widest italic leading-relaxed">Incl. of all taxes</p>
        </div>
      </div>

      <div className="mb-16">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em]">S.No</th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em]">Item Description</th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em]">Qty</th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em]">Rate</th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em]">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => (
              <tr key={i} className="bg-slate-50/80 rounded-[2rem] group transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
                <td className="py-8 px-6 rounded-l-[2rem] text-sm font-black text-slate-300">{i + 1}</td>
                <td className="py-8 px-6 border-l-4 border-indigo-500">
                  <p className="font-black text-slate-900 uppercase tracking-tight text-lg">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HSN: 8517</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax: {item.taxRate || 0}%</span>
                  </div>
                </td>
                <td className="text-right py-8 px-6 font-black text-slate-600">{item.quantity} Nos</td>
                <td className="text-right py-8 px-6 font-black text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right py-8 px-6 rounded-r-[2rem] font-black text-indigo-600 text-2xl">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-end mt-24 pt-12 border-t-2 border-slate-100 border-dashed">
        <div className="space-y-6">
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 max-w-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Store Address</h4>
            <p className="text-xs font-bold text-slate-600 uppercase italic leading-relaxed">{business.address}</p>
            {business.gstin && <p className="text-[10px] font-black text-indigo-500 mt-4 uppercase tracking-widest">GSTIN: {business.gstin}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Method: {sale.paymentMethod}</div>
            <div className="px-4 py-2 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-500 uppercase tracking-widest">Status: {sale.paymentStatus}</div>
          </div>
        </div>
        
        <div className="text-center space-y-6">
          <div className="h-32 w-80 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center p-6 relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-0 transition-opacity group-hover:opacity-0"></div>
            {business.signature ? (
              <img src={business.signature} alt="Sign" className="h-full w-auto object-contain relative z-10 drop-shadow-md transition-transform group-hover:scale-110" />
            ) : (
              <span className="text-xs italic font-black text-slate-200 relative z-10 tracking-[0.3em] uppercase">Authorized</span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 leading-none">Authorized Signatory</p>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] italic">Proprietor, {business.businessName}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-24 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">This is a computer generated invoice and requires no physical signature</p>
      </div>
    </div>
  );
}

function RegularThemeGST({ sale, business }: { sale: Sale; business: BusinessProfile }) {
  return (
    <div className="p-10 w-[210mm] min-h-[1050px] bg-white text-black border-[6px] border-black m-2 font-sans relative overflow-hidden">
      {/* Dynamic Watermark / Background Element */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-slate-50 rounded-full z-0 opacity-50"></div>

      <div className="relative z-10">
        <div className="text-center border-b-[6px] border-black pb-10 mb-12 relative">
          <div className="absolute top-0 left-0 bg-black text-white p-4 rounded-2xl shadow-xl">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="h-16 w-auto object-contain brightness-0 invert" />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center font-black text-3xl">
                {business.businessName?.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-2 italic drop-shadow-sm text-slate-900">{business.businessName}</h1>
          <p className="text-sm font-black italic tracking-[0.4em] text-slate-400 mb-4 uppercase">{business.tagline}</p>
          <div className="flex flex-col items-center gap-1">
            <p className="font-black text-xs uppercase max-w-2xl mx-auto leading-relaxed text-slate-500">{business.address}</p>
            <div className="flex gap-4 mt-2">
              <p className="text-xs font-black bg-slate-900 text-white px-6 py-1.5 rounded-full shadow-lg">GSTIN: {business.gstin}</p>
              <p className="text-xs font-black bg-indigo-600 text-white px-6 py-1.5 rounded-full shadow-lg italic">PH: {business.phone}</p>
            </div>
          </div>
          <div className="mt-10 bg-black text-white inline-block px-16 py-3 font-black uppercase text-xl tracking-[0.4em] shadow-[10px_10px_0px_0px_rgba(79,70,229,1)] transform -skew-x-12">Tax Invoice</div>
        </div>

        <div className="grid grid-cols-2 border-[6px] border-black mb-12 divide-x-[6px] divide-black shadow-[15px_15px_0px_0px_rgba(241,245,249,1)]">
          <div className="p-8 space-y-4 bg-slate-50/30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-2">Consignee (Billed To):</p>
            <p className="text-3xl font-black uppercase tracking-tighter text-indigo-600 leading-tight">{sale.customerName}</p>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-500 uppercase italic">Registered Business Entity</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">State: Rajasthan (08)</p>
            </div>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-2">Invoice Information:</p>
            <div className="space-y-3">
              <p className="text-sm flex justify-between items-center"><span className="text-slate-400 font-black uppercase text-[10px]">Invoice No:</span> <span className="font-black text-2xl tracking-tighter">#{sale.invoiceNumber}</span></p>
              <p className="text-sm flex justify-between items-center"><span className="text-slate-400 font-black uppercase text-[10px]">Billing Date:</span> <span className="font-black text-slate-900">{new Date(sale.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</span></p>
              <p className="text-sm flex justify-between items-center"><span className="text-slate-400 font-black uppercase text-[10px]">Payment Mode:</span> <span className="font-black uppercase bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-xs border border-indigo-100 shadow-sm">{sale.paymentMethod}</span></p>
            </div>
          </div>
        </div>

        <table className="w-full border-[6px] border-black border-collapse mb-12 shadow-[15px_15px_0px_0px_rgba(241,245,249,1)]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="border-r-[6px] border-white p-4 text-[10px] font-black uppercase tracking-widest text-center w-16">#</th>
              <th className="border-r-[6px] border-white p-4 text-[10px] font-black uppercase tracking-widest text-left">Description of Goods</th>
              <th className="border-r-[6px] border-white p-4 text-[10px] font-black uppercase tracking-widest text-center w-32">HSN/SAC</th>
              <th className="border-r-[6px] border-white p-4 text-[10px] font-black uppercase tracking-widest text-center w-24">Qty</th>
              <th className="border-r-[6px] border-white p-4 text-[10px] font-black uppercase tracking-widest text-right w-40">Unit Price</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right w-48">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y-[4px] divide-black font-black uppercase italic tracking-tighter">
            {sale.items?.map((item, i) => (
              <tr key={i} className="min-h-[80px] bg-white">
                <td className="border-r-[6px] border-black p-5 text-center text-slate-300 font-black">{i + 1}</td>
                <td className="border-r-[6px] border-black p-5 text-sm leading-tight">
                  <p className="text-slate-900 font-black text-lg">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold not-italic tracking-widest opacity-60">SKU: {item.sku}</p>
                </td>
                <td className="border-r-[6px] border-black p-5 text-center text-xs text-slate-500 font-bold not-italic">8517</td>
                <td className="border-r-[6px] border-black p-5 text-center text-slate-900 text-lg">{item.quantity} <span className="text-[10px] font-black text-slate-300">NOS</span></td>
                <td className="border-r-[6px] border-black p-5 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="p-5 text-right text-slate-900 text-xl">{formatCurrency(item.total)}</td>
              </tr>
            ))}
            <tr className="h-[250px] border-none"><td colSpan={6} className="bg-slate-50/10"></td></tr>
          </tbody>
          <tfoot>
            <tr className="border-t-[6px] border-black bg-slate-900 text-white font-black">
              <td colSpan={5} className="border-r-[6px] border-white p-6 text-right uppercase tracking-[0.4em] text-xs opacity-60">Grand Total Payable (Net)</td>
              <td className="p-6 text-right text-3xl italic tracking-tighter">{formatCurrency(sale.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-16 flex justify-between items-end gap-24">
          <div className="text-[11px] font-bold leading-relaxed max-w-sm border-l-[10px] border-indigo-600 pl-8 bg-slate-50 p-6 rounded-r-3xl shadow-sm">
            <p className="font-black mb-2 uppercase tracking-[0.2em] text-indigo-600 italic">Official Declaration:</p>
            We certify that this invoice represents the true value of the goods described. All transactions are subject to legal jurisdiction of our local courts.
            <div className="mt-4 flex gap-2">
              <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
              <span className="w-4 h-1 bg-slate-200 rounded-full"></span>
            </div>
          </div>
          <div className="text-center space-y-6">
            <div className="h-32 w-80 border-[6px] border-black flex items-center justify-center p-6 shadow-[10px_10px_0px_0px_rgba(79,70,229,1)] bg-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {business.signature ? (
                <img src={business.signature} alt="Sign" className="h-full w-auto object-contain relative z-10 transition-transform group-hover:scale-110" />
              ) : (
                <span className="text-xs italic font-black text-slate-200 tracking-[0.3em] uppercase">Authorized</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase italic tracking-tighter text-slate-900 leading-none">Authorized Official Seal & Sign</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">For {business.businessName}</p>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          <span>© POS ERP ENTERPRISE SOLUTIONS</span>
          <span>COMPUTER GENERATED DOCUMENT</span>
          <span>PAGE 01 OF 01</span>
        </div>
      </div>
    </div>
  );
}
