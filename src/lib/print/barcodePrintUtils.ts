export type BarcodeLabelSize = "50x25" | "40x20" | "38x25";
export type BarcodePrinterType = "label" | "a4_30" | "a4_24";

export const barcodeSizeMap: Record<BarcodeLabelSize, { width: number; height: number; barcodeHeight: number }> = {
  "50x25": { width: 50, height: 25, barcodeHeight: 32 },
  "40x20": { width: 40, height: 20, barcodeHeight: 24 },
  "38x25": { width: 38, height: 25, barcodeHeight: 27 },
};

export function barcodePageStyle(size: BarcodeLabelSize, printerType: BarcodePrinterType): string {
  const label = barcodeSizeMap[size];
  const page = printerType === "label" ? `${label.width}mm ${label.height}mm` : "A4";
  const margin = printerType === "label" ? "0" : "10mm";
  return `
    @page { size: ${page}; margin: ${margin}; }
    html, body { padding: 0 !important; margin: 0 !important; background: white !important; }
    .barcode-sheet { display: grid !important; grid-template-columns: ${printerType === "label" ? "1fr" : `repeat(${printerType === "a4_30" ? 3 : 3}, ${label.width}mm)`}; gap: ${printerType === "label" ? "0" : "3mm"}; justify-content: center; }
    .barcode-label { width: ${label.width}mm !important; height: ${label.height}mm !important; break-inside: avoid; page-break-inside: avoid; }
  `;
}
