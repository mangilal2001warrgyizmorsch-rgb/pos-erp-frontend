import type { ThermalWidth } from "./printUtils";

export function thermalPageStyle(width: ThermalWidth): string {
  return `
    @page { size: ${width}mm auto; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print-thermal { width: ${width}mm !important; max-width: ${width}mm !important; margin: 0 auto !important; box-sizing: border-box !important; }
    .print-thermal * { box-sizing: border-box !important; max-width: 100%; }
    .print-thermal table { width: 100%; table-layout: fixed; }
  `;
}

export const a4PageStyle = `
  @page { size: A4; margin: 12mm; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-a4 { width: 100% !important; max-width: 186mm !important; margin: 0 auto !important; box-shadow: none !important; }
  .print-a4 table { page-break-inside: auto; }
  .print-a4 thead { display: table-header-group; }
  .print-a4 tr { page-break-inside: avoid; page-break-after: auto; }
  .print-a4 .avoid-break { break-inside: avoid; page-break-inside: avoid; }
`;
