/* eslint-disable @next/next/no-img-element -- Stored business branding must render in isolated print frames. */
import type { BusinessProfile } from "@/types";
import { printGSTIN, showValue } from "../printUtils";

export function PrintBusinessIdentity({ business }: { business: BusinessProfile }) {
  return <div className="flex gap-4">
    {business.logo && <img src={business.logo} alt="Business logo" className="h-16 w-16 shrink-0 object-contain" />}
    <div>
      <h1 className="print-business-name text-2xl font-bold uppercase" style={{ color: "#3730a3" }}>{showValue(business.businessName)}</h1>
      <p className="text-xs text-slate-500">{business.address}</p>
      <p className="text-xs text-slate-500">{business.phone} {business.gstin && ` | GSTIN: ${printGSTIN(business.gstin)}`}</p>
    </div>
  </div>;
}

export function PrintAuthorizedSignature({ business }: { business: BusinessProfile }) {
  return <div className="text-center">
    {business.signature && <img src={business.signature} alt="Authorized signature" className="mx-auto mb-2 h-12 max-w-40 object-contain" />}
    <div className="w-40 border-t pt-2 font-bold">Authorized Signatory</div>
  </div>;
}
