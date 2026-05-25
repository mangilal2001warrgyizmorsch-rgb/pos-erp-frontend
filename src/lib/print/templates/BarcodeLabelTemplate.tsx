import Barcode from "react-barcode";
import { barcodeSizeMap, type BarcodeLabelSize } from "../barcodePrintUtils";

export interface PrintableBarcodeItem { itemName: string; itemCode: string; sku?: string; price?: string; header?: string; }

export function BarcodeLabelTemplate({ item, size, includePrice, includeSku }: { item: PrintableBarcodeItem; size: BarcodeLabelSize; includePrice: boolean; includeSku: boolean; }) {
  const dimensions = barcodeSizeMap[size];
  const compact = size === "40x20";
  return <div className="barcode-label flex flex-col items-center justify-center overflow-hidden border border-slate-200 bg-white px-1 text-black" style={{ width: `${dimensions.width}mm`, height: `${dimensions.height}mm` }}>
    <p className="w-full truncate text-center font-semibold" style={{ fontSize: compact ? 7 : 8 }}>{item.header || item.itemName}</p>
    <Barcode value={item.itemCode} format="CODE128" width={compact ? 0.85 : 1} height={dimensions.barcodeHeight} displayValue fontSize={compact ? 7 : 8} margin={0} background="transparent" />
    <div className="flex max-w-full gap-1 truncate text-center font-medium" style={{ fontSize: compact ? 6.5 : 7.5 }}>
      {includeSku && item.sku && <span>{item.sku}</span>}
      {includePrice && item.price && <span>{item.price}</span>}
    </div>
  </div>;
}
