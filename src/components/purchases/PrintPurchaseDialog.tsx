"use client";

import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X, Layout, ChevronRight } from "lucide-react";
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
import type { Purchase, BusinessProfile } from "@/types";
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

interface PrintPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
}

export function PrintPurchaseDialog({ open, onOpenChange, purchase }: PrintPurchaseDialogProps) {
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

  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 border-b flex flex-row items-center justify-between pr-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Print Purchase Bill</DialogTitle>
              <p className="text-xs text-muted-foreground">Bill #{purchase.purchaseNumber}</p>
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
                        {i === 1 ? 'Classic' : i === 2 ? 'Modern' : 'Detailed'}
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
                    <Label htmlFor="default-printer" className="text-xs cursor-pointer">Make default</Label>
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
                  <ThermalPurchaseLayout purchase={purchase} themeId={themeId} business={profile || (DEFAULT_BUSINESS as any)} />
                ) : (
                  <RegularPurchaseLayout purchase={purchase} themeId={themeId} business={profile || (DEFAULT_BUSINESS as any)} />
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

function ThermalPurchaseLayout({ purchase, themeId, business }: { purchase: Purchase; themeId: number; business: BusinessProfile }) {
  if (themeId === 2) return <ThermalPurchaseModern purchase={purchase} business={business} />;
  if (themeId === 3) return <ThermalPurchaseDetailed purchase={purchase} business={business} />;

  return (
    <div className="p-4 font-mono text-[11px] leading-tight bg-white text-black w-full">
      <div className="text-center space-y-1 mb-4">
        <div className="flex justify-center mb-2">
          {business.logo ? (
            <img src={business.logo} alt="Logo" className="h-10 mx-auto object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-black flex items-center justify-center font-bold">
              {business.businessName?.charAt(0) || "B"}
            </div>
          )}
        </div>
        <h1 className="text-xs font-black uppercase tracking-tighter">Purchase Voucher</h1>
        <div className="border-y border-black py-1 my-1">
          <p className="font-bold text-sm uppercase">{business.businessName}</p>
        </div>
      </div>
      
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span>Bill No:</span><span className="font-bold">{purchase.purchaseNumber}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span></div>
        <div className="flex justify-between"><span>Supplier:</span><span className="font-bold">{purchase.supplierName}</span></div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items?.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">{item.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black my-2" />

      <div className="space-y-1">
        <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(purchase.subtotal)}</span></div>
        <div className="flex justify-between text-sm font-black pt-1">
          <span>NET AMOUNT:</span>
          <span>{formatCurrency(purchase.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function RegularPurchaseLayout({ purchase, themeId, business }: { purchase: Purchase; themeId: number; business: BusinessProfile }) {
  if (themeId === 2) return <RegularPurchaseModern purchase={purchase} business={business} />;
  if (themeId === 3) return <RegularPurchaseGST purchase={purchase} business={business} />;

  return (
    <div className="p-12 min-h-[1000px] bg-white text-black font-sans w-full">
      <div className="flex justify-between items-center border-b-4 border-black pb-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center text-black font-black text-3xl overflow-hidden p-2 shadow-sm">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              business.businessName?.charAt(0) || "B"
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Purchase Bill</h1>
            <p className="text-sm font-bold text-gray-500 uppercase mt-1">Voucher No: #{purchase.purchaseNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-indigo-600 uppercase">{business.businessName}</h2>
          <p className="text-xs text-gray-500">{business.address}</p>
          {business.gstin && <p className="text-xs font-bold mt-1">GSTIN: {business.gstin}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Supplier Details</h3>
          <p className="text-xl font-black">{purchase.supplierName}</p>
          <p className="text-sm text-gray-500 mt-2">Party Contact: N/A</p>
        </div>
        <div className="p-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Bill Info</h3>
          <div className="space-y-2 text-sm font-bold">
            <p className="flex justify-between"><span>Date:</span> <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span></p>
            <p className="flex justify-between"><span>Payment:</span> <span className="uppercase text-emerald-600">{purchase.paymentStatus}</span></p>
            <p className="flex justify-between"><span>Method:</span> <span className="uppercase">{purchase.paymentMethod}</span></p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-gray-900 text-white border-b-2 border-black">
            <th className="p-4 text-left text-[10px] font-black uppercase">Sr</th>
            <th className="p-4 text-left text-[10px] font-black uppercase">Description</th>
            <th className="p-4 text-right text-[10px] font-black uppercase">Qty</th>
            <th className="p-4 text-right text-[10px] font-black uppercase">Price</th>
            <th className="p-4 text-right text-[10px] font-black uppercase">Tax</th>
            <th className="p-4 text-right text-[10px] font-black uppercase">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-gray-100">
          {purchase.items?.map((item, i) => (
            <tr key={i}>
              <td className="p-4 text-sm font-bold text-gray-400">{i + 1}</td>
              <td className="p-4 font-black text-sm uppercase">{item.name}</td>
              <td className="p-4 text-right font-black text-sm">{item.quantity}</td>
              <td className="p-4 text-right font-black text-sm">{formatCurrency(item.purchasePrice)}</td>
              <td className="p-4 text-right font-bold text-sm text-gray-400">{item.taxRate}%</td>
              <td className="p-4 text-right font-black text-sm">{formatCurrency(item.total)}</td>
            </tr>
          ))}
          <tr className="h-[200px] border-none"><td colSpan={6}></td></tr>
        </tbody>
        <tfoot>
          <tr className="border-t-4 border-black bg-gray-50 font-black">
            <td colSpan={5} className="p-4 text-right uppercase tracking-widest text-xs">Total Amount Payable</td>
            <td className="p-4 text-right text-xl">{formatCurrency(purchase.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 flex justify-between items-end">
        <div className="w-80 p-4 border-2 border-dashed border-gray-200 rounded-xl">
          <h4 className="text-[9px] font-black uppercase text-gray-400 mb-2">Internal Notes</h4>
          <p className="text-xs text-gray-500 italic">{purchase.notes || "No extra notes for this purchase."}</p>
        </div>
        <div className="text-center space-y-4">
          <div className="h-20 w-48 mx-auto border-b-2 border-black relative flex items-center justify-center">
            {business.signature ? (
              <img src={business.signature} alt="Signature" className="h-full w-auto object-contain" />
            ) : (
              <span className="text-[10px] text-gray-300 font-medium italic">Authorized Seal</span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">For {business.businessName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// ==========================================
// ADDITIONAL PURCHASE THEMES
// ==========================================

function ThermalPurchaseModern({ purchase, business }: { purchase: Purchase; business: BusinessProfile }) {
  return (
    <div className="p-4 font-sans text-[10px] bg-slate-50 text-slate-900 w-full">
      <div className="bg-indigo-600 text-white p-4 rounded-2xl text-center mb-4">
        {business.logo ? (
          <img src={business.logo} alt="Logo" className="h-10 mx-auto brightness-0 invert mb-2 object-contain" />
        ) : (
          <h1 className="text-sm font-black uppercase tracking-widest">{business.businessName}</h1>
        )}
        <p className="text-[8px] opacity-70 mt-1">Purchase Voucher</p>
      </div>
      <div className="flex justify-between border-b pb-2 mb-4 font-bold text-slate-500">
        <span>#{purchase.purchaseNumber}</span>
        <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
      </div>
      <div className="space-y-3 mb-6">
        {purchase.items?.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div className="flex-1">
              <p className="font-bold uppercase">{item.name}</p>
              <p className="text-[8px] text-slate-400">{item.quantity} qty</p>
            </div>
            <p className="font-black">{formatCurrency(item.total)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex justify-between text-xs font-black text-indigo-600">
          <span>NET TOTAL:</span>
          <span>{formatCurrency(purchase.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function ThermalPurchaseDetailed({ purchase, business }: { purchase: Purchase; business: BusinessProfile }) {
  return (
    <div className="p-4 font-mono text-[9px] bg-white text-black border-2 border-black m-2 w-full">
      <h1 className="text-center text-xs font-black border-b-2 border-black pb-2 mb-2">PURCHASE BILL</h1>
      <p className="font-black text-center uppercase">{business.businessName}</p>
      <div className="border-y border-black my-2 py-1 flex justify-between">
        <span>#{purchase.purchaseNumber}</span>
        <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
      </div>
      <p className="mb-2 uppercase">Supplier: {purchase.supplierName}</p>
      <table className="w-full mb-2 border-b border-black">
        <thead>
          <tr className="border-b border-black text-[8px]">
            <th className="text-left">Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items?.map((item, i) => (
            <tr key={i}>
              <td className="uppercase">{item.name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-black text-xs">
        TOTAL: {formatCurrency(purchase.totalAmount)}
      </div>
    </div>
  );
}

function RegularPurchaseModern({ purchase, business }: { purchase: Purchase; business: BusinessProfile }) {
  return (
    <div className="p-12 bg-white text-slate-800 font-sans min-h-[1000px] w-full">
      <div className="flex justify-between items-start mb-16">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black overflow-hidden shadow-lg p-2">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="h-full w-full object-contain brightness-0 invert" />
            ) : (
              business.businessName?.charAt(0) || "B"
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{business.businessName}</h1>
            <p className="text-slate-400 font-bold italic">{business.tagline}</p>
            <p className="text-xs text-slate-300 mt-2">Inward Inventory Voucher</p>
          </div>
        </div>
        <div className="text-right space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Voucher Details</p>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xl font-black text-slate-900">#{purchase.purchaseNumber}</p>
            <p className="text-[10px] font-bold text-slate-400">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-24 mb-16">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 border-b-2 border-indigo-50 pb-2 inline-block">Supplier Entity</h3>
          <p className="text-2xl font-black mb-1 uppercase tracking-tighter text-slate-900">{purchase.supplierName}</p>
          <p className="text-sm text-slate-500 font-medium italic">Primary Inventory Partner</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Location Info</h3>
          <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed">{business.address}</p>
        </div>
      </div>

      <table className="w-full mb-12">
        <thead className="bg-slate-50 border-y border-slate-100">
          <tr>
            <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
            <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Cost</th>
            <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-bold">
          {purchase.items?.map((item, i) => (
            <tr key={i}>
              <td className="py-6 px-4">
                <p className="font-black text-slate-700 uppercase tracking-tight">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">SKU: {item.sku}</p>
              </td>
              <td className="py-6 px-4 text-center font-black">{item.quantity}</td>
              <td className="py-6 px-4 text-right font-black">{formatCurrency(item.purchasePrice)}</td>
              <td className="py-6 px-4 text-right font-black text-slate-900 text-lg">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-end pt-12 mt-12 border-t border-slate-100">
        <div className="text-center space-y-4">
          <div className="h-20 w-56 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-3">
            {business.signature ? (
              <img src={business.signature} alt="Sign" className="h-full w-auto object-contain" />
            ) : (
              <span className="text-[10px] italic text-slate-300">Authorized Receiver</span>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Received By</p>
        </div>

        <div className="w-72 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-200">
          <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest"><span>Subtotal</span><span>{formatCurrency(purchase.subtotal)}</span></div>
          <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-6 tracking-widest"><span>Tax Total</span><span>{formatCurrency(purchase.taxAmount)}</span></div>
          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Final Value</span>
            <span className="text-3xl font-black">{formatCurrency(purchase.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegularPurchaseGST({ purchase, business }: { purchase: Purchase; business: BusinessProfile }) {
  return <RegularPurchaseGSTLayout purchase={purchase} business={business} />;
}

function RegularPurchaseGSTLayout({ purchase, business }: { purchase: Purchase; business: BusinessProfile }) {
  return (
    <div className="p-8 bg-white text-black font-serif border-[1px] border-black m-8 min-h-[1000px] w-full">
      <div className="text-center border-b-2 border-black pb-4 mb-6 relative">
        <div className="absolute top-0 left-0">
          {business.logo && <img src={business.logo} alt="Logo" className="h-16 w-auto object-contain" />}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">PURCHASE BILL / INVOICE</h1>
      </div>
      <div className="flex justify-between mb-8">
        <div className="space-y-1">
          <p className="text-sm font-black uppercase">{business.businessName}</p>
          <p className="text-xs font-bold uppercase">{business.address}</p>
          <p className="text-xs font-black">GSTIN: {business.gstin} | PH: {business.phone}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Bill Details</p>
          <p className="text-sm">Voucher No: <span className="font-black text-lg">#{purchase.purchaseNumber}</span></p>
          <p className="text-sm">Date: <span className="font-black">{new Date(purchase.purchaseDate).toLocaleDateString()}</span></p>
        </div>
      </div>
      <div className="border-2 border-black p-4 mb-6 bg-gray-50">
        <p className="text-xs font-black uppercase mb-1 tracking-widest text-gray-400">Supplier / Vendor Details:</p>
        <p className="text-xl font-black uppercase tracking-tighter">{purchase.supplierName}</p>
        <p className="text-xs font-bold text-gray-500 uppercase italic">Registered Business Partner</p>
      </div>
      <table className="w-full border-2 border-black border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-widest bg-gray-100">
            <th className="border-r-2 border-black p-3 w-12 text-center">#</th>
            <th className="border-r-2 border-black p-3 text-left">Description of Goods</th>
            <th className="border-r-2 border-black p-3 w-20 text-center">Qty</th>
            <th className="border-r-2 border-black p-3 w-28 text-right">Unit Price</th>
            <th className="p-3 w-28 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black text-sm font-bold">
          {purchase.items?.map((item, i) => (
            <tr key={i}>
              <td className="border-r-2 border-black p-3 text-center text-gray-400">{i+1}</td>
              <td className="border-r-2 border-black p-3 uppercase tracking-tight">{item.name}</td>
              <td className="border-r-2 border-black p-3 text-center">{item.quantity} Nos</td>
              <td className="border-r-2 border-black p-3 text-right">{formatCurrency(item.purchasePrice)}</td>
              <td className="p-3 text-right font-black">{formatCurrency(item.total)}</td>
            </tr>
          ))}
          <tr className="h-[250px]"><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td className="border-r-2 border-black"></td><td></td></tr>
        </tbody>
        <tfoot className="border-t-2 border-black font-black bg-gray-50">
          <tr>
            <td colSpan={4} className="border-r-2 border-black p-4 text-right uppercase tracking-[0.3em] text-[10px]">Net Invoice Value</td>
            <td className="p-4 text-right text-xl">{formatCurrency(purchase.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex justify-between items-end mt-12 gap-20">
        <div className="text-[10px] italic font-bold leading-relaxed max-w-sm border-l-4 border-black pl-4">
          <p className="font-black mb-1 uppercase tracking-widest text-gray-400">Declaration:</p>
          We certify that the goods described above have been received in good order and the quantity/quality is as specified.
        </div>
        <div className="text-center space-y-4">
          <div className="h-24 w-64 border-2 border-black flex items-center justify-center p-3 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {business.signature ? (
              <img src={business.signature} alt="Sign" className="h-full w-auto object-contain" />
            ) : (
              <span className="text-[10px] italic text-gray-300">Authorized Receiver Signature</span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-tighter italic">Authorized Signatory</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">For {business.businessName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
